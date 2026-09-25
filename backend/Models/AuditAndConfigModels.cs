using System.Text.Json.Serialization;

namespace D365.Ess.Api.Models;

public class ODataListResponse<T>
{
    [JsonPropertyName("@odata.context")]
    public string? Context { get; set; }

    [JsonPropertyName("value")]
    public List<T> Value { get; set; } = new();
}

public class AuditLogEntry
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [JsonPropertyName("userName")]
    public string? UserName { get; set; }

    [JsonPropertyName("userRole")]
    public string? UserRole { get; set; }

    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty;

    [JsonPropertyName("endpoint")]
    public string Endpoint { get; set; } = string.Empty;

    [JsonPropertyName("method")]
    public string Method { get; set; } = string.Empty;

    [JsonPropertyName("ipAddress")]
    public string? IpAddress { get; set; }

    [JsonPropertyName("statusCode")]
    public int StatusCode { get; set; }

    [JsonPropertyName("executionDurationMs")]
    public long ExecutionDurationMs { get; set; }

    [JsonPropertyName("details")]
    public string? Details { get; set; }

    [JsonPropertyName("isSecurityEvent")]
    public bool IsSecurityEvent { get; set; }
}

public class D365Settings
{
    public string BaseUrl { get; set; } = string.Empty;
    public string ODataPath { get; set; } = "/data";
    public string TenantId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string ResourceUrl { get; set; } = string.Empty;
    public string LegalEntity { get; set; } = string.Empty;
    public string ReassignmentEndpointPath { get; set; } = "/api/services/PAR_EssAssignmentServiceGroup/PAR_EssAssignmentService/submitAssignment";
    public int TimeoutSeconds { get; set; } = 30;

    public static bool IsValidValue(string? val)
    {
        if (string.IsNullOrWhiteSpace(val)) return false;
        var trimmed = val.Trim();
        if (trimmed.StartsWith("<") || trimmed.EndsWith(">")) return false;
        if (trimmed.Contains("<your-environment>", StringComparison.OrdinalIgnoreCase)) return false;
        if (trimmed.Contains("your-environment", StringComparison.OrdinalIgnoreCase)) return false;
        if (trimmed.Contains("<App Registration", StringComparison.OrdinalIgnoreCase)) return false;
        if (trimmed.Contains("<Microsoft Entra", StringComparison.OrdinalIgnoreCase)) return false;
        if (trimmed.Contains("contoso", StringComparison.OrdinalIgnoreCase)) return false;
        return true;
    }

    public bool IsConfigured =>
        IsValidValue(BaseUrl) &&
        IsValidValue(TenantId) &&
        IsValidValue(ClientId) &&
        IsValidValue(ClientSecret) &&
        IsValidValue(LegalEntity);

    public List<string> GetMissingConfigurations()
    {
        var missing = new List<string>();
        if (!IsValidValue(BaseUrl)) missing.Add("D365Settings__BaseUrl (BaseUrl - missing or placeholder)");
        if (!IsValidValue(TenantId)) missing.Add("D365Settings__TenantId (TenantId - missing or placeholder)");
        if (!IsValidValue(ClientId)) missing.Add("D365Settings__ClientId (ClientId - missing or placeholder)");
        if (!IsValidValue(ClientSecret)) missing.Add("D365Settings__ClientSecret (ClientSecret - missing or invalid)");
        if (!IsValidValue(LegalEntity)) missing.Add("D365Settings__LegalEntity (LegalEntity - missing)");
        return missing;
    }
}

public class EmployeeLoginSettings
{
    public string EmployeeEntitySet { get; set; } = "Employees";
    public string IdentificationEntitySet { get; set; } = "PersonIdentificationNumbers";
    public string NationalIdField { get; set; } = "IdentificationNumber";
    public string NationalIdTypeId { get; set; } = "National ID";
}

public class D365ConfigurationException : Exception
{
    public List<string> MissingFields { get; }

    public D365ConfigurationException(List<string> missingFields)
        : base($"Dynamics 365 configuration is incomplete in backend environment variables. Missing: {string.Join(", ", missingFields)}")
    {
        MissingFields = missingFields;
    }

    public D365ConfigurationException(string message)
        : base(message)
    {
        MissingFields = new List<string>();
    }
}

public class JwtSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "D365.Ess.Api";
    public string Audience { get; set; } = "D365.Ess.Client";
    public int ExpirationMinutes { get; set; } = 120;
}
