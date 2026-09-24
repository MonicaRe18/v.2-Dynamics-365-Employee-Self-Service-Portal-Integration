using System.Diagnostics;
using System.Security.Claims;
using D365.Ess.Api.Services;

namespace D365.Ess.Api.Middleware;

public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public AuditLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IAuditLogger auditLogger)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Skip static files, Swagger, health checks from exhaustive audit logs
        if (!path.StartsWith("/api", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        var ip = context.Connection.RemoteIpAddress?.ToString();
        var method = context.Request.Method;

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var statusCode = context.Response.StatusCode;
            var user = context.User;

            string? userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            string? userName = user.FindFirst(ClaimTypes.Name)?.Value;
            string? userRole = user.FindFirst(ClaimTypes.Role)?.Value;

            bool isSecurity = statusCode is 401 or 403 || path.Contains("/auth/", StringComparison.OrdinalIgnoreCase);

            string action = $"{method}_{path.Replace('/', '_').Trim('_')}";

            auditLogger.LogAction(
                action: action,
                endpoint: path,
                method: method,
                statusCode: statusCode,
                durationMs: stopwatch.ElapsedMilliseconds,
                userId: userId,
                userName: userName,
                userRole: userRole,
                ip: ip,
                isSecurity: isSecurity
            );
        }
    }
}
