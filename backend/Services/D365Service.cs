using D365.Ess.Api.Models;
using Microsoft.Extensions.Options;

namespace D365.Ess.Api.Services;

public interface ID365Service
{
    bool IsConfigured { get; }
    string LegalEntity { get; }
    List<string> GetMissingConfigurations();

    Task<EmployeeDto> GetEmployeeAsync(string workerId, CancellationToken ct = default);
    Task<EmployeeDto> UpdateEmployeeAsync(string workerId, EmployeeDto updates, CancellationToken ct = default);
    Task<List<LeaveBalanceDto>> GetLeaveBalancesAsync(string workerId, CancellationToken ct = default);
    Task<List<LeaveRequestDto>> GetLeaveRequestsAsync(string workerId, CancellationToken ct = default);
    Task<List<LeaveMovementTransactionDto>> GetLeaveTransactionsAsync(string? typeCode, string workerId, CancellationToken ct = default);
    Task<List<DelegatedEmployeeDto>> GetDelegatedEmployeesAsync(string workerId, CancellationToken ct = default);
    Task<LeaveRequestDto> SubmitLeaveRequestAsync(LeaveRequestDto request, CancellationToken ct = default);
    Task<LeaveRequestDto> SubmitSavedLeaveRequestAsync(string requestId, string workerId, CancellationToken ct = default);
    Task<bool> CancelLeaveRequestAsync(string requestId, CancellationToken ct = default);

    Task<List<PenaltyDto>> GetPenaltiesAsync(string workerId, CancellationToken ct = default);
    Task<string> SubmitReassignmentAsync(string workerId, ReassignmentRequestModel request, CancellationToken ct = default);
    Task<List<ReassignmentCityDto>> GetReassignmentCitiesAsync(CancellationToken ct = default);
    Task<GrievanceDto> SubmitGrievanceAsync(GrievanceRequestModel model, CancellationToken ct = default);
    Task<List<GrievanceDto>> GetGrievancesAsync(string workerId, CancellationToken ct = default);

    Task<List<TrainingCourseDto>> GetTrainingCoursesAsync(string workerId, CancellationToken ct = default);
    Task<TrainingEvaluationDto> SubmitTrainingEvaluationAsync(TrainingEvaluationRequestModel model, CancellationToken ct = default);

    Task<List<TeamMemberDto>> GetTeamMembersAsync(string managerId, CancellationToken ct = default);
    Task<TeamMemberRequestDto?> ApproveTeamRequestAsync(string requestId, string? notes, CancellationToken ct = default);
    Task<TeamMemberRequestDto?> RejectTeamRequestAsync(string requestId, string reason, CancellationToken ct = default);
    Task<TeamMemberRequestDto?> SubmitLeaveOnBehalfAsync(LeaveOnBehalfModel model, CancellationToken ct = default);
    Task<TeamMemberRequestDto?> SubmitAbsenceOnBehalfAsync(AbsenceOnBehalfModel model, CancellationToken ct = default);

    Task<List<PerformanceEvaluationDto>> GetPerformanceEvaluationsAsync(string workerId, CancellationToken ct = default);
    Task<List<MonitoringOperationDto>> GetMonitoringOperationsAsync(string workerId, CancellationToken ct = default);
    Task<MonitoringOperationDto> SubmitFinancialDisclosureAsync(FinancialDisclosureModel model, CancellationToken ct = default);
    Task<MonitoringOperationDto> SubmitDrugTestAsync(DrugTestModel model, CancellationToken ct = default);
    Task<MonitoringOperationDto?> UpdateMonitoringStatusAsync(string id, string status, string? note, CancellationToken ct = default);

    Task<List<D365NotificationDto>> GetNotificationsAsync(string workerId, CancellationToken ct = default);
    Task<List<UnifiedRequestItemDto>> GetUnifiedRequestsAsync(CancellationToken ct = default);
}

public class D365Service : ID365Service
{
    private readonly ID365Client _client;
    private readonly D365Settings _settings;
    private readonly EmployeeLoginSettings _employeeLoginSettings;
    private readonly IAuditLogger _auditLogger;
    private readonly ILogger<D365Service> _logger;

    public bool IsConfigured => _settings.IsConfigured;
    public string LegalEntity => _settings.LegalEntity;
    public List<string> GetMissingConfigurations() => _settings.GetMissingConfigurations();

    public D365Service(
        ID365Client client,
        IOptions<D365Settings> options,
        IOptions<EmployeeLoginSettings> employeeLoginOptions,
        IAuditLogger auditLogger,
        ILogger<D365Service> logger)
    {
        _client = client;
        _settings = options.Value;
        _employeeLoginSettings = employeeLoginOptions.Value;
        _auditLogger = auditLogger;
        _logger = logger;
    }

    private void EnsureConfigured()
    {
        if (!_settings.IsConfigured)
        {
            throw new D365ConfigurationException(_settings.GetMissingConfigurations());
        }
    }

    private static string EmployeeFilter(string workerId) =>
        $"cross-company=true&$filter={Uri.EscapeDataString($"PersonnelNumber eq '{workerId.Replace("'", "''")}'")}";

    private async Task<List<T>> ReadRowsAsync<T>(string entity, string query, CancellationToken ct)
    {
        var result = await _client.GetAsync<ODataListResponse<T>>(entity, query, ct);
        return result?.Value ?? throw new InvalidOperationException($"Could not read Dynamics 365 entity '{entity}'.");
    }

    private static string DateOnly(string? value) =>
        string.IsNullOrWhiteSpace(value) || value.StartsWith("1900-") || value.StartsWith("2154-")
            ? string.Empty : value[..Math.Min(10, value.Length)];

    private static string YearsInCurrentPosition(string? assignmentStart)
    {
        if (!DateTimeOffset.TryParse(assignmentStart, out var startTimestamp)) return string.Empty;
        var start = System.DateOnly.FromDateTime(startTimestamp.UtcDateTime);
        var today = System.DateOnly.FromDateTime(DateTime.UtcNow);
        if (start > today || start.Year <= 1900) return string.Empty;

        var years = today.Year - start.Year;
        var months = today.Month - start.Month;
        if (today.Day < start.Day) months--;
        if (months < 0) { years--; months += 12; }
        if (years > 0 && months > 0) return $"{years} سنة و{months} أشهر";
        if (years > 0) return $"{years} سنة";
        return months > 0 ? $"{months} أشهر" : "أقل من شهر";
    }

    private static string? ImageDataUri(string? encoded)
    {
        if (string.IsNullOrWhiteSpace(encoded) || encoded.Length > 7_000_000) return null;
        try
        {
            var bytes = Convert.FromBase64String(encoded);
            var mime = bytes.Length >= 3 && bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff
                ? "image/jpeg"
                : bytes.Length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })
                    ? "image/png"
                    : bytes.Length >= 6 && System.Text.Encoding.ASCII.GetString(bytes, 0, 3) == "GIF"
                        ? "image/gif"
                        : null;
            return mime == null ? null : $"data:{mime};base64,{Convert.ToBase64String(bytes)}";
        }
        catch (FormatException)
        {
            return null;
        }
    }

    private static string LeaveCode(string typeId) => typeId.Trim().ToLowerInvariant() switch
    {
        "annual leave" => "ANNUAL",
        "sick" => "SICK",
        "bereavement" => "BEREAVEMENT",
        _ => typeId.Trim().ToUpperInvariant()
    };

    public async Task<EmployeeDto> GetEmployeeAsync(string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var liveData = (await ReadRowsAsync<D365EmployeeRecord>("Employees", EmployeeFilter(workerId) + "&$top=1", ct)).FirstOrDefault();
        if (liveData == null)
        {
            throw new KeyNotFoundException($"Employee with PersonnelNumber '{workerId}' was not found in Dynamics 365.");
        }

        var detail = (await ReadRowsAsync<D365PersonalDetailRecord>("EssPersonalDetailsCopilots", EmployeeFilter(workerId) + "&$top=1", ct)).FirstOrDefault();
        D365PositionRecord? position = null;
        D365AssignedPositionRecord? assignedPosition = null;
        D365JobRecord? job = null;
        D365JobTypeRecord? jobType = null;
        D365DepartmentRecord? department = null;
        var currentPositionRows = await ReadRowsAsync<D365AssignedPositionRecord>("Positions", $"cross-company=true&$filter={Uri.EscapeDataString($"WorkerPersonnelNumber eq '{workerId.Replace("'", "''")}'")}", ct);
        var nowPosition = DateTimeOffset.UtcNow;
        assignedPosition = currentPositionRows
            .Where(row => row.PaidByLegalEntity.Equals(_settings.LegalEntity, StringComparison.OrdinalIgnoreCase)
                && row.IsPrimaryPosition.Equals("Yes", StringComparison.OrdinalIgnoreCase)
                && DateTimeOffset.TryParse(row.WorkerAssignmentStart, out var from) && from <= nowPosition
                && DateTimeOffset.TryParse(row.WorkerAssignmentEnd, out var to) && to >= nowPosition)
            .OrderByDescending(row => row.WorkerAssignmentStart)
            .FirstOrDefault();
        var currentPositionId = assignedPosition?.PositionId ?? detail?.PositionId;
        if (!string.IsNullOrWhiteSpace(currentPositionId))
        {
            var positionFilter = Uri.EscapeDataString($"PositionId eq '{currentPositionId.Replace("'", "''")}'");
            position = (await ReadRowsAsync<D365PositionRecord>("PositionDetails", $"cross-company=true&$filter={positionFilter}&$top=1", ct)).FirstOrDefault();
        }
        if (!string.IsNullOrWhiteSpace(assignedPosition?.JobId))
        {
            var jobFilter = Uri.EscapeDataString($"JobId eq '{assignedPosition.JobId.Replace("'", "''")}'");
            job = (await ReadRowsAsync<D365JobRecord>("Jobs", $"cross-company=true&$filter={jobFilter}&$top=1", ct)).FirstOrDefault();
        }
        if (!string.IsNullOrWhiteSpace(job?.JobTypeId))
        {
            var typeFilter = Uri.EscapeDataString($"JobTypeId eq '{job.JobTypeId.Replace("'", "''")}'");
            jobType = (await ReadRowsAsync<D365JobTypeRecord>("JobTypes", $"cross-company=true&$filter={typeFilter}&$top=1", ct)).FirstOrDefault();
        }
        if (!string.IsNullOrWhiteSpace(position?.DepartmentNumber))
        {
            var departmentFilter = Uri.EscapeDataString($"OperatingUnitNumber eq '{position.DepartmentNumber.Replace("'", "''")}'");
            department = (await ReadRowsAsync<D365DepartmentRecord>("Departments", $"cross-company=true&$filter={departmentFilter}&$top=1", ct)).FirstOrDefault();
        }
        var idFilter = Uri.EscapeDataString($"PartyNumber eq '{liveData.PartyNumber.Replace("'", "''")}' and IdentificationTypeId eq '{_employeeLoginSettings.NationalIdTypeId.Replace("'", "''")}'");
        var identification = (await ReadRowsAsync<D365PersonIdentificationRecord>("PersonIdentificationNumbers", $"$filter={idFilter}&$top=1", ct)).FirstOrDefault();
        var imageFilter = Uri.EscapeDataString($"PartyNumber eq '{liveData.PartyNumber.Replace("'", "''")}'");
        var image = (await ReadRowsAsync<D365PersonImageRecord>("PersonImages", $"$filter={imageFilter}&$top=1", ct)).FirstOrDefault();
        var employmentFilter = Uri.EscapeDataString($"PersonnelNumber eq '{workerId.Replace("'", "''")}' and LegalEntityId eq '{_settings.LegalEntity.Replace("'", "''")}'");
        var employmentRows = await ReadRowsAsync<D365EmploymentDetailRecord>("EmploymentDetails", $"cross-company=true&$filter={employmentFilter}", ct);
        var now = DateTimeOffset.UtcNow;
        var currentEmployment = employmentRows
            .Where(row => DateTimeOffset.TryParse(row.ValidFrom, out var from) && from <= now
                && DateTimeOffset.TryParse(row.ValidTo, out var to) && to >= now)
            .OrderByDescending(row => row.ValidFrom)
            .FirstOrDefault();

        return new EmployeeDto
        {
            Id = liveData.PersonnelNumber,
            Name = liveData.Name,
            JobTitle = position?.Description ?? detail?.Description ?? string.Empty,
            Department = department?.Name ?? string.Empty,
            Division = string.Empty,
            HireDate = DateOnly(liveData.EmploymentStartDate),
            YearsOfService = YearsInCurrentPosition(assignedPosition?.WorkerAssignmentStart),
            DirectManager = detail?.ReportsToName ?? string.Empty,
            JobGrade = assignedPosition?.LevelCodeId ?? string.Empty,
            JobGroup = jobType?.Description ?? string.Empty,
            EmploymentStatus = currentEmployment?.EmploymentCategoryId ?? string.Empty,
            EmploymentStatusAr = ArabicDisplay.EmploymentCategory(currentEmployment?.EmploymentCategoryId),
            Email = liveData.PrimaryContactEmail,
            Phone = liveData.PrimaryContactPhone,
            LegalEntity = liveData.LegalEntityId,
            CivilId = identification?.IdentificationNumber ?? string.Empty,
            AvatarUrl = ImageDataUri(image?.Image),
            PersonalDetails = new PersonalDetailsDto
            {
                MaritalStatus = ArabicDisplay.MaritalStatus(liveData.MaritalStatus),
                DependentsCount = liveData.NumberOfDependents,
                SpouseWorking = string.Empty,
                Religion = string.Empty,
                EducationQualification = liveData.Education,
                RetirementDate = DateOnly(liveData.PensionStart),
                IsDisabled = ArabicDisplay.YesNo(liveData.IsDisabled),
                VerificationDate = DateOnly(liveData.DisabledVerificationDate)
            }
        };
    }

    public async Task<EmployeeDto> UpdateEmployeeAsync(string workerId, EmployeeDto updates, CancellationToken ct = default)
    {
        EnsureConfigured();

        var res = await _client.PatchAsync<EmployeeDto, EmployeeDto>($"Employees(PersonnelNumber='{workerId}',dataAreaId='{_settings.LegalEntity}')", updates, ct);
        if (res == null)
        {
            throw new InvalidOperationException($"Failed to update employee '{workerId}' in Dynamics 365.");
        }
        return res;
    }

    public async Task<List<LeaveBalanceDto>> GetLeaveBalancesAsync(string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var balances = await ReadRowsAsync<D365LeaveBalanceRecord>("EssLeaveBalances", EmployeeFilter(workerId), ct);
        var types = await ReadRowsAsync<D365LeaveTypeRecord>("EssLeaveTypes", "cross-company=true", ct);
        var byType = types.GroupBy(x => x.LeaveTypeId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);
        return balances.Select(balance =>
        {
            byType.TryGetValue(balance.LeaveTypeId, out var type);
            return new LeaveBalanceDto
            {
                Id = $"{balance.dataAreaId}:{workerId}:{balance.LeaveTypeId}",
                LeaveTypeCode = LeaveCode(balance.LeaveTypeId),
                LeaveTypeTitle = ArabicDisplay.LeaveType(LeaveCode(balance.LeaveTypeId), type?.Description ?? balance.LeaveTypeId),
                Unit = ArabicDisplay.Unit(type?.LeaveAmountUnit),
                TotalEntitlement = balance.TotalThisYear,
                TransferredFromPreviousYear = balance.LastCarryForwardAmount,
                UsedDays = balance.TakenThisYear,
                RemainingBalance = balance.BalanceAvailable,
                PendingApprovalDays = 0,
                Year = DateTime.UtcNow.Year
            };
        }).ToList();
    }

    public async Task<List<LeaveRequestDto>> GetLeaveRequestsAsync(string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var headers = await ReadRowsAsync<D365LeaveRequestHeaderRecord>("EssLeaveRequestHeaders", EmployeeFilter(workerId), ct);
        if (headers.Count == 0) return new List<LeaveRequestDto>();
        var requestFilter = string.Join(" or ", headers.Select(x => $"RequestId eq '{x.RequestId.Replace("'", "''")}'"));
        var details = await ReadRowsAsync<D365LeaveRequestDetailRecord>("EssLeaveRequestDetails", $"cross-company=true&$filter={Uri.EscapeDataString(requestFilter)}", ct);
        var types = await ReadRowsAsync<D365LeaveTypeRecord>("EssLeaveTypes", "cross-company=true", ct);
        var byType = types.GroupBy(x => x.LeaveTypeId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);
        return headers.Select(header =>
        {
            var lines = details.Where(x => x.RequestId == header.RequestId).ToList();
            var typeId = lines.FirstOrDefault()?.LeaveTypeId ?? string.Empty;
            byType.TryGetValue(typeId, out var type);
            return new LeaveRequestDto
            {
                Id = header.RequestId,
                EmployeeId = workerId,
                LeaveTypeCode = LeaveCode(typeId),
                LeaveTypeTitle = ArabicDisplay.LeaveType(LeaveCode(typeId), type?.Description ?? typeId),
                StartDate = DateOnly(header.StartDate),
                EndDate = DateOnly(header.EndDate),
                RequestedDays = lines.Sum(x => x.Amount),
                RequestedUnit = ArabicDisplay.Unit(type?.LeaveAmountUnit),
                SubmissionDate = DateOnly(header.RequestDate),
                Status = header.Status,
                StatusAr = ArabicDisplay.LeaveStatus(header.Status),
                Notes = header.Comment,
                SocialInsuranceOption = false,
                HealthInsuranceOption = false
            };
        }).OrderByDescending(x => x.SubmissionDate).ToList();
    }

    public async Task<List<LeaveMovementTransactionDto>> GetLeaveTransactionsAsync(string? typeCode, string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var filter = $"cross-company=true&$filter=WorkerPersonnelNumber eq '{workerId}'";
        if (!string.IsNullOrEmpty(typeCode))
        {
            filter += $" and LeaveTypeId eq '{typeCode}'";
        }
        var transactions = await _client.GetAsync<List<LeaveMovementTransactionDto>>("LeaveAndAbsenceBankTransactions", filter, ct);
        return transactions ?? new List<LeaveMovementTransactionDto>();
    }

    public async Task<List<DelegatedEmployeeDto>> GetDelegatedEmployeesAsync(string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var workerFilter = Uri.EscapeDataString($"WorkerPersonnelNumber eq '{workerId.Replace("'", "''")}'");
        var workerPosition = (await ReadRowsAsync<D365AssignedPositionRecord>("Positions", $"cross-company=true&$filter={workerFilter}&$top=1", ct)).FirstOrDefault();
        if (workerPosition == null || string.IsNullOrWhiteSpace(workerPosition.DepartmentNumber))
        {
            return new List<DelegatedEmployeeDto>();
        }

        var candidateFilter = Uri.EscapeDataString($"DepartmentNumber eq '{workerPosition.DepartmentNumber.Replace("'", "''")}' and PaidByLegalEntity eq '{_settings.LegalEntity.Replace("'", "''")}'");
        var candidates = await ReadRowsAsync<D365AssignedPositionRecord>("Positions", $"cross-company=true&$filter={candidateFilter}", ct);
        var now = DateTimeOffset.UtcNow;
        return candidates
            .Where(candidate => candidate.WorkerPersonnelNumber != workerId
                && !string.IsNullOrWhiteSpace(candidate.WorkerPersonnelNumber)
                && candidate.IsPrimaryPosition.Equals("Yes", StringComparison.OrdinalIgnoreCase)
                && DateTimeOffset.TryParse(candidate.WorkerAssignmentEnd, out var end) && end >= now)
            .GroupBy(candidate => candidate.WorkerPersonnelNumber)
            .Select(group => group.First())
            .Select(candidate => new DelegatedEmployeeDto
            {
                Id = candidate.WorkerPersonnelNumber,
                Name = candidate.WorkerName,
                JobTitle = candidate.Description,
                Department = workerPosition.DepartmentNumber,
                Available = true
            })
            .OrderBy(candidate => candidate.Name)
            .ToList();
    }

    public async Task<LeaveRequestDto> SubmitLeaveRequestAsync(LeaveRequestDto request, CancellationToken ct = default)
    {
        EnsureConfigured();
        if (!System.DateOnly.TryParseExact(request.StartDate, "yyyy-MM-dd", out var start)
            || !System.DateOnly.TryParseExact(request.EndDate, "yyyy-MM-dd", out var end)
            || start < System.DateOnly.FromDateTime(DateTime.UtcNow) || end < start
            || end.DayNumber - start.DayNumber > 30)
            throw new ArgumentException("Choose a valid current or future leave date range of at most 31 calendar days.");
        if (request.Attachments.Count > 0)
            throw new ArgumentException("Attachments are not yet uploaded to Dynamics. Remove them before submitting.");
        if (!request.SocialInsuranceOption || !request.HealthInsuranceOption)
            throw new ArgumentException("Insurance selections are not mapped to Dynamics yet; leave both at their defaults.");

        var balances = await GetLeaveBalancesAsync(request.EmployeeId, ct);
        var balance = balances.FirstOrDefault(x => x.LeaveTypeCode.Equals(request.LeaveTypeCode, StringComparison.OrdinalIgnoreCase));
        if (balance == null || !ArabicDisplay.IsDayUnit(balance.Unit))
            throw new ArgumentException("This leave type is unavailable or is measured in hours; only day-based leave is supported here.");
        var delegates = await GetDelegatedEmployeesAsync(request.EmployeeId, ct);
        var delegated = delegates.FirstOrDefault(x => x.Id == request.DelegatedEmployeeId);
        if (delegated == null) throw new ArgumentException("Select an eligible acting employee from the current list.");

        var days = Enumerable.Range(0, end.DayNumber - start.DayNumber + 1)
            .Select(offset => start.AddDays(offset))
            .Where(day => day.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday)
            .ToList();
        if (days.Count == 0) throw new ArgumentException("The selected range contains no working weekdays.");
        if (days.Count > balance.RemainingBalance)
            throw new ArgumentException("The available Dynamics leave balance is not sufficient for this request.");

        var typeFilter = $"cross-company=true&$filter={Uri.EscapeDataString($"LeaveTypeId eq '{request.LeaveTypeCode.Replace("'", "''")}' and dataAreaId eq '{_settings.LegalEntity.Replace("'", "''")}'")}";
        var types = await ReadRowsAsync<D365LeaveTypeRecord>("EssLeaveTypes", typeFilter, ct);
        var typeId = types.FirstOrDefault()?.LeaveTypeId;
        if (string.IsNullOrWhiteSpace(typeId))
        {
            var allTypes = await ReadRowsAsync<D365LeaveTypeRecord>("EssLeaveTypes", $"cross-company=true&$filter={Uri.EscapeDataString($"dataAreaId eq '{_settings.LegalEntity.Replace("'", "''")}'")}", ct);
            typeId = allTypes.FirstOrDefault(x => LeaveCode(x.LeaveTypeId) == request.LeaveTypeCode)?.LeaveTypeId;
        }
        if (string.IsNullOrWhiteSpace(typeId)) throw new ArgumentException("The Dynamics leave type could not be resolved.");

        var comment = $"WorkerRecive: {delegated.Id} ({delegated.Name})";
        if (!string.IsNullOrWhiteSpace(request.Notes)) comment += $"\n{request.Notes.Trim()}";
        var header = await _client.PostAsync<object, D365LeaveRequestHeaderRecord>("EssLeaveRequestHeaders",
            new { dataAreaId = _settings.LegalEntity, PersonnelNumber = request.EmployeeId, Comment = comment }, ct);
        if (header == null || string.IsNullOrWhiteSpace(header.RequestId))
            throw new InvalidOperationException("Dynamics did not create the leave request header.");

        foreach (var day in days)
        {
            var detail = await _client.PostAsync<object, D365LeaveRequestDetailRecord>("EssLeaveRequestDetails",
                new { dataAreaId = _settings.LegalEntity, RequestId = header.RequestId, LeaveTypeId = typeId,
                    LeaveDate = day.ToString("yyyy-MM-dd") + "T12:00:00Z", Amount = 1 }, ct);
            if (detail == null)
                throw new InvalidOperationException($"Dynamics created draft {header.RequestId}, but failed to add the detail for {day:yyyy-MM-dd}. Review that draft in Dynamics before retrying.");
        }

        if (!request.SaveAsDraft)
            return await SubmitSavedLeaveRequestAsync(header.RequestId, request.EmployeeId, ct);

        var savedHeaders = await ReadRowsAsync<D365LeaveRequestHeaderRecord>("EssLeaveRequestHeaders",
            $"cross-company=true&$filter={Uri.EscapeDataString($"RequestId eq '{header.RequestId.Replace("'", "''")}' and PersonnelNumber eq '{request.EmployeeId.Replace("'", "''")}'")}&$top=1", ct);
        var saved = savedHeaders.FirstOrDefault();
        if (saved == null)
            throw new InvalidOperationException($"Dynamics created draft {header.RequestId}, but it could not be read back. Review the request in Dynamics before retrying.");

        request.Id = header.RequestId;
        request.DelegatedEmployeeName = delegated.Name;
        request.RequestedDays = days.Count;
        request.RequestedUnit = ArabicDisplay.Unit("Days");
        request.SubmissionDate = DateOnly(saved.RequestDate);
        request.Status = saved.Status;
        request.StatusAr = ArabicDisplay.LeaveStatus(saved.Status);
        request.D365SyncStatus = "Synced";
        return request;
    }

    public async Task<LeaveRequestDto> SubmitSavedLeaveRequestAsync(string requestId, string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();
        var filter = $"RequestId eq '{requestId.Replace("'", "''")}' and PersonnelNumber eq '{workerId.Replace("'", "''")}'";
        var headers = await ReadRowsAsync<D365LeaveRequestHeaderRecord>("EssLeaveRequestHeaders",
            $"cross-company=true&$filter={Uri.EscapeDataString(filter)}&$top=1", ct);
        var header = headers.FirstOrDefault();
        if (header == null) throw new KeyNotFoundException("Leave request not found for the signed-in employee.");
        if (!header.Status.Equals("Draft", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException($"Leave request {requestId} is {header.Status}, not Draft.");

        var details = await ReadRowsAsync<D365LeaveRequestDetailRecord>("EssLeaveRequestDetails",
            $"cross-company=true&$filter={Uri.EscapeDataString($"RequestId eq '{requestId.Replace("'", "''")}'")}", ct);
        if (details.Count == 0) throw new ArgumentException("Add leave dates to the draft before submitting it.");

        var company = string.IsNullOrWhiteSpace(header.dataAreaId) ? _settings.LegalEntity : header.dataAreaId;
        var key = $"dataAreaId='{Uri.EscapeDataString(company.Replace("'", "''"))}',RequestId='{Uri.EscapeDataString(requestId.Replace("'", "''"))}'";
        if (!await _client.PostActionAsync($"EssLeaveRequestHeaders({key})/Microsoft.Dynamics.DataEntities.submit?cross-company=true", ct))
            throw new InvalidOperationException($"Dynamics could not submit draft {requestId}. The draft remains in Dynamics; check the server log for the Dynamics validation error.");

        var requests = await GetLeaveRequestsAsync(workerId, ct);
        var submitted = requests.FirstOrDefault(x => x.Id == requestId);
        if (submitted == null || submitted.Status.Equals("Draft", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Dynamics accepted submit for {requestId}, but it still reads as Draft. Refresh and review its workflow status in Dynamics.");
        return submitted;
    }

    public async Task<bool> CancelLeaveRequestAsync(string requestId, CancellationToken ct = default)
    {
        EnsureConfigured();

        return await _client.DeleteAsync($"LeaveAndAbsenceRequests('{requestId}')", ct);
    }

    public async Task<List<PenaltyDto>> GetPenaltiesAsync(string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var filter = $"cross-company=true&$filter={Uri.EscapeDataString($"WorkerPersonnelNumber eq '{workerId.Replace("'", "''")}'")}";
        var rows = await ReadRowsAsync<D365PenaltyRecord>("DisciplinaryPenalties", filter, ct);
        return rows.Select((row, index) =>
        {
            var number = row.GRIDREQUESTID ?? row.PenaltyNumber ?? string.Empty;
            var sourceStatus = row.GRIDPENALTYSTATUS ?? row.PenaltyStatusAr ?? row.PenaltyStatus ?? string.Empty;
            var status = row.PenaltyStatus ?? sourceStatus.Trim().ToLowerInvariant() switch
            {
                "expired" or "تم المحو" or "منتهي" => "Expired",
                "canceled" or "cancelled" or "ملغى" => "Canceled",
                "undergrievance" or "قيد التظلم" => "UnderGrievance",
                "grievanceaccepted" or "قُبل التظلم" => "GrievanceAccepted",
                _ => "Active"
            };
            return new PenaltyDto
            {
                Id = row.Id ?? (number.Length > 0 ? number : $"penalty-{index}"),
                PenaltyNumber = number,
                PenaltyStatus = status,
                PenaltyStatusAr = ArabicDisplay.PenaltyStatus(sourceStatus),
                PenaltySigningDate = DateOnly(row.GRIDPENALTYIMPOSITIONDATE ?? row.PenaltySigningDate),
                PenaltyStartDate = DateOnly(row.PenaltyStartDate),
                PenaltyRemovalDate = DateOnly(row.GRIDPENALTYERASUREDATE ?? row.PenaltyRemovalDate),
                Action = row.Action ?? string.Empty,
                EmployeePenalty = row.EmployeePenalty ?? string.Empty,
                Duration = row.Duration ?? string.Empty,
                InvestigationAuthority = row.InvestigationAuthority ?? string.Empty,
                PenaltyDetails = row.PenaltyDetails ?? string.Empty,
                HasGrievance = row.HasGrievance,
                GrievanceStatus = row.GrievanceStatus
            };
        }).ToList();
    }

    public async Task<string> SubmitReassignmentAsync(string workerId, ReassignmentRequestModel request, CancellationToken ct = default)
    {
        EnsureConfigured();
        if (string.IsNullOrWhiteSpace(_settings.ReassignmentEndpointPath))
            throw new D365ConfigurationException(new List<string> { "D365Settings__ReassignmentEndpointPath (service endpoint creating PAR_Assignment requests)" });

        // The localhost date maps to PAR_Assignment.ApplicationDate.
        return await _client.PostCustomRequestAsync(_settings.ReassignmentEndpointPath, new
        {
            personnelNumber = workerId,
            applicationDate = request.ApplicationDate,
            newAddress = request.NewAddress,
            reassignmentType = request.ReassignmentType,
            newCityKey = request.NewCityKey,
            companyId = _settings.LegalEntity
        }, ct);
    }

    public async Task<List<ReassignmentCityDto>> GetReassignmentCitiesAsync(CancellationToken ct = default)
    {
        EnsureConfigured();
        var rows = await ReadRowsAsync<D365AddressCityRecord>("AddressCities",
            $"$filter={Uri.EscapeDataString("CountryRegionId eq 'EGY'")}&$select=CityKey,Name,CountryRegionId", ct);
        return rows.Select(city => new ReassignmentCityDto { CityKey = city.CityKey, Name = city.Name }).ToList();
    }

    public async Task<GrievanceDto> SubmitGrievanceAsync(GrievanceRequestModel model, CancellationToken ct = default)
    {
        EnsureConfigured();

        var grievance = await _client.PostAsync<GrievanceRequestModel, GrievanceDto>("DisciplinaryGrievances", model, ct);
        if (grievance == null)
        {
            throw new InvalidOperationException("Failed to submit grievance to Dynamics 365.");
        }
        return grievance;
    }

    public async Task<List<GrievanceDto>> GetGrievancesAsync(string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var filter = $"cross-company=true&$filter=WorkerPersonnelNumber eq '{workerId}'";
        var grievances = await _client.GetAsync<List<GrievanceDto>>("DisciplinaryGrievances", filter, ct);
        return grievances ?? new List<GrievanceDto>();
    }

    public async Task<List<TrainingCourseDto>> GetTrainingCoursesAsync(string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var filter = $"cross-company=true&$filter=WorkerPersonnelNumber eq '{workerId}'";
        var courses = await _client.GetAsync<List<TrainingCourseDto>>("CourseAttendances", filter, ct);
        foreach (var course in courses ?? new List<TrainingCourseDto>())
            course.StatusAr = ArabicDisplay.TrainingStatus(course.Status);
        return courses ?? new List<TrainingCourseDto>();
    }

    public async Task<TrainingEvaluationDto> SubmitTrainingEvaluationAsync(TrainingEvaluationRequestModel model, CancellationToken ct = default)
    {
        EnsureConfigured();

        var eval = await _client.PostAsync<TrainingEvaluationRequestModel, TrainingEvaluationDto>("CourseEvaluations", model, ct);
        if (eval == null)
        {
            throw new InvalidOperationException("Failed to submit training evaluation to Dynamics 365.");
        }
        return eval;
    }

    public async Task<List<TeamMemberDto>> GetTeamMembersAsync(string managerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var filter = $"cross-company=true&$filter=ReportsToPersonnelNumber eq '{managerId}'";
        var members = await _client.GetAsync<List<TeamMemberDto>>("HcmWorkerReportingHierarchy", filter, ct);
        return members ?? new List<TeamMemberDto>();
    }

    public async Task<TeamMemberRequestDto?> ApproveTeamRequestAsync(string requestId, string? notes, CancellationToken ct = default)
    {
        EnsureConfigured();

        var body = new { Status = "معتمدة", ApprovalNotes = notes, ApprovedAt = DateTime.UtcNow };
        return await _client.PatchAsync<object, TeamMemberRequestDto>($"TeamMemberRequests('{requestId}')", body, ct);
    }

    public async Task<TeamMemberRequestDto?> RejectTeamRequestAsync(string requestId, string reason, CancellationToken ct = default)
    {
        EnsureConfigured();

        var body = new { Status = "مرفوضة", RejectionReason = reason, RejectedAt = DateTime.UtcNow };
        return await _client.PatchAsync<object, TeamMemberRequestDto>($"TeamMemberRequests('{requestId}')", body, ct);
    }

    public async Task<TeamMemberRequestDto?> SubmitLeaveOnBehalfAsync(LeaveOnBehalfModel model, CancellationToken ct = default)
    {
        EnsureConfigured();

        return await _client.PostAsync<LeaveOnBehalfModel, TeamMemberRequestDto>("TeamMemberRequests", model, ct);
    }

    public async Task<TeamMemberRequestDto?> SubmitAbsenceOnBehalfAsync(AbsenceOnBehalfModel model, CancellationToken ct = default)
    {
        EnsureConfigured();

        return await _client.PostAsync<AbsenceOnBehalfModel, TeamMemberRequestDto>("TeamMemberRequests", model, ct);
    }

    public async Task<List<PerformanceEvaluationDto>> GetPerformanceEvaluationsAsync(string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var filter = $"cross-company=true&$filter=WorkerPersonnelNumber eq '{workerId}'";
        var evals = await _client.GetAsync<List<PerformanceEvaluationDto>>("HcmPerformanceGoals", filter, ct);
        return evals ?? new List<PerformanceEvaluationDto>();
    }

    public async Task<List<MonitoringOperationDto>> GetMonitoringOperationsAsync(string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var filter = $"cross-company=true&$filter=WorkerPersonnelNumber eq '{workerId}'";
        var ops = await _client.GetAsync<List<MonitoringOperationDto>>("ComplianceMonitoringOperations", filter, ct);
        return ops ?? new List<MonitoringOperationDto>();
    }

    public async Task<MonitoringOperationDto> SubmitFinancialDisclosureAsync(FinancialDisclosureModel model, CancellationToken ct = default)
    {
        EnsureConfigured();

        var res = await _client.PostAsync<FinancialDisclosureModel, MonitoringOperationDto>("ComplianceMonitoringOperations", model, ct);
        if (res == null)
        {
            throw new InvalidOperationException("Failed to submit financial disclosure to Dynamics 365.");
        }
        return res;
    }

    public async Task<MonitoringOperationDto> SubmitDrugTestAsync(DrugTestModel model, CancellationToken ct = default)
    {
        EnsureConfigured();

        var res = await _client.PostAsync<DrugTestModel, MonitoringOperationDto>("ComplianceMonitoringOperations", model, ct);
        if (res == null)
        {
            throw new InvalidOperationException("Failed to submit drug test result to Dynamics 365.");
        }
        return res;
    }

    public async Task<MonitoringOperationDto?> UpdateMonitoringStatusAsync(string id, string status, string? note, CancellationToken ct = default)
    {
        EnsureConfigured();

        var body = new { Status = status, ReviewNote = note, UpdatedAt = DateTime.UtcNow };
        return await _client.PatchAsync<object, MonitoringOperationDto>($"ComplianceMonitoringOperations('{id}')", body, ct);
    }

    public async Task<List<D365NotificationDto>> GetNotificationsAsync(string workerId, CancellationToken ct = default)
    {
        EnsureConfigured();

        var filter = $"cross-company=true&$filter=WorkerPersonnelNumber eq '{workerId}'";
        var notifs = await _client.GetAsync<List<D365NotificationDto>>("HcmSystemAlertNotifications", filter, ct);
        return notifs ?? new List<D365NotificationDto>();
    }

    public async Task<List<UnifiedRequestItemDto>> GetUnifiedRequestsAsync(CancellationToken ct = default)
    {
        EnsureConfigured();

        var filter = $"cross-company=true&$filter=dataAreaId eq '{_settings.LegalEntity}'";
        var list = await _client.GetAsync<List<UnifiedRequestItemDto>>("UnifiedWorkflowWorkItems", filter, ct);
        return list ?? new List<UnifiedRequestItemDto>();
    }
}
