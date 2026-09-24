using System.Security.Claims;
using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace D365.Ess.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IAuditLogger _auditLogger;

    public AuthController(IAuthService authService, IAuditLogger auditLogger)
    {
        _authService = authService;
        _auditLogger = auditLogger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var response = await _authService.LoginAsync(request, ip, ct);

        if (!response.Success)
        {
            return Unauthorized(response);
        }

        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<UserDto> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        var primaryRole = roles.FirstOrDefault() ?? UserRoles.EssUser;

        var user = new UserDto
        {
            Id = userId,
            CivilId = User.FindFirst("civilId")?.Value ?? string.Empty,
            Name = User.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty,
            Email = User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty,
            JobTitle = User.FindFirst("jobTitle")?.Value ?? string.Empty,
            Department = User.FindFirst("department")?.Value ?? string.Empty,
            Division = User.FindFirst("division")?.Value,
            LegalEntity = User.FindFirst("legalEntity")?.Value,
            Role = primaryRole,
            Roles = roles,
            IsActive = true
        };

        return Ok(user);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        var workerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var nationalId = User.FindFirst("civilId")?.Value;
        if (string.IsNullOrWhiteSpace(workerId) || string.IsNullOrWhiteSpace(nationalId)) return Unauthorized();
        if (string.IsNullOrEmpty(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword)
            || request.NewPassword.Length is < 8 or > 50)
            return BadRequest(new { error = new { message = "كلمة المرور الجديدة يجب أن تتكون من 8 إلى 50 حرفاً." } });
        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
            return BadRequest(new { error = new { message = "تأكيد كلمة المرور الجديدة غير مطابق." } });
        if (string.Equals(request.CurrentPassword, request.NewPassword, StringComparison.Ordinal))
            return BadRequest(new { error = new { message = "اختر كلمة مرور جديدة مختلفة عن الحالية." } });

        var changed = await _authService.ChangePasswordAsync(workerId, nationalId,
            request.CurrentPassword, request.NewPassword, ct);
        if (!changed)
            return BadRequest(new { error = new { message = "كلمة المرور الحالية غير صحيحة أو تعذر تحديد الموظف." } });

        _auditLogger.LogAction(
            action: "PASSWORD_CHANGED", endpoint: "/api/auth/change-password", method: "POST",
            statusCode: 200, durationMs: 0, userId: workerId,
            userName: User.FindFirst(ClaimTypes.Name)?.Value,
            ip: HttpContext.Connection.RemoteIpAddress?.ToString(),
            details: "Portal password changed; no password values logged", isSecurity: true);
        return Ok(new { success = true });
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        _auditLogger.LogAction(
            action: "LOGOUT",
            endpoint: "/api/auth/logout",
            method: "POST",
            statusCode: 200,
            durationMs: 1,
            userId: userId,
            userName: userName,
            userRole: userRole,
            ip: ip,
            details: "User logged out successfully",
            isSecurity: true
        );

        return Ok(new { success = true, message = "تم تسجيل الخروج بنجاح" });
    }
}
