using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace D365.Ess.Api.Controllers;

[ApiController]
[Route("api/d365")]
[Authorize(Roles = "MSS_MGR,SYSTEM_ADMIN")]
public class TeamController : ControllerBase
{
    private readonly ID365Service _d365Service;

    public TeamController(ID365Service d365Service)
    {
        _d365Service = d365Service;
    }

    [HttpGet("team-members")]
    public async Task<ActionResult<List<TeamMemberDto>>> GetTeamMembers([FromQuery] string? managerId, CancellationToken ct)
    {
        var targetId = !string.IsNullOrWhiteSpace(managerId) ? managerId : "EMP-10000";
        var members = await _d365Service.GetTeamMembersAsync(targetId, ct);
        return Ok(members);
    }

    [HttpPost("team-requests/{id}/approve")]
    public async Task<ActionResult<TeamMemberRequestDto>> ApproveRequest(string id, [FromBody] ApproveRequestModel model, CancellationToken ct)
    {
        var req = await _d365Service.ApproveTeamRequestAsync(id, model?.Notes, ct);
        if (req == null)
        {
            return NotFound(new { error = new { message = $"الطلب رقم {id} غير موجود في سجلات الفريق." } });
        }
        return Ok(req);
    }

    [HttpPost("team-requests/{id}/reject")]
    public async Task<ActionResult<TeamMemberRequestDto>> RejectRequest(string id, [FromBody] RejectRequestModel model, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(model?.Reason))
        {
            return BadRequest(new { error = new { message = "سبب الرفض إلزامي وفقاً لتعليمات Dynamics 365." } });
        }

        var req = await _d365Service.RejectTeamRequestAsync(id, model.Reason, ct);
        if (req == null)
        {
            return NotFound(new { error = new { message = $"الطلب رقم {id} غير موجود في سجلات الفريق." } });
        }
        return Ok(req);
    }

    [HttpPost("team-requests/on-behalf/leave")]
    public async Task<ActionResult<TeamMemberRequestDto>> SubmitLeaveOnBehalf([FromBody] LeaveOnBehalfModel model, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(model.MemberId) || string.IsNullOrWhiteSpace(model.StartDate) || string.IsNullOrWhiteSpace(model.EndDate))
        {
            return BadRequest(new { error = new { message = "بيانات طلب الإجازة بالنيابة غير مكتملة." } });
        }

        var req = await _d365Service.SubmitLeaveOnBehalfAsync(model, ct);
        if (req == null)
        {
            return NotFound(new { error = new { message = "الموظف غير موجود في سجلات الفريق" } });
        }
        return Created($"/api/d365/team-requests/{req.Id}", req);
    }

    [HttpPost("team-requests/on-behalf/absence")]
    public async Task<ActionResult<TeamMemberRequestDto>> SubmitAbsenceOnBehalf([FromBody] AbsenceOnBehalfModel model, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(model.MemberId) || string.IsNullOrWhiteSpace(model.Reason))
        {
            return BadRequest(new { error = new { message = "بيانات إذن الغياب بالنيابة غير مكتملة (الموظف وسبب الغياب إلزامي)." } });
        }

        var req = await _d365Service.SubmitAbsenceOnBehalfAsync(model, ct);
        if (req == null)
        {
            return NotFound(new { error = new { message = "الموظف غير موجود في سجلات الفريق" } });
        }
        return Created($"/api/d365/team-requests/{req.Id}", req);
    }
}
