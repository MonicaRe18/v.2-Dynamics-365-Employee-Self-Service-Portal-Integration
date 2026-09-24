using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace D365.Ess.Api.Controllers;

[ApiController]
[Route("api/d365")]
public class AuditController : ControllerBase
{
    private readonly IAuditLogger _auditLogger;

    public AuditController(IAuditLogger auditLogger)
    {
        _auditLogger = auditLogger;
    }

    [HttpGet("audit-logs")]
    [Authorize(Roles = "MSS_MGR,SYSTEM_ADMIN")]
    public ActionResult<List<AuditLogEntry>> GetAuditLogs([FromQuery] int limit = 100)
    {
        var logs = _auditLogger.GetRecentLogs(Math.Min(limit, 200));
        return Ok(logs);
    }
}

[ApiController]
[Route("api/d365")]
[Authorize]
public class UnifiedRequestsController : ControllerBase
{
    private readonly ID365Service _d365Service;

    public UnifiedRequestsController(ID365Service d365Service)
    {
        _d365Service = d365Service;
    }

    [HttpGet("unified-requests")]
    public async Task<ActionResult<List<UnifiedRequestItemDto>>> GetUnifiedRequests(CancellationToken ct)
    {
        var requests = await _d365Service.GetUnifiedRequestsAsync(ct);
        return Ok(requests);
    }
}

[ApiController]
public class HealthController : ControllerBase
{
    private readonly ID365Service _d365Service;

    public HealthController(ID365Service d365Service)
    {
        _d365Service = d365Service;
    }

    [HttpGet("health")]
    [HttpGet("api/d365/status")]
    [HttpGet("api/d365/health")]
    [AllowAnonymous]
    public IActionResult HealthCheck()
    {
        var isConfigured = _d365Service.IsConfigured;
        var missing = _d365Service.GetMissingConfigurations();

        return Ok(new
        {
            status = isConfigured ? "UP" : "CONFIGURATION_REQUIRED",
            service = "Microsoft Dynamics 365 Finance & Operations ESS Web API (.NET 8)",
            isConfigured = isConfigured,
            missingFields = missing,
            legalEntity = _d365Service.LegalEntity,
            timestamp = DateTime.UtcNow.ToString("O"),
            version = "8.0.0"
        });
    }

    [HttpGet("api/d365/config")]
    [AllowAnonymous]
    public IActionResult GetConfigStatus()
    {
        var isConfigured = _d365Service.IsConfigured;
        var missing = _d365Service.GetMissingConfigurations();

        if (!isConfigured)
        {
            return StatusCode(503, new
            {
                isConfigured = false,
                status = "CONFIGURATION_REQUIRED",
                message = "Microsoft Dynamics 365 configuration is missing or incomplete in backend environment variables.",
                missingFields = missing,
                details = "Required environment variables: D365Settings__BaseUrl, D365Settings__TenantId, D365Settings__ClientId, D365Settings__ClientSecret, D365Settings__LegalEntity"
            });
        }

        return Ok(new
        {
            isConfigured = true,
            status = "CONFIGURED",
            legalEntity = _d365Service.LegalEntity
        });
    }
}
