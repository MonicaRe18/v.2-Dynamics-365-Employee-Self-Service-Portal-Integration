using System.Security.Claims;
using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace D365.Ess.Api.Controllers;

[ApiController]
[Route("api/d365")]
[Authorize]
public class LeaveController : ControllerBase
{
    private readonly ID365Service _d365Service;

    public LeaveController(ID365Service d365Service)
    {
        _d365Service = d365Service;
    }

    [HttpGet("leave-balances")]
    public async Task<ActionResult<List<LeaveBalanceDto>>> GetLeaveBalances([FromQuery] string? workerId, CancellationToken ct)
    {
        var targetId = !string.IsNullOrWhiteSpace(workerId) ? workerId : User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest(new { error = new { message = "معرف الموظف مطلوب أو يجب تسجيل الدخول." } });
        }
        var balances = await _d365Service.GetLeaveBalancesAsync(targetId, ct);
        return Ok(balances);
    }

    [HttpGet("leave-requests")]
    public async Task<ActionResult<List<LeaveRequestDto>>> GetLeaveRequests([FromQuery] string? workerId, CancellationToken ct)
    {
        var targetId = !string.IsNullOrWhiteSpace(workerId) ? workerId : User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest(new { error = new { message = "معرف الموظف مطلوب أو يجب تسجيل الدخول." } });
        }
        var requests = await _d365Service.GetLeaveRequestsAsync(targetId, ct);
        return Ok(requests);
    }

    [HttpGet("leave-transactions")]
    public async Task<ActionResult<List<LeaveMovementTransactionDto>>> GetLeaveTransactions([FromQuery] string? typeCode, [FromQuery] string? workerId, CancellationToken ct)
    {
        var targetId = !string.IsNullOrWhiteSpace(workerId) ? workerId : User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest(new { error = new { message = "معرف الموظف مطلوب أو يجب تسجيل الدخول." } });
        }
        var txs = await _d365Service.GetLeaveTransactionsAsync(typeCode, targetId, ct);
        return Ok(txs);
    }

    [HttpGet("delegated-employees")]
    public async Task<ActionResult<List<DelegatedEmployeeDto>>> GetDelegatedEmployees(CancellationToken ct)
    {
        var workerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(workerId)) return Unauthorized();
        var delegates = await _d365Service.GetDelegatedEmployeesAsync(workerId, ct);
        return Ok(delegates);
    }

    [HttpPost("leave-requests")]
    public async Task<ActionResult<LeaveRequestDto>> SubmitLeaveRequest([FromBody] LeaveRequestDto request, CancellationToken ct)
    {
        var workerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(workerId)) return Unauthorized();
        if (!string.IsNullOrWhiteSpace(request.EmployeeId) && request.EmployeeId != workerId)
            return Forbid();
        request.EmployeeId = workerId;
        if (string.IsNullOrWhiteSpace(request.LeaveTypeCode) || string.IsNullOrWhiteSpace(request.StartDate) || string.IsNullOrWhiteSpace(request.EndDate))
        {
            return BadRequest(new { error = new { message = "بيانات طلب الإجازة غير مكتملة (نوع الإجازة وتاريخ البدء والانتهاء إلزامية)." } });
        }

        var created = await _d365Service.SubmitLeaveRequestAsync(request, ct);
        return Created($"/api/d365/leave-requests/{created.Id}", created);
    }

    [HttpDelete("leave-requests/{id}")]
    public async Task<IActionResult> CancelLeaveRequest(string id, CancellationToken ct)
    {
        var success = await _d365Service.CancelLeaveRequestAsync(id, ct);
        if (success)
        {
            return Ok(new { success = true });
        }
        return NotFound(new { error = new { message = "طلب الإجازة غير موجود" } });
    }

    [HttpPost("leave-requests/{id}/submit")]
    public async Task<ActionResult<LeaveRequestDto>> SubmitSavedLeaveRequest(string id, CancellationToken ct)
    {
        var workerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(workerId)) return Unauthorized();
        try
        {
            return Ok(await _d365Service.SubmitSavedLeaveRequestAsync(id, workerId, ct));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Leave request not found for this employee." } });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = new { message = ex.Message } });
        }
    }
}
