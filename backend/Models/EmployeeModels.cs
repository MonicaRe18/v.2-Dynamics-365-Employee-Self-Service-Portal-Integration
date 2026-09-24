using System.Text.Json.Serialization;

namespace D365.Ess.Api.Models;

public class PersonalDetailsDto
{
    [JsonPropertyName("maritalStatus")]
    public string MaritalStatus { get; set; } = "متزوجة";

    [JsonPropertyName("maritalStatusDate")]
    public string? MaritalStatusDate { get; set; }

    [JsonPropertyName("dependentsCount")]
    public int DependentsCount { get; set; } = 2;

    [JsonPropertyName("spouseWorking")]
    public string SpouseWorking { get; set; } = "نعم";

    [JsonPropertyName("religion")]
    public string Religion { get; set; } = "مسلم";

    [JsonPropertyName("educationQualification")]
    public string EducationQualification { get; set; } = "بكالوريوس حاسبات ومعلومات - علوم الحاسب";

    [JsonPropertyName("retirementDate")]
    public string RetirementDate { get; set; } = "2045-09-18";

    [JsonPropertyName("isDisabled")]
    public string IsDisabled { get; set; } = "لا";

    [JsonPropertyName("verificationDate")]
    public string? VerificationDate { get; set; }
}

public class EmployeeDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("jobTitle")]
    public string JobTitle { get; set; } = string.Empty;

    [JsonPropertyName("department")]
    public string Department { get; set; } = string.Empty;

    [JsonPropertyName("division")]
    public string Division { get; set; } = string.Empty;

    [JsonPropertyName("hireDate")]
    public string HireDate { get; set; } = string.Empty;

    [JsonPropertyName("directManager")]
    public string DirectManager { get; set; } = string.Empty;

    [JsonPropertyName("jobGrade")]
    public string JobGrade { get; set; } = string.Empty;

    [JsonPropertyName("jobGroup")]
    public string JobGroup { get; set; } = string.Empty;

    [JsonPropertyName("employmentStatus")]
    public string EmploymentStatus { get; set; } = "Active";

    [JsonPropertyName("employmentStatusAr")]
    public string EmploymentStatusAr { get; set; } = "قائم بالعمل";

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [JsonPropertyName("legalEntity")]
    public string LegalEntity { get; set; } = string.Empty;

    [JsonPropertyName("civilId")]
    public string CivilId { get; set; } = string.Empty;

    [JsonPropertyName("avatarUrl")]
    public string? AvatarUrl { get; set; }

    [JsonPropertyName("yearsOfService")]
    public string? YearsOfService { get; set; }

    [JsonPropertyName("personalDetails")]
    public PersonalDetailsDto? PersonalDetails { get; set; }
}

// Internal representation of the public D365 F&O employee data entity.
// Keep this separate from EmployeeDto because OData field names are part of
// the F&O integration contract, while EmployeeDto is the ESS API contract.
public class D365EmployeeRecord
{
    [JsonPropertyName("PersonnelNumber")]
    public string PersonnelNumber { get; set; } = string.Empty;

    [JsonPropertyName("PartyNumber")]
    public string PartyNumber { get; set; } = string.Empty;

    [JsonPropertyName("Name")]
    public string Name { get; set; } = string.Empty;

    public string EmploymentStartDate { get; set; } = string.Empty;

    public string MaritalStatus { get; set; } = string.Empty;

    public int NumberOfDependents { get; set; }

    public string IsDisabled { get; set; } = string.Empty;

    public string DisabledVerificationDate { get; set; } = string.Empty;

    public string Education { get; set; } = string.Empty;

    public string PensionStart { get; set; } = string.Empty;

    [JsonPropertyName("JobTitle")]
    public string JobTitle { get; set; } = string.Empty;

    [JsonPropertyName("Department")]
    public string Department { get; set; } = string.Empty;

    [JsonPropertyName("Division")]
    public string Division { get; set; } = string.Empty;

    [JsonPropertyName("PrimaryContactEmail")]
    public string PrimaryContactEmail { get; set; } = string.Empty;

    [JsonPropertyName("PrimaryContactPhone")]
    public string PrimaryContactPhone { get; set; } = string.Empty;

    [JsonPropertyName("EmploymentLegalEntityId")]
    public string LegalEntityId { get; set; } = string.Empty;

    [JsonPropertyName("EmploymentStatus")]
    public string EmploymentStatus { get; set; } = string.Empty;

    [JsonPropertyName("AvatarUrl")]
    public string? AvatarUrl { get; set; }
}

public class D365PersonIdentificationRecord
{
    [JsonPropertyName("IdentificationNumber")]
    public string IdentificationNumber { get; set; } = string.Empty;

    [JsonPropertyName("PartyNumber")]
    public string PartyNumber { get; set; } = string.Empty;
}

public class PerformanceEvaluationDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("year")]
    public int Year { get; set; }

    [JsonPropertyName("rating")]
    public string Rating { get; set; } = string.Empty;

    [JsonPropertyName("score")]
    public double Score { get; set; }

    [JsonPropertyName("evaluatorName")]
    public string EvaluatorName { get; set; } = string.Empty;

    [JsonPropertyName("evaluationDate")]
    public string EvaluationDate { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Approved";

    [JsonPropertyName("strengths")]
    public List<string> Strengths { get; set; } = new();

    [JsonPropertyName("developmentAreas")]
    public List<string> DevelopmentAreas { get; set; } = new();
}

public class D365NotificationDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = string.Empty;

    [JsonPropertyName("isRead")]
    public bool IsRead { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = "info";
}
