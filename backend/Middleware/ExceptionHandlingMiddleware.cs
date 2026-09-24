using System.Net;
using System.Text.Json;
using D365.Ess.Api.Models;

namespace D365.Ess.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception processing request {Method} {Path}", context.Request.Method, context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json; charset=utf-8";

        if (exception is D365ConfigurationException configEx)
        {
            context.Response.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
            var configResponse = new
            {
                error = new
                {
                    code = "D365_CONFIGURATION_MISSING",
                    message = "إعدادات الربط مع Microsoft Dynamics 365 غير متوفرة أو غير مكتملة في متغيرات بيئة الخادم.",
                    missingFields = configEx.MissingFields,
                    details = configEx.Message,
                    help = "يرجى تعيين متغيرات البيئة الخاصة بـ Dynamics 365 على الخادم: D365Settings__BaseUrl, D365Settings__TenantId, D365Settings__ClientId, D365Settings__ClientSecret, D365Settings__LegalEntity"
                },
                timestamp = DateTime.UtcNow.ToString("O"),
                path = context.Request.Path.Value
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(configResponse));
            return;
        }

        context.Response.StatusCode = exception is ArgumentException
            ? (int)HttpStatusCode.BadRequest
            : (int)HttpStatusCode.InternalServerError;

        var errorResponse = new
        {
            error = new
            {
                code = "INTERNAL_SERVER_ERROR",
                message = exception is ArgumentException || exception is InvalidOperationException
                    && exception.Message.StartsWith("Dynamics created draft ", StringComparison.Ordinal)
                    ? exception.Message : "حدث خطأ في خادم Dynamics 365.",
                details = exception.Message
            },
            timestamp = DateTime.UtcNow.ToString("O"),
            path = context.Request.Path.Value
        };

        var json = JsonSerializer.Serialize(errorResponse);
        await context.Response.WriteAsync(json);
    }
}
