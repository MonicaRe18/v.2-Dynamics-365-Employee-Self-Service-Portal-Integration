namespace D365.Ess.Api.Services;

// Localize known Dynamics codes for presentation only. Never change IDs or
// free-text names/descriptions that do not have a verified Arabic source.
internal static class ArabicDisplay
{
    public static string LeaveType(string code, string? description)
    {
        if (ContainsArabic(description)) return description!;
        return code.Trim().ToUpperInvariant() switch
        {
            "ANNUAL" => "إجازة سنوية",
            "SICK" => "إجازة مرضية",
            "BEREAVEMENT" => "إجازة وفاة",
            "PTO" => "إجازة مدفوعة الأجر",
            "VACATION" => "إجازة اعتيادية مدفوعة الأجر",
            "CASUAL" => "إجازة عارضة",
            "MATERNITY" => "إجازة أمومة",
            "HAJJ" => "إجازة حج",
            "COMPENSATORY" => "إجازة تعويضية",
            "FAMILY_CARE" => "إجازة رعاية الأسرة",
            "CHILD_CARE" => "إجازة رعاية الطفل",
            _ => description ?? code
        };
    }

    public static string Unit(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "days" or "day" => "أيام",
        "hours" or "hour" => "ساعات",
        _ => value ?? string.Empty
    };

    public static bool IsDayUnit(string? value) =>
        value is not null && (value.Equals("Days", StringComparison.OrdinalIgnoreCase)
            || value.Equals("أيام", StringComparison.Ordinal));

    public static string LeaveStatus(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "draft" => "مسودة",
        "submitted" => "مقدم",
        "inreview" or "in review" => "قيد المراجعة",
        "approved" => "معتمد",
        "completed" => "مكتمل",
        "denied" or "rejected" => "مرفوض",
        "canceled" or "cancelled" => "ملغى",
        "failed" => "فشل",
        "processing" => "جارٍ المعالجة",
        "changerequested" => "مطلوب تعديل",
        _ => value ?? string.Empty
    };

    public static string EmploymentCategory(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "intern" => "متدرب/ة",
        "active" => "نشط",
        "employee" => "موظف/ة",
        "contractor" => "متعاقد/ة",
        "temporary" => "مؤقت",
        "permanent" => "دائم",
        _ => value ?? string.Empty
    };

    public static string PenaltyStatus(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "active" => "ساري",
        "undergrievance" => "قيد التظلم",
        "grievanceaccepted" => "قُبل التظلم",
        "canceled" or "cancelled" => "ملغى",
        "expired" => "منتهي",
        _ => value ?? string.Empty
    };

    public static string TrainingStatus(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "attended" => "حضر",
        "registered" => "مسجل",
        "canceled" or "cancelled" => "ملغى",
        "completed" => "مكتمل",
        "pending" => "قيد الانتظار",
        "evaluated" => "تم التقييم",
        "pendingevaluation" => "بانتظار التقييم",
        "notapplicable" => "لا ينطبق",
        _ => value ?? string.Empty
    };

    public static string YesNo(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "yes" or "true" => "نعم",
        "no" or "false" => "لا",
        _ => value ?? string.Empty
    };

    public static string MaritalStatus(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "married" => "متزوج/ة",
        "single" => "أعزب/عزباء",
        "divorced" => "مطلق/ة",
        "widowed" => "أرمل/ة",
        _ => value ?? string.Empty
    };

    private static bool ContainsArabic(string? value) =>
        !string.IsNullOrWhiteSpace(value) && value.Any(c => c is >= '\u0600' and <= '\u06FF');
}
