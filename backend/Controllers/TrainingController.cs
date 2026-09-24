using System.Security.Claims;
using D365.Ess.Api.Models;
using D365.Ess.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace D365.Ess.Api.Controllers;

[ApiController]
[Route("api/d365")]
[Authorize]
public class TrainingController : ControllerBase
{
    private readonly ID365Service _d365Service;

    public TrainingController(ID365Service d365Service)
    {
        _d365Service = d365Service;
    }

    [HttpGet("training-courses")]
    public async Task<ActionResult<List<TrainingCourseDto>>> GetTrainingCourses([FromQuery] string? workerId, CancellationToken ct)
    {
        var targetId = !string.IsNullOrWhiteSpace(workerId) ? workerId : User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest(new { error = new { message = "معرف الموظف مطلوب أو يجب تسجيل الدخول." } });
        }
        var courses = await _d365Service.GetTrainingCoursesAsync(targetId, ct);
        return Ok(courses);
    }

    [HttpPost("training-courses/evaluation")]
    public async Task<ActionResult<TrainingEvaluationDto>> SubmitEvaluation([FromBody] TrainingEvaluationRequestModel model, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(model.CourseId))
        {
            return BadRequest(new { error = new { message = "معرف الدورة التدريبية إلزامي." } });
        }

        var eval = await _d365Service.SubmitTrainingEvaluationAsync(model, ct);
        return Created($"/api/d365/training-courses/evaluation/{eval.Id}", eval);
    }
}
