using System.Text.Json.Serialization;

namespace D365.Ess.Api.Models;

public class TeamMemberRequestDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("employeeId")]
    public string EmployeeId { get; set; } = string.Empty;

    [JsonPropertyName("employeeName")]
    public string EmployeeName { get; set; } = string.Empty;

    [JsonPropertyName("employeeJobTitle")]
    public string EmployeeJobTitle { get; set; } = string.Empty;

    [JsonPropertyName("requestType")]
    public string RequestType { get; set; } = string.Empty;

    [JsonPropertyName("details")]
    public string Details { get; set; } = string.Empty;

    [JsonPropertyName("submissionDate")]
    public string SubmissionDate { get; set; } = string.Empty;

    [JsonPropertyName("dates")]
    public string Dates { get; set; } = string.Empty;

    [JsonPropertyName("duration")]
    public string Duration { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "معلق"; // معلق, معتمد, مرفوض

    [JsonPropertyName("decisionDate")]
    public string? DecisionDate { get; set; }

    [JsonPropertyName("managerNotes")]
    public string? ManagerNotes { get; set; }
}

public class TeamMemberDto
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

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [JsonPropertyName("hireDate")]
    public string HireDate { get; set; } = string.Empty;

    [JsonPropertyName("annualLeaveBalance")]
    public double AnnualLeaveBalance { get; set; }

    [JsonPropertyName("casualLeaveBalance")]
    public double CasualLeaveBalance { get; set; }

    [JsonPropertyName("avatarUrl")]
    public string? AvatarUrl { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "قائم بالعمل";

    [JsonPropertyName("statusEn")]
    public string StatusEn { get; set; } = "Active";

    [JsonPropertyName("requests")]
    public List<TeamMemberRequestDto> Requests { get; set; } = new();
}

public class ApproveRequestModel
{
    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}

public class RejectRequestModel
{
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;
}

public class LeaveOnBehalfModel
{
    [JsonPropertyName("memberId")]
    public string MemberId { get; set; } = string.Empty;

    [JsonPropertyName("leaveType")]
    public string LeaveType { get; set; } = "إجازة اعتيادية";

    [JsonPropertyName("startDate")]
    public string StartDate { get; set; } = string.Empty;

    [JsonPropertyName("endDate")]
    public string EndDate { get; set; } = string.Empty;

    [JsonPropertyName("days")]
    public double Days { get; set; } = 1;

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}

public class AbsenceOnBehalfModel
{
    [JsonPropertyName("memberId")]
    public string MemberId { get; set; } = string.Empty;

    [JsonPropertyName("duration")]
    public string Duration { get; set; } = "2 ساعة";

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;
}
