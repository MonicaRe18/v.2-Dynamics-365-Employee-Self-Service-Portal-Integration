using System.Globalization;
using System.Security.Claims;
using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace D365.Ess.Api.Controllers;

[ApiController]
[Route("api/d365/transfer-requests")]
[Authorize]
public class TransferController : ControllerBase
{
    private readonly ID365Service _d365Service;

    public TransferController(ID365Service d365Service) => _d365Service = d365Service;

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] TransferRequestModel request, CancellationToken ct)
    {
        var workerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(workerId)) return Unauthorized();
        if (!DateOnly.TryParseExact(request.TransferDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _)
            || string.IsNullOrWhiteSpace(request.TransferTo))
            return BadRequest(new { error = new { message = "تاريخ طلب النقل والجهة المنقول إليها مطلوبان." } });

        var transferId = await _d365Service.SubmitTransferAsync(workerId, request, ct);
        return Ok(new { submitted = true, transferId });
    }
}
