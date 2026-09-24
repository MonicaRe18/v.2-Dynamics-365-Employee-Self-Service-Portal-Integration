using System.Security.Claims;
using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace D365.Ess.Api.Controllers;

[ApiController]
[Route("api/d365")]
[Authorize]
public class MonitoringController : ControllerBase
{
    private readonly ID365Service _d365Service;

    public MonitoringController(ID365Service d365Service)
    {
        _d365Service = d365Service;
    }

    [HttpGet("monitoring-operations")]
    public async Task<ActionResult<List<MonitoringOperationDto>>> GetMonitoringOperations([FromQuery] string? workerId, CancellationToken ct)
    {
        var targetId = !string.IsNullOrWhiteSpace(workerId) ? workerId : User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest(new { error = new { message = "معرف الموظف مطلوب أو يجب تسجيل الدخول." } });
        }
        var list = await _d365Service.GetMonitoringOperationsAsync(targetId, ct);
        return Ok(list);
    }

    [HttpPost("monitoring-operations/disclosure")]
    public async Task<ActionResult<MonitoringOperationDto>> SubmitDisclosure([FromBody] FinancialDisclosureModel model, CancellationToken ct)
    {
        var op = await _d365Service.SubmitFinancialDisclosureAsync(model, ct);
        return Created($"/api/d365/monitoring-operations/{op.Id}", op);
    }

    [HttpPost("monitoring-operations/test")]
    public async Task<ActionResult<MonitoringOperationDto>> SubmitDrugTest([FromBody] DrugTestModel model, CancellationToken ct)
    {
        var op = await _d365Service.SubmitDrugTestAsync(model, ct);
        return Created($"/api/d365/monitoring-operations/{op.Id}", op);
    }

    [HttpPost("monitoring-operations/{id}/status")]
    public async Task<ActionResult<MonitoringOperationDto>> UpdateStatus(string id, [FromBody] UpdateMonitoringStatusModel model, CancellationToken ct)
    {
        var op = await _d365Service.UpdateMonitoringStatusAsync(id, model.Status, model.Note, ct);
        if (op == null)
        {
            return NotFound(new { error = new { message = "عملية المتابعة غير موجودة" } });
        }
        return Ok(op);
    }
}
