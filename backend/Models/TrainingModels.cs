using System.Text.Json.Serialization;

namespace D365.Ess.Api.Models;

public class TrainingCourseDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("courseId")]
    public string CourseId { get; set; } = string.Empty;

    [JsonPropertyName("courseTitle")]
    public string CourseTitle { get; set; } = string.Empty;

    [JsonPropertyName("trainingCenter")]
    public string TrainingCenter { get; set; } = string.Empty;

    [JsonPropertyName("startDate")]
    public string StartDate { get; set; } = string.Empty;

    [JsonPropertyName("endDate")]
    public string EndDate { get; set; } = string.Empty;

    [JsonPropertyName("durationHours")]
    public int DurationHours { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Completed";

    [JsonPropertyName("statusAr")]
    public string StatusAr { get; set; } = "مكتملة";

    [JsonPropertyName("generalEvaluationStatus")]
    public string GeneralEvaluationStatus { get; set; } = "PendingEvaluation";

    [JsonPropertyName("generalEvaluationScore")]
    public string? GeneralEvaluationScore { get; set; }

    [JsonPropertyName("location")]
    public string Location { get; set; } = "عن بُعد (Online)";

    [JsonPropertyName("instructorName")]
    public string InstructorName { get; set; } = string.Empty;
}

public class TrainingEvaluationDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("courseId")]
    public string CourseId { get; set; } = string.Empty;

    [JsonPropertyName("courseTitle")]
    public string CourseTitle { get; set; } = string.Empty;

    [JsonPropertyName("submissionDate")]
    public string SubmissionDate { get; set; } = string.Empty;

    [JsonPropertyName("trainerKnowledge")]
    public string TrainerKnowledge { get; set; } = "ممتاز";

    [JsonPropertyName("trainerEngagement")]
    public string TrainerEngagement { get; set; } = "ممتاز";

    [JsonPropertyName("courseContent")]
    public string CourseContent { get; set; } = "ممتاز";

    [JsonPropertyName("overallProgramEvaluation")]
    public string OverallProgramEvaluation { get; set; } = "ممتاز";

    [JsonPropertyName("programDuration")]
    public string ProgramDuration { get; set; } = "جيد جداً";

    [JsonPropertyName("positiveFeedback")]
    public string? PositiveFeedback { get; set; }

    [JsonPropertyName("improvementSuggestions")]
    public string? ImprovementSuggestions { get; set; }
}

public class TrainingEvaluationRequestModel
{
    [JsonPropertyName("courseId")]
    public string CourseId { get; set; } = string.Empty;

    [JsonPropertyName("trainerKnowledge")]
    public string? TrainerKnowledge { get; set; }

    [JsonPropertyName("trainerEngagement")]
    public string? TrainerEngagement { get; set; }

    [JsonPropertyName("courseContent")]
    public string? CourseContent { get; set; }

    [JsonPropertyName("overallProgramEvaluation")]
    public string? OverallProgramEvaluation { get; set; }

    [JsonPropertyName("programDuration")]
    public string? ProgramDuration { get; set; }

    [JsonPropertyName("comments")]
    public string? Comments { get; set; }
}
