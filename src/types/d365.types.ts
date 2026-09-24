/**
 * Microsoft Dynamics 365 Finance & Operations
 * Data Models & Entity Contracts for Human Resources & Employee Self-Service (ESS)
 * OData Entity Schemas: HcmWorker, HcmLeaveBalance, HcmLeaveRequest, HcmDisciplinaryAction, HcmCourseAttendance
 */

export interface EmployeePersonalDetails {
  maritalStatus: string; // الحالة الاجتماعية e.g. 'متزوجة'
  maritalStatusDate: string; // تاريخ الحالة الاجتماعية e.g. '2012-04-18'
  dependentsCount: number | string; // عدد المعالين e.g. 2
  spouseWorking: 'نعم' | 'لا' | string; // الزوجة تعمل e.g. 'نعم'
  religion: string; // الديانة e.g. 'مسلم'
  educationQualification: string; // المؤهل العلمي e.g. 'بكالوريوس حاسبات ومعلومات - علوم الحاسب'
  retirementDate: string; // تاريخ الإحالة إلى المعاش e.g. '2045-09-18'
  isDisabled: 'نعم' | 'لا' | string; // شخص معاق e.g. 'لا'
  verificationDate: string; // تاريخ التحقق e.g. '2024-01-10'
}

export interface Employee {
  id: string; // WorkerPersonnelNumber
  name: string; // WorkerName
  jobTitle: string; // JobDescription
  department: string; // DepartmentName
  division: string; // Division / Section
  hireDate: string; // EmploymentStartDate
  yearsOfService?: string; // سنوات الخدمة (e.g. '6 سنوات')
  directManager: string; // ReportsToWorkerName (e.g., 'د. سامي فهد العمر')
  jobGrade: string; // CompensationGrade (e.g., 'المرتبة السابعة - الدرجة 3')
  jobGroup?: string; // PAR_JobType description
  employmentStatus: string; // Dynamics status, when exposed
  employmentStatusAr: string; // 'على رأس العمل - نشط'
  email: string;
  phone: string;
  legalEntity: string; // DataAreaId (e.g., 'USMF' / 'شركة التقنية المتقدمة')
  civilId: string; // National ID / Iqama
  avatarUrl?: string;
  personalDetails?: EmployeePersonalDetails;
}

export type LeaveTypeCode =
  | 'ANNUAL'
  | 'CASUAL'
  | 'SICK'
  | 'MATERNITY'
  | 'PERMISSION'
  | 'FAMILY_CARE'
  | 'CHILD_CARE'
  | 'COMPENSATORY'
  | 'HAJJ'
  | 'BEREAVEMENT'
  | 'PTO'
  | 'VACATION';

export interface LeaveBalance {
  id: string;
  leaveTypeCode: LeaveTypeCode;
  leaveTypeTitle: string; // e.g., 'اجازة اعتيادي'
  unit: string; // Unit of measure returned by Dynamics
  currentBalance: number; // Current available balance e.g. 24.00
  allocatedBalance: number; // Annual allocation e.g. 30.00
  consumedBalance: number; // Used this year
  pendingBalance: number; // In-workflow pending requests
  accrualRate: string; // e.g. '30.00 الأيام / سنوياً'
  asOfDate: string; // Balance cutoff date
  accrualPlanId: string; // D365 Plan Id e.g., 'PLAN-ANN-30'
}

export interface LeaveMovementTransaction {
  id: string;
  transactionDate: string;
  transactionType: 'استحقاق دوري' | 'خصم إجازة معتمدة' | 'تسوية رصيد' | 'ترحيل سنوي' | 'إلغاء طلب';
  amount: number; // + or -
  balanceAfter: number;
  referenceNumber: string;
  notes: string;
}

export type LeaveRequestStatus = 'Draft' | 'Submitted' | 'InReview' | 'Approved' | 'Rejected' | 'Canceled';

export interface LeaveRequest {
  saveAsDraft?: boolean;
  id: string; // RequestId e.g., 'LR-2026-089'
  employeeId: string;
  employeeName: string;
  leaveTypeCode: LeaveTypeCode;
  leaveTypeTitle: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  delegatedEmployeeId: string;
  delegatedEmployeeName: string;
  delegatedEmployeeTitle: string;
  socialInsuranceOption: boolean; // خيار التأمينات الاجتماعية
  healthInsuranceOption: boolean; // خيار التأمين الصحي
  attachments: Array<{
    id: string;
    fileName: string;
    fileSize: string;
    uploadDate: string;
  }>;
  notes: string;
  submissionDate: string;
  status: LeaveRequestStatus;
  statusAr: string;
  workflowStep?: string; // e.g., 'في انتظار موافقة المدير المباشر'
  rejectionReason?: string;
  d365SyncStatus: 'Synced' | 'Pending' | 'Error';
}

export type PenaltyStatus = 'Active' | 'UnderGrievance' | 'GrievanceAccepted' | 'Canceled' | 'Expired';

export interface Penalty {
  id: string; // PenaltyId e.g., 'DISC-2025-014'
  penaltyNumber: string; // رقم الجزاء الرسمي e.g. 'UAT-000031'
  penaltyStatus: PenaltyStatus;
  penaltyStatusAr: string; // e.g. 'الإحالة لمحكمة تأديبية' or 'سارية'
  hearingStatus?: string; // e.g. 'الإحالة لمحكمة تأديبية'
  penaltySigningDate: string; // تاريخ توقيع الجزاء e.g. '2025-09-07'
  penaltyStartDate: string; // تاريخ سريان الجزاء
  penaltyRemovalDate: string; // تاريخ محو الجزاء e.g. '2026-09-07'
  action: string; // الإجراء المتخذ (e.g. 'إنذار', 'خصم من الراتب', 'لفت نظر كتابي')
  penaltyDetails: string; // تفاصيل وسبب الجزاء
  investigationAuthority: string; // جهة التحقيق (e.g. 'الشئون القانونية')
  employeePenalty: string; // عقوبة الموظف e.g. 'إنذار'
  duration: string; // المدة e.g., '-' or 'خصم 3 أيام'
  hasGrievance: boolean;
  grievanceId?: string;
  grievanceStatus?: string;
}

export interface Grievance {
  id: string; // e.g., 'GRV-2026-004'
  penaltyId: string;
  penaltyNumber: string;
  grievanceDate: string;
  grievanceSubject: string; // موضوع التظلم
  grievanceDetails: string; // مبررات وأسباب التظلم
  attachments: Array<{
    id: string;
    fileName: string;
    fileSize: string;
  }>;
  submissionDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  statusAr: string;
  committeeDecision?: string;
}

export interface TrainingCourse {
  id: string; // e.g., 'TRN-2026-102'
  courseId: string; // رمز الدورة D365 e.g., 'CRS-AZ-900'
  courseTitle: string; // عنوان الدورة
  provider: string; // الجهة التدريبية
  location: string; // المقر / عن بعد
  startDate: string;
  endDate: string;
  durationHours: number;
  attendanceStatus: 'Attended' | 'Registered' | 'Canceled';
  attendanceStatusAr: string;
  generalEvaluationStatus: 'Evaluated' | 'PendingEvaluation';
  generalEvaluationScore?: string; // 'ممتاز' | 'جيد جداً' إلخ
  evaluationAfter3MonthsStatus: 'Completed' | 'Pending' | 'NotApplicable';
  evaluationAfter3MonthsScore?: string;
  evaluationId?: string;
}

export type EvaluationRating = 'ممتاز' | 'جيد جداً' | 'جيد' | 'متوسط' | 'ضعيف';

export interface TrainingEvaluation {
  id: string;
  courseId: string;
  courseTitle: string;
  submissionDate: string;
  // 5 criteria specified in the prompt:
  trainerKnowledge: EvaluationRating; // معرفة وخبرة المدرب بالموضوع
  trainerEngagement: EvaluationRating; // قدرة المدرب على إشراك المتدربين والتفاعل
  courseContent: EvaluationRating; // محتوى وجودة المادة التدريبية
  overallProgramEvaluation: EvaluationRating; // التقييم العام للبرنامج التدريبي
  programDuration: EvaluationRating; // مناسبة مدة البرنامج التدريبي للمحتوى
  positiveFeedback?: string;
  improvementFeedback?: string;
}

export interface PerformanceEvaluation {
  id: string;
  year: string;
  cycle: string; // e.g., 'التقييم السنوي لعام 2025'
  rating: string; // e.g., 'يتجاوز التوقعات (4.8 / 5.0)'
  reviewerName: string;
  reviewDate: string;
  status: 'معتمد نهائياً';
  competenciesScore: number;
  goalsAchievedCount: number;
  totalGoalsCount: number;
}

export type MonitoringOperationType = 'FINANCIAL_DISCLOSURE' | 'DRUG_TEST' | 'MEDICAL_TEST';

export type MonitoringRequestStatus =
  | 'استكمل المطلوب'
  | 'تم التقديم'
  | 'جاري المراجعة'
  | 'مكتمل / مستوفي';

export interface MonitoringAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  category?: string;
  fileType?: string;
}

export interface MonitoringOperation {
  id: string;
  timestamp: string;
  operationType: MonitoringOperationType;
  actionTitle: string;
  category: 'إقرار ذمة مالية' | 'اختبار كشف ومخدرات' | 'اختبار فحص دوري';
  referenceNumber: string;
  entity: string;
  details: string;
  result?: string;
  validUntil?: string;
  dueDate?: string;
  user: string;
  status: MonitoringRequestStatus;
  attachments?: MonitoringAttachment[];
  attachmentsCount?: number;
  requiredAttachmentsList?: string[];
  submittedData?: {
    disclosureType?: string;
    filingYear?: string;
    realEstateSummary?: string;
    movableAssetsSummary?: string;
    cashAndDepositsSummary?: string;
    debtsAndLiabilitiesSummary?: string;
    testType?: string;
    testDate?: string;
    reportNumber?: string;
    medicalResult?: string;
    testNotes?: string;
  };
  history?: {
    date: string;
    status: MonitoringRequestStatus;
    note: string;
    by: string;
  }[];
}

export interface DelegatedEmployee {
  id: string;
  workerNumber: string;
  name: string;
  jobTitle: string;
  department: string;
  avatar?: string;
}

export interface D365Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'info' | 'warning' | 'success';
}

// ==========================================
// MANAGER SELF-SERVICE (معلومات فريقي - My Team)
// ==========================================

export interface TeamPosition {
  positionId: string; // e.g. 'POS-HR-0042'
  positionTitle: string; // e.g. 'باحث تخطيط ومتابعة'
  department: string; // e.g. 'الموارد البشرية'
  division: string; // e.g. 'إدارة تخطيط القوى العاملة'
  reportsTo: string; // e.g. 'أحمد محمد عبد الله'
  grade: string; // e.g. 'الدرجة الثالثة التخصصية'
  workerAssigned: string;
  workerId: string;
  assignmentDate: string;
  fte: number; // 1.0
  status: 'مشغول' | 'شاغر';
}

export interface TeamMemberLeaveRecord {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'معتمد' | 'قيد المراجعة' | 'مرفوض';
  notes?: string;
}

export interface TeamMemberLeaveSummary {
  annualAvailable: number;
  annualAllocated: number;
  casualAvailable: number;
  casualAllocated: number;
  sickConsumed: number;
  recentLeaves: TeamMemberLeaveRecord[];
}

export interface TeamMemberTrainingPlan {
  id: string;
  courseTitle: string;
  provider: string;
  startDate: string;
  endDate: string;
  status: 'مكتمل' | 'مسجل' | 'مخطط';
  hours: number;
  evaluation?: string;
}

export interface TeamMemberPerformance {
  lastRating: string; // e.g. 'ممتاز - يتجاوز التوقعات (4.9 / 5.0)'
  cycle: string; // e.g. 'التقييم السنوي لعام 2025'
  goalsAchievedCount: number;
  totalGoalsCount: number;
  reviewDate: string;
  reviewerName: string;
  strengths: string;
  developmentAreas: string;
}

export interface TeamMemberPenalty {
  id: string;
  penaltyNumber: string;
  action: string; // e.g. 'إنذار كتابي' | 'خصم يومين'
  signingDate: string;
  duration: string;
  status: string; // e.g. 'ساري' | 'تم المحو'
  reason: string;
  investigationAuthority: string;
}

export interface TeamMemberRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeJobTitle: string;
  requestType: 'إجازة اعتيادية' | 'إجازة عارضة' | 'إذن غياب' | 'طلب ندب' | 'طلب إعارة' | 'طلب نقل';
  details: string;
  submissionDate: string;
  dates: string;
  duration: string;
  status: 'في انتظار موافقة المدير' | 'معتمد' | 'مرفوض';
  decisionDate?: string;
  managerNotes?: string;
}

export interface TeamMember {
  id: string; // WorkerPersonnelNumber (e.g. 'EMP-2041')
  name: string;
  jobTitle: string;
  department: string;
  avatarUrl?: string;
  directReportsCount?: number; // للشارة: التقارير المباشرة: 1
  civilId: string;
  hireDate: string;
  email: string;
  phone: string;
  grade: string;
  positionId: string;
  position: TeamPosition;
  leaves: TeamMemberLeaveSummary;
  trainingPlans: TeamMemberTrainingPlan[];
  performance: TeamMemberPerformance;
  penalties: TeamMemberPenalty[];
  requests: TeamMemberRequest[];
}

export type RequestStatusCode =
  | 'Draft'
  | 'InReview'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected';

export type RequestStatusAr =
  | 'مسودة'
  | 'قيد المراجعة'
  | 'بانتظار الموافقة'
  | 'تمت الموافقة'
  | 'مرفوض';

export interface RecentRequest {
  requestNumber: string; // رقم الطلب (e.g. 'REQ-LR-2026-089')
  requestType: string; // نوع الطلب (e.g. 'طلب إجازة اعتيادية')
  category: 'LEAVE' | 'PERMISSION' | 'SECONDMENT' | 'LOAN' | 'TRANSFER' | 'GRIEVANCE' | 'MONITORING';
  submissionDate: string; // تاريخ التقديم (e.g. '2026-09-18')
  fromDate?: string; // من تاريخ (e.g. '2026-10-01')
  toDate?: string; // إلى تاريخ (e.g. '2026-10-05')
  status: RequestStatusCode;
  statusAr: RequestStatusAr;
  employeeName: string;
  employeeId: string;
  notes?: string;
  details?: string;
  workflowStep?: string;
}

export interface UnifiedRequestItem extends RecentRequest {
  id: string;
  referenceNumber?: string;
}
