using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using D365.Ess.Api.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace D365.Ess.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken ct = default);
    Task<UserDto?> GetUserByIdAsync(string id, CancellationToken ct = default);
    Task<bool> ChangePasswordAsync(string workerId, string nationalId, string currentPassword, string newPassword, CancellationToken ct = default);
    string GenerateJwtToken(UserDto user);
}

public class AuthService : IAuthService
{
    private readonly JwtSettings _jwtSettings;
    private readonly D365Settings _d365Settings;
    private readonly EmployeeLoginSettings _employeeLoginSettings;
    private readonly ID365Client _d365Client;
    private readonly IWorkerPortalPasswordVerifier _portalPasswordVerifier;
    private readonly IAuditLogger _auditLogger;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IOptions<JwtSettings> jwtOptions,
        IOptions<D365Settings> d365Options,
        IOptions<EmployeeLoginSettings> employeeLoginOptions,
        ID365Client d365Client,
        IWorkerPortalPasswordVerifier portalPasswordVerifier,
        IAuditLogger auditLogger,
        ILogger<AuthService> logger)
    {
        _jwtSettings = jwtOptions.Value;
        _d365Settings = d365Options.Value;
        _employeeLoginSettings = employeeLoginOptions.Value;
        _d365Client = d365Client;
        _portalPasswordVerifier = portalPasswordVerifier;
        _auditLogger = auditLogger;
        _logger = logger;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken ct = default)
    {
        var cleanUsername = request.Username?.Trim().Replace(" ", "") ?? string.Empty;
        // Passwords are exact values; trimming would change a valid credential.
        var cleanPassword = request.Password ?? string.Empty;

        if (string.IsNullOrEmpty(cleanUsername) || string.IsNullOrEmpty(cleanPassword))
        {
            _auditLogger.LogAction(
                action: "LOGIN_FAILED",
                endpoint: "/api/auth/login",
                method: "POST",
                statusCode: 400,
                durationMs: 5,
                userName: cleanUsername,
                ip: ipAddress,
                details: "Missing username or password",
                isSecurity: true
            );

            return new AuthResponse
            {
                Success = false,
                ErrorMessage = "يرجى إدخال اسم المستخدم وكلمة المرور"
            };
        }

        if (!_d365Settings.IsConfigured)
        {
            _logger.LogWarning("Login attempted while Dynamics 365 configuration is incomplete.");
            return new AuthResponse
            {
                Success = false,
                ErrorMessage = "إعدادات الربط مع Microsoft Dynamics 365 غير متوفرة أو غير مكتملة في متغيرات بيئة الخادم."
            };
        }

        try
        {
            // PAR_IdentificationNumber is displayed on HcmWorkerListPage_Employees,
            // but the deployed OData metadata exposes the value through the person
            // identification entity. Resolve its PartyNumber, then load Employees.
            var nationalId = EscapeODataString(cleanUsername);
            var nationalIdType = EscapeODataString(_employeeLoginSettings.NationalIdTypeId);
            var identificationFilter = $"{_employeeLoginSettings.NationalIdField} eq '{nationalId}' and IdentificationTypeId eq '{nationalIdType}'";
            var identificationResult = await _d365Client.GetAsync<ODataListResponse<D365PersonIdentificationRecord>>(
                _employeeLoginSettings.IdentificationEntitySet,
                $"$filter={Uri.EscapeDataString(identificationFilter)}&$top=1",
                ct
            );

            var identification = identificationResult?.Value?.FirstOrDefault();
            D365EmployeeRecord? employee = null;
            if (!string.IsNullOrWhiteSpace(identification?.PartyNumber))
            {
                var partyNumber = EscapeODataString(identification.PartyNumber);
                var employeeFilter = $"PartyNumber eq '{partyNumber}'";
                var employeeResult = await _d365Client.GetAsync<ODataListResponse<D365EmployeeRecord>>(
                    _employeeLoginSettings.EmployeeEntitySet,
                    $"cross-company=true&$filter={Uri.EscapeDataString(employeeFilter)}&$top=1",
                    ct
                );
                employee = employeeResult?.Value?.FirstOrDefault();
            }

            if (employee == null)
            {
                _auditLogger.LogAction(
                    action: "LOGIN_FAILED",
                    endpoint: "/api/auth/login",
                    method: "POST",
                    statusCode: 401,
                    durationMs: 20,
                    userName: cleanUsername,
                    ip: ipAddress,
                    details: "Employee not found in Dynamics 365 directory",
                    isSecurity: true
                );

                return new AuthResponse
                {
                    Success = false,
                    ErrorMessage = "الرقم القومي أو كلمة المرور غير صحيحة"
                };
            }

            if (!await _portalPasswordVerifier.VerifyAsync(
                    employee.PersonnelNumber, identification!.PartyNumber, cleanPassword, ct))
            {
                _auditLogger.LogAction(
                    action: "LOGIN_FAILED",
                    endpoint: "/api/auth/login",
                    method: "POST",
                    statusCode: 401,
                    durationMs: 20,
                    userName: cleanUsername,
                    ip: ipAddress,
                    details: "Invalid employee credentials",
                    isSecurity: true
                );
                return new AuthResponse
                {
                    Success = false,
                    ErrorMessage = "الرقم القومي أو كلمة المرور غير صحيحة"
                };
            }

            // Derive roles dynamically from Dynamics 365 data
            var roles = new List<string> { UserRoles.EssUser };

            var primaryRole = roles.Contains(UserRoles.MssMgr) ? UserRoles.MssMgr : UserRoles.EssUser;

            var user = new UserDto
            {
                Id = employee.PersonnelNumber,
                CivilId = identification!.IdentificationNumber,
                Name = employee.Name,
                JobTitle = employee.JobTitle,
                Department = employee.Department,
                Division = employee.Division,
                Email = employee.PrimaryContactEmail,
                Phone = employee.PrimaryContactPhone,
                LegalEntity = employee.LegalEntityId,
                Role = primaryRole,
                Roles = roles,
                AvatarUrl = employee.AvatarUrl,
                IsActive = employee.EmploymentStatus?.Equals("Active", StringComparison.OrdinalIgnoreCase) ?? true,
            };

            var token = GenerateJwtToken(user);
            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes).ToUnixTimeMilliseconds();

            _auditLogger.LogAction(
                action: "LOGIN_SUCCESS",
                endpoint: "/api/auth/login",
                method: "POST",
                statusCode: 200,
                durationMs: 35,
                userId: user.Id,
                userName: user.Name,
                userRole: user.Role,
                ip: ipAddress,
                details: $"Authenticated via Dynamics 365 with roles: [{string.Join(", ", user.Roles)}]",
                isSecurity: true
            );

            return new AuthResponse
            {
                Success = true,
                Token = token,
                User = user,
                ExpiresAt = expiresAt
            };
        }
        catch (D365ConfigurationException ex)
        {
            _logger.LogError(ex, "Dynamics 365 configuration error during login");
            return new AuthResponse
            {
                Success = false,
                ErrorMessage = "إعدادات الربط مع Microsoft Dynamics 365 غير متوفرة أو غير مكتملة."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during login authentication with Dynamics 365");
            return new AuthResponse
            {
                Success = false,
                ErrorMessage = "تعذر إتمام عملية تسجيل الدخول عبر خادم Dynamics 365."
            };
        }
    }

    public async Task<UserDto?> GetUserByIdAsync(string id, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(id) || !_d365Settings.IsConfigured)
        {
            return null;
        }

        try
        {
            var personnelNumber = EscapeODataString(id.Trim());
            var filter = $"PersonnelNumber eq '{personnelNumber}'";
            var result = await _d365Client.GetAsync<ODataListResponse<D365EmployeeRecord>>(
                _employeeLoginSettings.EmployeeEntitySet,
                $"cross-company=true&$filter={Uri.EscapeDataString(filter)}&$top=1",
                ct);
            var emp = result?.Value?.FirstOrDefault();
            if (emp == null) return null;

            var nationalId = string.Empty;
            if (!string.IsNullOrWhiteSpace(emp.PartyNumber))
            {
                var partyNumber = EscapeODataString(emp.PartyNumber);
                var nationalIdType = EscapeODataString(_employeeLoginSettings.NationalIdTypeId);
                var identificationFilter = $"PartyNumber eq '{partyNumber}' and IdentificationTypeId eq '{nationalIdType}'";
                var identificationResult = await _d365Client.GetAsync<ODataListResponse<D365PersonIdentificationRecord>>(
                    _employeeLoginSettings.IdentificationEntitySet,
                    $"$filter={Uri.EscapeDataString(identificationFilter)}&$top=1",
                    ct);
                nationalId = identificationResult?.Value?.FirstOrDefault()?.IdentificationNumber ?? string.Empty;
            }

            return new UserDto
            {
                Id = emp.PersonnelNumber,
                CivilId = nationalId,
                Name = emp.Name,
                JobTitle = emp.JobTitle,
                Department = emp.Department,
                Division = emp.Division,
                Email = emp.PrimaryContactEmail,
                Phone = emp.PrimaryContactPhone,
                LegalEntity = emp.LegalEntityId,
                Role = UserRoles.EssUser,
                Roles = new List<string> { UserRoles.EssUser },
                AvatarUrl = emp.AvatarUrl,
                IsActive = true
            };
        }
        catch
        {
            return null;
        }
    }

    public async Task<bool> ChangePasswordAsync(string workerId, string nationalId, string currentPassword, string newPassword, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(workerId) || string.IsNullOrWhiteSpace(nationalId)) return false;

        var nationalIdFilter = $"{_employeeLoginSettings.NationalIdField} eq '{EscapeODataString(nationalId)}' and IdentificationTypeId eq '{EscapeODataString(_employeeLoginSettings.NationalIdTypeId)}'";
        var identification = (await _d365Client.GetAsync<ODataListResponse<D365PersonIdentificationRecord>>(
            _employeeLoginSettings.IdentificationEntitySet,
            $"$filter={Uri.EscapeDataString(nationalIdFilter)}&$top=1", ct))?.Value?.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(identification?.PartyNumber)) return false;

        var workerFilter = $"PersonnelNumber eq '{EscapeODataString(workerId)}' and PartyNumber eq '{EscapeODataString(identification.PartyNumber)}'";
        var worker = (await _d365Client.GetAsync<ODataListResponse<D365EmployeeRecord>>(
            _employeeLoginSettings.EmployeeEntitySet,
            $"cross-company=true&$filter={Uri.EscapeDataString(workerFilter)}&$top=1", ct))?.Value?.FirstOrDefault();
        if (worker == null) return false;

        return await _portalPasswordVerifier.ChangeAsync(workerId, identification.PartyNumber, currentPassword, newPassword, ct);
    }

    private static string EscapeODataString(string value) =>
        value.Replace("'", "''", StringComparison.Ordinal);

    public string GenerateJwtToken(UserDto user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email),
            new("civilId", user.CivilId),
            new("jobTitle", user.JobTitle),
            new("department", user.Department),
            new("legalEntity", user.LegalEntity ?? "EG01")
        };

        if (!string.IsNullOrEmpty(user.Division))
        {
            claims.Add(new Claim("division", user.Division));
        }

        // Add standard roles
        foreach (var role in user.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // Guarantee primary role claim
        if (!user.Roles.Contains(user.Role))
        {
            claims.Add(new Claim(ClaimTypes.Role, user.Role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
