using System.Collections.Concurrent;
using D365.Ess.Api.Models;

namespace D365.Ess.Api.Services;

public interface IAuditLogger
{
    void Log(AuditLogEntry entry);
    void LogAction(string action, string endpoint, string method, int statusCode, long durationMs, string? userId = null, string? userName = null, string? userRole = null, string? ip = null, string? details = null, bool isSecurity = false);
    List<AuditLogEntry> GetRecentLogs(int limit = 100);
}

public class AuditLogger : IAuditLogger
{
    private readonly ConcurrentQueue<AuditLogEntry> _logs = new();
    private readonly ILogger<AuditLogger> _logger;
    private const int MaxLogCapacity = 500;

    public AuditLogger(ILogger<AuditLogger> logger)
    {
        _logger = logger;
    }

    public void Log(AuditLogEntry entry)
    {
        _logs.Enqueue(entry);
        while (_logs.Count > MaxLogCapacity && _logs.TryDequeue(out _)) { }

        var logMessage = $"[AUDIT] {entry.Action} by {entry.UserName ?? "Anonymous"} ({entry.UserRole ?? "None"}) on {entry.Method} {entry.Endpoint} - Status: {entry.StatusCode} ({entry.ExecutionDurationMs}ms)";
        if (entry.IsSecurityEvent)
        {
            _logger.LogWarning("SECURITY AUDIT: {Message} | Details: {Details}", logMessage, entry.Details);
        }
        else
        {
            _logger.LogInformation("{Message}", logMessage);
        }
    }

    public void LogAction(string action, string endpoint, string method, int statusCode, long durationMs, string? userId = null, string? userName = null, string? userRole = null, string? ip = null, string? details = null, bool isSecurity = false)
    {
        Log(new AuditLogEntry
        {
            Action = action,
            Endpoint = endpoint,
            Method = method,
            StatusCode = statusCode,
            ExecutionDurationMs = durationMs,
            UserId = userId,
            UserName = userName,
            UserRole = userRole,
            IpAddress = ip,
            Details = details,
            IsSecurityEvent = isSecurity
        });
    }

    public List<AuditLogEntry> GetRecentLogs(int limit = 100)
    {
        return _logs.Reverse().Take(limit).ToList();
    }
}
