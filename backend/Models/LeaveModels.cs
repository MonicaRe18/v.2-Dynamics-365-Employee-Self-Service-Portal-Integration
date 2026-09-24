using System.Text.Json.Serialization;

namespace D365.Ess.Api.Models;

public class LeaveBalanceDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("leaveTypeCode")]
    public string LeaveTypeCode { get; set; } = "ANNUAL";

    [JsonPropertyName("leaveTypeTitle")]
    public string LeaveTypeTitle { get; set; } = string.Empty;

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = "أيام";

    [JsonPropertyName("totalEntitlement")]
    public double TotalEntitlement { get; set; }

    [JsonPropertyName("transferredFromPreviousYear")]
    public double TransferredFromPreviousYear { get; set; }

    [JsonPropertyName("usedDays")]
    public double UsedDays { get; set; }

    [JsonPropertyName("remainingBalance")]
    public double RemainingBalance { get; set; }

    [JsonPropertyName("pendingApprovalDays")]
    public double PendingApprovalDays { get; set; }

    [JsonPropertyName("minDaysPerRequest")]
    public int MinDaysPerRequest { get; set; } = 1;

    [JsonPropertyName("maxDaysPerRequest")]
    public int MaxDaysPerRequest { get; set; } = 30;

    [JsonPropertyName("requiresSubstitute")]
    public bool RequiresSubstitute { get; set; } = true;

    [JsonPropertyName("requiresAttachment")]
    public bool RequiresAttachment { get; set; } = false;

    [JsonPropertyName("year")]
    public int Year { get; set; } = 2025;
}

public class LeaveRequestDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("employeeId")]
    public string EmployeeId { get; set; } = string.Empty;

    [JsonPropertyName("employeeName")]
    public string EmployeeName { get; set; } = string.Empty;

    [JsonPropertyName("leaveTypeCode")]
    public string LeaveTypeCode { get; set; } = string.Empty;

    [JsonPropertyName("leaveTypeTitle")]
    public string LeaveTypeTitle { get; set; } = string.Empty;

    [JsonPropertyName("startDate")]
    public string StartDate { get; set; } = string.Empty;

    [JsonPropertyName("endDate")]
    public string EndDate { get; set; } = string.Empty;

    [JsonPropertyName("requestedDays")]
    public double RequestedDays { get; set; }

    [JsonPropertyName("requestedUnit")]
    public string RequestedUnit { get; set; } = string.Empty;

    [JsonPropertyName("delegatedEmployeeId")]
    public string? DelegatedEmployeeId { get; set; }

    [JsonPropertyName("delegatedEmployeeName")]
    public string? DelegatedEmployeeName { get; set; }

    [JsonPropertyName("delegatedEmployeeTitle")]
    public string? DelegatedEmployeeTitle { get; set; }

    [JsonPropertyName("socialInsuranceOption")]
    public bool SocialInsuranceOption { get; set; } = true;

    [JsonPropertyName("healthInsuranceOption")]
    public bool HealthInsuranceOption { get; set; } = true;

    [JsonPropertyName("attachments")]
    public List<System.Text.Json.JsonElement> Attachments { get; set; } = new();

    [JsonPropertyName("saveAsDraft")]
    public bool SaveAsDraft { get; set; }

    [JsonPropertyName("submissionDate")]
    public string SubmissionDate { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "InReview";

    [JsonPropertyName("statusAr")]
    public string StatusAr { get; set; } = "قيد المراجعة";

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("d365SyncStatus")]
    public string D365SyncStatus { get; set; } = "Synced";
}

public class LeaveMovementTransactionDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("transactionDate")]
    public string TransactionDate { get; set; } = string.Empty;

    [JsonPropertyName("transactionType")]
    public string TransactionType { get; set; } = string.Empty;

    [JsonPropertyName("leaveTypeCode")]
    public string LeaveTypeCode { get; set; } = string.Empty;

    [JsonPropertyName("leaveTypeTitle")]
    public string LeaveTypeTitle { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public double Amount { get; set; }

    [JsonPropertyName("balanceAfter")]
    public double BalanceAfter { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("referenceNumber")]
    public string ReferenceNumber { get; set; } = string.Empty;
}

public class DelegatedEmployeeDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("jobTitle")]
    public string JobTitle { get; set; } = string.Empty;

    [JsonPropertyName("department")]
    public string Department { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("available")]
    public bool Available { get; set; } = true;
}
