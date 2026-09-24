using System.Text.Json.Serialization;

namespace D365.Ess.Api.Models;

public static class UserRoles
{
    public const string EssUser = "ESS_USER";
    public const string MssMgr = "MSS_MGR";
    public const string HrAdmin = "HR_ADMIN";
    public const string SystemAdmin = "SYSTEM_ADMIN";
}

public class LoginRequest
{
    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;

    [JsonPropertyName("rememberMe")]
    public bool RememberMe { get; set; } = false;
}

public class ChangePasswordRequest
{
    [JsonPropertyName("currentPassword")]
    public string CurrentPassword { get; set; } = string.Empty;

    [JsonPropertyName("newPassword")]
    public string NewPassword { get; set; } = string.Empty;

    [JsonPropertyName("confirmPassword")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class UserDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("civilId")]
    public string CivilId { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("jobTitle")]
    public string JobTitle { get; set; } = string.Empty;

    [JsonPropertyName("department")]
    public string Department { get; set; } = string.Empty;

    [JsonPropertyName("division")]
    public string? Division { get; set; }

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("legalEntity")]
    public string? LegalEntity { get; set; }

    [JsonPropertyName("role")]
    public string Role { get; set; } = UserRoles.EssUser;

    [JsonPropertyName("roles")]
    public List<string> Roles { get; set; } = new();

    [JsonPropertyName("avatarUrl")]
    public string? AvatarUrl { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;
}

public class AuthResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("token")]
    public string? Token { get; set; }

    [JsonPropertyName("user")]
    public UserDto? User { get; set; }

    [JsonPropertyName("expiresAt")]
    public long? ExpiresAt { get; set; }

    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; set; }
}
