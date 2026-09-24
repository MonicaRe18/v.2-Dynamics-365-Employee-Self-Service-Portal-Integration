using System.Text.Json.Serialization;

namespace D365.Ess.Api.Models;

public class MonitoringAttachmentDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("fileName")]
    public string FileName { get; set; } = string.Empty;

    [JsonPropertyName("fileSize")]
    public string FileSize { get; set; } = string.Empty;

    [JsonPropertyName("fileType")]
    public string FileType { get; set; } = "application/pdf";

    [JsonPropertyName("uploadDate")]
    public string UploadDate { get; set; } = string.Empty;
}

public class MonitoringOperationDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = string.Empty;

    [JsonPropertyName("operationType")]
    public string OperationType { get; set; } = string.Empty;

    [JsonPropertyName("actionTitle")]
    public string ActionTitle { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("referenceNumber")]
    public string ReferenceNumber { get; set; } = string.Empty;

    [JsonPropertyName("entity")]
    public string Entity { get; set; } = string.Empty;

    [JsonPropertyName("details")]
    public string Details { get; set; } = string.Empty;

    [JsonPropertyName("user")]
    public string User { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "تم التقديم";

    [JsonPropertyName("attachmentsCount")]
    public int AttachmentsCount { get; set; }

    [JsonPropertyName("attachments")]
    public List<MonitoringAttachmentDto> Attachments { get; set; } = new();
}

public class FinancialDisclosureModel
{
    [JsonPropertyName("workerId")]
    public string WorkerId { get; set; } = string.Empty;

    [JsonPropertyName("disclosureType")]
    public string DisclosureType { get; set; } = "إقرار دوري";

    [JsonPropertyName("filingYear")]
    public int FilingYear { get; set; } = DateTime.UtcNow.Year;

    [JsonPropertyName("submissionDate")]
    public string SubmissionDate { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd");

    [JsonPropertyName("declaredAssetsValue")]
    public double? DeclaredAssetsValue { get; set; }

    [JsonPropertyName("declaredLiabilitiesValue")]
    public double? DeclaredLiabilitiesValue { get; set; }

    [JsonPropertyName("hasRealEstate")]
    public bool HasRealEstate { get; set; }

    [JsonPropertyName("hasCommercialActivities")]
    public bool HasCommercialActivities { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("attachments")]
    public List<MonitoringAttachmentDto>? Attachments { get; set; }
}

public class DrugTestModel
{
    [JsonPropertyName("workerId")]
    public string WorkerId { get; set; } = string.Empty;

    [JsonPropertyName("testDate")]
    public string TestDate { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd");

    [JsonPropertyName("sampleType")]
    public string SampleType { get; set; } = "عينة بول دورية";

    [JsonPropertyName("medicalFacility")]
    public string MedicalFacility { get; set; } = "المعمل المشترك المعتمد";

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("attachments")]
    public List<MonitoringAttachmentDto>? Attachments { get; set; }
}

public class UpdateMonitoringStatusModel
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("note")]
    public string? Note { get; set; }
}

public class UnifiedRequestItemDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("statusBadge")]
    public string StatusBadge { get; set; } = "in_review";

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = "file";
}
