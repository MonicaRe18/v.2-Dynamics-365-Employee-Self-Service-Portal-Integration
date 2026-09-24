namespace D365.Ess.Api.Models;

public class D365PersonalDetailRecord
{
    public string PersonnelNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ReportsToName { get; set; } = string.Empty;
    public string PositionId { get; set; } = string.Empty;
}

public class D365PersonImageRecord
{
    public string PartyNumber { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
}

public class D365PositionRecord
{
    public string PositionId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DepartmentNumber { get; set; } = string.Empty;
}

public class D365AssignedPositionRecord
{
    public string PositionId { get; set; } = string.Empty;
    public string WorkerPersonnelNumber { get; set; } = string.Empty;
    public string WorkerName { get; set; } = string.Empty;
    public string DepartmentNumber { get; set; } = string.Empty;
    public string PaidByLegalEntity { get; set; } = string.Empty;
    public string IsPrimaryPosition { get; set; } = string.Empty;
    public string WorkerAssignmentStart { get; set; } = string.Empty;
    public string WorkerAssignmentEnd { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LevelCodeId { get; set; } = string.Empty;
    public string JobId { get; set; } = string.Empty;
}

public class D365JobRecord
{
    public string JobId { get; set; } = string.Empty;
    public string JobTypeId { get; set; } = string.Empty;
}

public class D365JobTypeRecord
{
    public string JobTypeId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class D365EmploymentDetailRecord
{
    public string PersonnelNumber { get; set; } = string.Empty;
    public string LegalEntityId { get; set; } = string.Empty;
    public string ValidFrom { get; set; } = string.Empty;
    public string ValidTo { get; set; } = string.Empty;
    public string EmploymentCategoryId { get; set; } = string.Empty;
}

public class D365DepartmentRecord
{
    public string OperatingUnitNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class D365LeaveBalanceRecord
{
    public string dataAreaId { get; set; } = string.Empty;
    public string PersonnelNumber { get; set; } = string.Empty;
    public string LeaveTypeId { get; set; } = string.Empty;
    public double LastCarryForwardAmount { get; set; }
    public double TakenThisYear { get; set; }
    public double TotalThisYear { get; set; }
    public double BalanceAvailable { get; set; }
    public string AccrualRateDescription { get; set; } = string.Empty;
}

public class D365LeaveTypeRecord
{
    public string LeaveTypeId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LeaveAmountUnit { get; set; } = string.Empty;
}

public class D365LeaveRequestHeaderRecord
{
    public string dataAreaId { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public string PersonnelNumber { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public string RequestDate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
}

public class D365LeaveRequestDetailRecord
{
    public string LeaveDate { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public string LeaveTypeId { get; set; } = string.Empty;
    public double Amount { get; set; }
}
