using System.Text.Json.Serialization;

namespace D365.Ess.Api.Models;

// Grid fields exposed by the PAR_Penalty menu item. Keep the source names here
// and return the normalized PenaltyDto shape used by the portal.
public class D365PenaltyRecord
{
    public string? GRIDREQUESTID { get; set; }
    public string? GRIDPENALTYSTATUS { get; set; }
    public string? GRIDPENALTYIMPOSITIONDATE { get; set; }
    public string? GRIDPENALTYERASUREDATE { get; set; }

    // Existing integrations may expose the normalized property names instead.
    public string? Id { get; set; }
    public string? PenaltyNumber { get; set; }
    public string? PenaltyStatus { get; set; }
    public string? PenaltyStatusAr { get; set; }
    public string? PenaltySigningDate { get; set; }
    public string? PenaltyStartDate { get; set; }
    public string? PenaltyRemovalDate { get; set; }
    public string? Action { get; set; }
    public string? EmployeePenalty { get; set; }
    public string? Duration { get; set; }
    public string? InvestigationAuthority { get; set; }
    public string? PenaltyDetails { get; set; }
    public bool HasGrievance { get; set; }
    public string? GrievanceStatus { get; set; }
}

public class PenaltyDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("penaltyNumber")]
    public string PenaltyNumber { get; set; } = string.Empty;

    [JsonPropertyName("penaltySigningDate")]
    public string PenaltySigningDate { get; set; } = string.Empty;

    [JsonPropertyName("penaltyStartDate")]
    public string PenaltyStartDate { get; set; } = string.Empty;

    [JsonPropertyName("penaltyRemovalDate")]
    public string PenaltyRemovalDate { get; set; } = string.Empty;

    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty;

    [JsonPropertyName("employeePenalty")]
    public string EmployeePenalty { get; set; } = string.Empty;

    [JsonPropertyName("duration")]
    public string Duration { get; set; } = string.Empty;

    [JsonPropertyName("penaltyStatus")]
    public string PenaltyStatus { get; set; } = "Active";

    [JsonPropertyName("penaltyStatusAr")]
    public string PenaltyStatusAr { get; set; } = "ساري";

    [JsonPropertyName("investigationAuthority")]
    public string InvestigationAuthority { get; set; } = string.Empty;

    [JsonPropertyName("penaltyDetails")]
    public string PenaltyDetails { get; set; } = string.Empty;

    [JsonPropertyName("hasGrievance")]
    public bool HasGrievance { get; set; } = false;

    [JsonPropertyName("grievanceStatus")]
    public string? GrievanceStatus { get; set; }
}

public class GrievanceDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("penaltyId")]
    public string PenaltyId { get; set; } = string.Empty;

    [JsonPropertyName("penaltyNumber")]
    public string PenaltyNumber { get; set; } = string.Empty;

    [JsonPropertyName("grievanceDate")]
    public string GrievanceDate { get; set; } = string.Empty;

    [JsonPropertyName("grievanceSubject")]
    public string GrievanceSubject { get; set; } = string.Empty;

    [JsonPropertyName("grievanceDetails")]
    public string GrievanceDetails { get; set; } = string.Empty;

    [JsonPropertyName("attachments")]
    public List<string> Attachments { get; set; } = new();

    [JsonPropertyName("submissionDate")]
    public string SubmissionDate { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Pending";

    [JsonPropertyName("statusAr")]
    public string StatusAr { get; set; } = "قيد الدراسة لدى لجنة التظلمات";
}

public class GrievanceRequestModel
{
    [JsonPropertyName("penaltyId")]
    public string PenaltyId { get; set; } = string.Empty;

    [JsonPropertyName("penaltyNumber")]
    public string? PenaltyNumber { get; set; }

    [JsonPropertyName("grievanceSubject")]
    public string? GrievanceSubject { get; set; }

    [JsonPropertyName("reasons")]
    public string? Reasons { get; set; }

    [JsonPropertyName("grievanceDetails")]
    public string? GrievanceDetails { get; set; }

    [JsonPropertyName("attachments")]
    public List<string>? Attachments { get; set; }
}
