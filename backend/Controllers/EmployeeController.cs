using System.Security.Claims;
using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace D365.Ess.Api.Controllers;

[ApiController]
[Route("api/d365")]
[Authorize]
public class EmployeeController : ControllerBase
{
    private readonly ID365Service _d365Service;

    public EmployeeController(ID365Service d365Service)
    {
        _d365Service = d365Service;
    }

    [HttpGet("employees/{id}")]
    [HttpGet("employee")]
    public async Task<ActionResult<EmployeeDto>> GetEmployee(string? id, CancellationToken ct)
    {
        var targetId = !string.IsNullOrWhiteSpace(id) ? id : User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest(new { error = new { message = "معرف الموظف مطلوب أو يجب تسجيل الدخول." } });
        }
        var employee = await _d365Service.GetEmployeeAsync(targetId, ct);
        return Ok(employee);
    }

    [HttpPut("employees/{id}")]
    public async Task<ActionResult<EmployeeDto>> UpdateEmployee(string id, [FromBody] EmployeeDto updates, CancellationToken ct)
    {
        var updated = await _d365Service.UpdateEmployeeAsync(id, updates, ct);
        return Ok(updated);
    }

    [HttpGet("performance-evaluations")]
    public async Task<ActionResult<List<PerformanceEvaluationDto>>> GetPerformanceEvaluations([FromQuery] string? workerId, CancellationToken ct)
    {
        var targetId = !string.IsNullOrWhiteSpace(workerId) ? workerId : User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest(new { error = new { message = "معرف الموظف مطلوب أو يجب تسجيل الدخول." } });
        }
        var evals = await _d365Service.GetPerformanceEvaluationsAsync(targetId, ct);
        return Ok(evals);
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<List<D365NotificationDto>>> GetNotifications([FromQuery] string? workerId, CancellationToken ct)
    {
        var targetId = !string.IsNullOrWhiteSpace(workerId) ? workerId : User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest(new { error = new { message = "معرف الموظف مطلوب أو يجب تسجيل الدخول." } });
        }
        var notifs = await _d365Service.GetNotificationsAsync(targetId, ct);
        return Ok(notifs);
    }
}
