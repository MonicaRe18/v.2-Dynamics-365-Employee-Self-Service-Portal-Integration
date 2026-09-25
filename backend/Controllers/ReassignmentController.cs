using System.Globalization;
using System.Security.Claims;
using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace D365.Ess.Api.Controllers;

[ApiController]
[Route("api/d365/reassignment-requests")]
[Authorize]
public class ReassignmentController : ControllerBase
{
    private readonly ID365Service _d365Service;

    public ReassignmentController(ID365Service d365Service) => _d365Service = d365Service;

    [HttpGet("cities")]
    public async Task<ActionResult<List<ReassignmentCityDto>>> GetCities(CancellationToken ct) =>
        Ok(await _d365Service.GetReassignmentCitiesAsync(ct));

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] ReassignmentRequestModel request, CancellationToken ct)
    {
        var workerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(workerId)) return Unauthorized();
        if (!DateOnly.TryParseExact(request.ApplicationDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _)
            || request.ReassignmentType is < 0 or > 1)
            return BadRequest(new { error = new { message = "تاريخ تقديم الطلب ونوع الندب مطلوبان." } });

        var assignmentId = await _d365Service.SubmitReassignmentAsync(workerId, request, ct);
        return Ok(new { submitted = true, assignmentId });
    }
}
