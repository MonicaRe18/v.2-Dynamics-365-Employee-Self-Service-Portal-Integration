using System.Globalization;
using System.Security.Claims;
using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace D365.Ess.Api.Controllers;

[ApiController]
[Route("api/d365/secondment-requests")]
[Authorize]
public class SecondmentController : ControllerBase
{
    private readonly ID365Service _d365Service;

    public SecondmentController(ID365Service d365Service) => _d365Service = d365Service;

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SecondmentRequestModel request, CancellationToken ct)
    {
        var workerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(workerId)) return Unauthorized();
        if (!DateOnly.TryParseExact(request.ApplicationDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _)
            || string.IsNullOrWhiteSpace(request.BorrowingEntity))
            return BadRequest(new { error = new { message = "تاريخ تقديم الطلب والجهة المستعيرة مطلوبان." } });

        var requestId = await _d365Service.SubmitSecondmentAsync(workerId, request, ct);
        return Ok(new { submitted = true, requestId });
    }
}
