using System.Security.Claims;
using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace D365.Ess.Api.Controllers;

[ApiController]
[Route("api/d365")]
[Authorize]
public class PenaltyController : ControllerBase
{
    private readonly ID365Service _d365Service;

    public PenaltyController(ID365Service d365Service)
    {
        _d365Service = d365Service;
    }

    [HttpGet("penalties")]
    public async Task<ActionResult<List<PenaltyDto>>> GetPenalties([FromQuery] string? workerId, CancellationToken ct)
    {
        var targetId = !string.IsNullOrWhiteSpace(workerId) ? workerId : User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest(new { error = new { message = "معرف الموظف مطلوب أو يجب تسجيل الدخول." } });
        }
        var list = await _d365Service.GetPenaltiesAsync(targetId, ct);
        return Ok(list);
    }

    [HttpPost("penalties/grievance")]
    public async Task<ActionResult<GrievanceDto>> SubmitGrievance([FromBody] GrievanceRequestModel model, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(model.PenaltyId) || (string.IsNullOrWhiteSpace(model.Reasons) && string.IsNullOrWhiteSpace(model.GrievanceDetails)))
        {
            return BadRequest(new { error = new { message = "بيانات التظلم غير مكتملة (معرف الجزاء وأسباب التظلم مطلوبة)." } });
        }

        var grievance = await _d365Service.SubmitGrievanceAsync(model, ct);
        return Created($"/api/d365/penalties/grievance/{grievance.Id}", grievance);
    }

    [HttpGet("penalties/grievances")]
    public async Task<ActionResult<List<GrievanceDto>>> GetGrievances([FromQuery] string? workerId, CancellationToken ct)
    {
        var targetId = !string.IsNullOrWhiteSpace(workerId) ? workerId : User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest(new { error = new { message = "معرف الموظف مطلوب أو يجب تسجيل الدخول." } });
        }
        var list = await _d365Service.GetGrievancesAsync(targetId, ct);
        return Ok(list);
    }
}
