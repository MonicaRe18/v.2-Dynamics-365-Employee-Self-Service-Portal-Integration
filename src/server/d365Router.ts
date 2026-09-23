/**
 * Microsoft Dynamics 365 Finance & Operations Express Router
 * Implements real REST & OData v4 endpoints for ESS & MSS integration
 */

import { Router, Request, Response } from 'express';
import { INITIAL_TEAM_MEMBERS } from '../data/teamData';
import {
  Employee,
  LeaveBalance,
  LeaveMovementTransaction,
  LeaveRequest,
  Penalty,
  Grievance,
  TrainingCourse,
  TrainingEvaluation,
  PerformanceEvaluation,
  MonitoringOperation,
  DelegatedEmployee,
  D365Notification,
  TeamMember,
} from '../types/d365.types';

export const d365Router = Router();

// In-memory data store on the server
let serverEmployee: Employee = {
  id: 'EMP-10492',
  name: 'هدى فتحي عبد المجيد',
  jobTitle: 'محلل نظم أول',
  department: 'تكنولوجيا المعلومات',
  division: 'وظائف متخصصة',
  hireDate: '2020-01-15',
  directManager: 'مدير عام الإدارة العامة لتكنولوجيا المعلومات',
  jobGrade: 'الدرجة الأولى أ',
  employmentStatus: 'Active',
  employmentStatusAr: 'قائم بالعمل',
  email: 'hoda.fathi@contoso.gov.eg',
  phone: '+20 10 1234 5678',
  legalEntity: 'EG01 - الإدارة العامة للتحول الرقمي',
  civilId: '28509180102934',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
};

let serverLeaveBalances: LeaveBalance[] = [
  {
    id: 'BAL-001',
    leaveTypeCode: 'ANNUAL',
    leaveTypeTitle: 'اجازة اعتيادي',
    unit: 'أيام',
    currentBalance: 24.0,
    allocatedBalance: 30.0,
    consumedBalance: 6.0,
    pendingBalance: 0,
    accrualRate: '30.00 الأيام / سنوياً',
    asOfDate: '2025-09-18',
    accrualPlanId: 'PLAN-ANN-30',
  },
  {
    id: 'BAL-002',
    leaveTypeCode: 'CASUAL',
    leaveTypeTitle: 'اجازة عارضة',
    unit: 'أيام',
    currentBalance: 4.0,
    allocatedBalance: 6.0,
    consumedBalance: 2.0,
    pendingBalance: 0,
    accrualRate: '6.00 الأيام / سنوياً',
    asOfDate: '2025-09-18',
    accrualPlanId: 'PLAN-CAS-06',
  },
  {
    id: 'BAL-003',
    leaveTypeCode: 'SICK',
    leaveTypeTitle: 'اجازة مرضي',
    unit: 'أيام',
    currentBalance: 120.0,
    allocatedBalance: 120.0,
    consumedBalance: 0,
    pendingBalance: 0,
    accrualRate: '120.00 الأيام / سنوياً',
    asOfDate: '2025-09-18',
    accrualPlanId: 'PLAN-SICK-120',
  },
  {
    id: 'BAL-004',
    leaveTypeCode: 'MATERNITY',
    leaveTypeTitle: 'اجازة وضع',
    unit: 'أيام',
    currentBalance: 120.0,
    allocatedBalance: 120.0,
    consumedBalance: 0,
    pendingBalance: 0,
    accrualRate: 'بلا',
    asOfDate: '2025-09-18',
    accrualPlanId: 'PLAN-MAT-120',
  },
  {
    id: 'BAL-005',
    leaveTypeCode: 'PERMISSION',
    leaveTypeTitle: 'اذن غياب',
    unit: 'ساعات',
    currentBalance: 24.39,
    allocatedBalance: 72.0,
    consumedBalance: 47.61,
    pendingBalance: 0,
    accrualRate: '6.00 ساعات / شهري',
    asOfDate: '2025-09-18',
    accrualPlanId: 'PLAN-PERM-06',
  },
  {
    id: 'BAL-006',
    leaveTypeCode: 'FAMILY_CARE',
    leaveTypeTitle: 'رعاية اسرة',
    unit: 'ساعات',
    currentBalance: 0.0,
    allocatedBalance: 0.0,
    consumedBalance: 0,
    pendingBalance: 0,
    accrualRate: 'بلا',
    asOfDate: '2025-09-18',
    accrualPlanId: 'PLAN-FAM-00',
  },
  {
    id: 'BAL-007',
    leaveTypeCode: 'CHILD_CARE',
    leaveTypeTitle: 'رعاية طفل',
    unit: 'أيام',
    currentBalance: 2190.0,
    allocatedBalance: 2190.0,
    consumedBalance: 0,
    pendingBalance: 0,
    accrualRate: 'بلا',
    asOfDate: '2025-09-18',
    accrualPlanId: 'PLAN-CHILD-2190',
  },
];

let serverLeaveTransactions: LeaveMovementTransaction[] = [
  {
    id: 'TXN-101',
    transactionType: 'استحقاق دوري',
    transactionDate: '2025-01-01',
    amount: 30,
    balanceAfter: 30,
    referenceNumber: 'ACCR-2025-01',
    notes: 'استحقاق رصيد الإجازة الاعتيادية السنوي للعام 2025',
  },
  {
    id: 'TXN-102',
    transactionType: 'خصم إجازة معتمدة',
    transactionDate: '2025-03-10',
    amount: -4,
    balanceAfter: 26,
    referenceNumber: 'LR-2025-081',
    notes: 'إجازة اعتيادية معتمدة بقرار رقم 81 لسنة 2025',
  },
  {
    id: 'TXN-103',
    transactionType: 'خصم إجازة معتمدة',
    transactionDate: '2025-07-22',
    amount: -2,
    balanceAfter: 24,
    referenceNumber: 'LR-2025-142',
    notes: 'إجازة اعتيادية معتمدة بقرار رقم 142 لسنة 2025',
  },
  {
    id: 'TXN-201',
    transactionType: 'استحقاق دوري',
    transactionDate: '2025-01-01',
    amount: 6,
    balanceAfter: 6,
    referenceNumber: 'ACCR-CAS-2025',
    notes: 'الرصيد المخصص للإجازات العارضة للعام 2025',
  },
  {
    id: 'TXN-202',
    transactionType: 'خصم إجازة معتمدة',
    transactionDate: '2025-02-14',
    amount: -2,
    balanceAfter: 4,
    referenceNumber: 'LR-2025-019',
    notes: 'إجازة عارضة لظرف طارئ',
  },
  {
    id: 'TXN-501',
    transactionType: 'استحقاق دوري',
    transactionDate: '2025-09-01',
    amount: 6.0,
    balanceAfter: 24.39,
    referenceNumber: 'PERM-ACCR-09',
    notes: 'حصة أذون الغياب الشهرية المعتمدة لشهر سبتمبر',
  },
];

let serverLeaveRequests: LeaveRequest[] = [
  {
    id: 'REQ-2025-001',
    employeeId: 'EMP-10492',
    employeeName: 'هدى فتحي عبد المجيد',
    leaveTypeCode: 'ANNUAL',
    leaveTypeTitle: 'اجازة اعتيادي',
    startDate: '2025-03-01',
    endDate: '2025-03-04',
    requestedDays: 4,
    delegatedEmployeeId: 'EMP-10001',
    delegatedEmployeeName: 'أحمد المحمدي',
    delegatedEmployeeTitle: 'محلل نظم',
    socialInsuranceOption: true,
    healthInsuranceOption: true,
    attachments: [],
    submissionDate: '2025-02-20',
    status: 'Approved',
    statusAr: 'معتمد',
    notes: 'إجازة سنوية اعتيادية للراحة',
    d365SyncStatus: 'Synced',
  },
  {
    id: 'REQ-2025-002',
    employeeId: 'EMP-10492',
    employeeName: 'هدى فتحي عبد المجيد',
    leaveTypeCode: 'CASUAL',
    leaveTypeTitle: 'اجازة عارضة',
    startDate: '2025-02-14',
    endDate: '2025-02-15',
    requestedDays: 2,
    delegatedEmployeeId: 'EMP-10812',
    delegatedEmployeeName: 'سارة العبدالله',
    delegatedEmployeeTitle: 'مهندسة برمجيات',
    socialInsuranceOption: true,
    healthInsuranceOption: true,
    attachments: [],
    submissionDate: '2025-02-13',
    status: 'Approved',
    statusAr: 'معتمد',
    notes: 'ظرف عائلي طارئ',
    d365SyncStatus: 'Synced',
  },
];

let serverPenalties: Penalty[] = [
  {
    id: 'PEN-001',
    penaltyNumber: '2024/112',
    penaltySigningDate: '2024-05-15',
    penaltyStartDate: '2024-05-20',
    penaltyRemovalDate: '2024-11-20',
    action: 'إنذار كتابي',
    employeePenalty: 'إنذار رسمي موجه من الإدارة',
    duration: '6 أشهر',
    penaltyStatus: 'Active',
    penaltyStatusAr: 'ساري',
    investigationAuthority: 'الشؤون القانونية',
    penaltyDetails: 'تأخير غير مبرر في تسليم تقرير تحليل نظم متطلبات التحول الرقمي.',
    hasGrievance: false,
  },
  {
    id: 'PEN-002',
    penaltyNumber: '2023/045',
    penaltySigningDate: '2023-08-10',
    penaltyStartDate: '2023-08-15',
    penaltyRemovalDate: '2024-08-15',
    action: 'خصم يوم من الراتب',
    employeePenalty: 'خصم مالي يعادل أجر يوم واحد',
    duration: 'سنة واحدة',
    penaltyStatus: 'Expired',
    penaltyStatusAr: 'تم المحو',
    investigationAuthority: 'إدارة المتابعة والتفتيش',
    penaltyDetails: 'عدم توثيق الحضور والانصراف وفقاً للتعليمات المقررة.',
    hasGrievance: false,
  },
];

let serverGrievances: Grievance[] = [];

let serverTrainingCourses: TrainingCourse[] = [
  {
    id: 'TRN-001',
    courseId: 'CRS-D365-01',
    courseTitle: 'تطوير وتخصيص حلول Microsoft Dynamics 365 Finance & Operations',
    provider: 'مركز التميز للتحول الرقمي - وزارة الاتصالات',
    location: 'قاعة التدريب الذكية - القرية الذكية',
    startDate: '2025-01-10',
    endDate: '2025-01-24',
    durationHours: 40,
    attendanceStatus: 'Attended',
    attendanceStatusAr: 'تم الحضور',
    generalEvaluationStatus: 'Evaluated',
    generalEvaluationScore: '4.8',
    evaluationAfter3MonthsStatus: 'Completed',
    evaluationAfter3MonthsScore: '4.6',
  },
  {
    id: 'TRN-002',
    courseId: 'CRS-SEC-04',
    courseTitle: 'الأمن السيبراني وحماية البيانات الحكومية الحساسة',
    provider: 'المعهد القومي للاتصالات',
    location: 'تدريب هجين (عن بُعد وحضوري)',
    startDate: '2025-06-01',
    endDate: '2025-06-12',
    durationHours: 30,
    attendanceStatus: 'Attended',
    attendanceStatusAr: 'تم الحضور',
    generalEvaluationStatus: 'Evaluated',
    generalEvaluationScore: '4.9',
    evaluationAfter3MonthsStatus: 'Pending',
  },
  {
    id: 'TRN-003',
    courseId: 'CRS-AI-08',
    courseTitle: 'تطبيقات الذكاء الاصطناعي التوليدي في أتمتة العمليات الحكومية',
    provider: 'أكاديمية تكنولوجيا المعلومات',
    location: 'المنصة الافتراضية للتدريب',
    startDate: '2025-09-05',
    endDate: '2025-09-15',
    durationHours: 25,
    attendanceStatus: 'Registered',
    attendanceStatusAr: 'مسجل',
    generalEvaluationStatus: 'PendingEvaluation',
    evaluationAfter3MonthsStatus: 'Pending',
  },
];

let serverPerformanceEvaluations: PerformanceEvaluation[] = [
  {
    id: 'EVAL-2024',
    year: '2024',
    cycle: 'التقييم السنوي لعام 2024',
    rating: 'ممتاز - يتجاوز التوقعات (4.9 / 5.0)',
    reviewerName: 'د. أحمد محمد عبد الله',
    reviewDate: '2024-12-28',
    status: 'معتمد نهائياً',
    competenciesScore: 98,
    goalsAchievedCount: 5,
    totalGoalsCount: 5,
  },
  {
    id: 'EVAL-2023',
    year: '2023',
    cycle: 'التقييم السنوي لعام 2023',
    rating: 'ممتاز - يلبي ويتجاوز التوقعات (4.7 / 5.0)',
    reviewerName: 'د. أحمد محمد عبد الله',
    reviewDate: '2023-12-26',
    status: 'معتمد نهائياً',
    competenciesScore: 94,
    goalsAchievedCount: 4,
    totalGoalsCount: 4,
  },
];

let serverMonitoringOperations: MonitoringOperation[] = [
  {
    id: 'DISC-2025-001',
    timestamp: '2025-01-20',
    operationType: 'FINANCIAL_DISCLOSURE',
    actionTitle: 'إقرار الذمة المالية الدوري لعام 2025',
    category: 'إقرار ذمة مالية',
    referenceNumber: 'DISC-2025-001',
    entity: 'جهاز الكسب غير المشروع',
    details: 'إقرار دوري كل خمس سنوات وفقاً لأحكام القانون رقم 62 لسنة 1975.',
    user: 'هدى فتحي عبد المجيد',
    status: 'مكتمل / مستوفي',
    attachmentsCount: 1,
    attachments: [
      {
        id: 'ATT-01',
        fileName: 'إقرار_الذمة_المالية_الموثق_2025.pdf',
        fileSize: '2.4 MB',
        uploadDate: '2025-01-20',
        fileType: 'application/pdf',
      },
    ],
  },
];

let serverNotifications: D365Notification[] = [
  {
    id: 'NOTIF-001',
    title: 'اعتماد طلب الإجازة الاعتيادية',
    message: 'تم اعتماد طلب إجازتك الاعتيادية (REQ-2025-001) من قبل المدير المباشر وتحديث الرصيد في Dynamics 365.',
    timestamp: 'منذ ساعتين',
    type: 'success',
    isRead: false,
  },
  {
    id: 'NOTIF-002',
    title: 'تذكير: تقييم أثر دورة تدريبية',
    message: 'يرجى استكمال استبيان قياس أثر التدريب بعد 3 أشهر لدورة "الأمن السيبراني وحماية البيانات".',
    timestamp: 'أمس',
    type: 'info',
    isRead: false,
  },
];

let serverDelegatedEmployees: DelegatedEmployee[] = [
  {
    id: 'EMP-10001',
    workerNumber: 'EMP-10001',
    name: 'أحمد المحمدي',
    jobTitle: 'محلل نظم',
    department: 'تكنولوجيا المعلومات',
  },
  {
    id: 'EMP-10812',
    workerNumber: 'EMP-10812',
    name: 'سارة العبدالله',
    jobTitle: 'مهندسة برمجيات',
    department: 'تكنولوجيا المعلومات',
  },
  {
    id: 'EMP-10904',
    workerNumber: 'EMP-10904',
    name: 'خالد القحطاني',
    jobTitle: 'أخصائي قواعد بيانات',
    department: 'تكنولوجيا المعلومات',
  },
];

let serverTeamMembers: TeamMember[] = [...INITIAL_TEAM_MEMBERS];

// Endpoints
d365Router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Microsoft Dynamics 365 Finance & Operations / HR Integration Service',
    environment: 'Contoso-EG01-Production',
    legalEntity: 'EG01',
    timestamp: new Date().toISOString(),
  });
});

// Employee
d365Router.get('/employees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (id === serverEmployee.id || id === 'current' || id === serverEmployee.civilId) {
    return res.json(serverEmployee);
  }
  const member = serverTeamMembers.find((m) => m.id === id || m.civilId === id);
  if (member) {
    return res.json({
      id: member.id,
      name: member.name,
      jobTitle: member.jobTitle,
      department: member.department,
      division: 'وظائف متخصصة',
      hireDate: member.hireDate,
      directManager: 'د. أحمد محمد عبد الله',
      jobGrade: member.grade,
      employmentStatus: 'Active',
      employmentStatusAr: 'قائم بالعمل',
      email: member.email,
      phone: member.phone,
      legalEntity: 'EG01 - الإدارة العامة للتحول الرقمي',
      civilId: member.civilId,
      avatarUrl: member.avatarUrl,
    });
  }
  return res.status(404).json({ error: { message: `الموظف برقم ${id} غير مسجل في خادم Dynamics 365.` } });
});

d365Router.put('/employees/:id', (req: Request, res: Response) => {
  serverEmployee = { ...serverEmployee, ...req.body };
  res.json(serverEmployee);
});

// Performance
d365Router.get('/performance-evaluations', (_req: Request, res: Response) => {
  res.json(serverPerformanceEvaluations);
});

// Monitoring
d365Router.get('/monitoring-operations', (_req: Request, res: Response) => {
  res.json(serverMonitoringOperations);
});

d365Router.post('/monitoring-operations/disclosure', (req: Request, res: Response) => {
  const newOp: MonitoringOperation = {
    id: `DISC-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString().split('T')[0],
    operationType: 'FINANCIAL_DISCLOSURE',
    actionTitle: `إقرار الذمة المالية الدوري لعام ${req.body.filingYear || new Date().getFullYear()}`,
    category: 'إقرار ذمة مالية',
    referenceNumber: `DISC-${Date.now().toString().slice(-4)}`,
    entity: 'جهاز الكسب غير المشروع',
    details: req.body.notes || 'تم استلام الإقرار وقيد المراجعة لدى هيئة الفحص والتحقيق.',
    user: 'هدى فتحي عبد المجيد',
    status: 'تم التقديم',
    attachmentsCount: req.body.attachments?.length || 0,
    attachments: req.body.attachments || [],
  };
  serverMonitoringOperations.unshift(newOp);
  res.status(201).json(newOp);
});

d365Router.post('/monitoring-operations/test', (req: Request, res: Response) => {
  const newOp: MonitoringOperation = {
    id: `TEST-${Date.now().toString().slice(-4)}`,
    timestamp: req.body.testDate || new Date().toISOString().split('T')[0],
    operationType: 'DRUG_TEST',
    actionTitle: `فحص الكشف الطبي والسموم (${req.body.sampleType || 'عينة بول دورية'})`,
    category: 'اختبار كشف ومخدرات',
    referenceNumber: `TEST-${Date.now().toString().slice(-4)}`,
    entity: req.body.medicalFacility || 'المعمل المشترك المعتمد',
    details: req.body.notes || 'تم إجراء الفحص الطبي المعتمد والنتيجة قيد المطابقة.',
    user: 'هدى فتحي عبد المجيد',
    status: 'تم التقديم',
    attachmentsCount: req.body.attachments?.length || 0,
    attachments: req.body.attachments || [],
  };
  serverMonitoringOperations.unshift(newOp);
  res.status(201).json(newOp);
});

d365Router.post('/monitoring-operations/:id/status', (req: Request, res: Response) => {
  const op = serverMonitoringOperations.find((o) => o.id === req.params.id);
  if (!op) {
    return res.status(404).json({ error: { message: 'عملية المتابعة غير موجودة' } });
  }
  op.status = req.body.status;
  if (req.body.note) op.details = `${op.details} - ${req.body.note}`;
  res.json(op);
});

// Notifications
d365Router.get('/notifications', (_req: Request, res: Response) => {
  res.json(serverNotifications);
});

// Leaves
d365Router.get('/leave-balances', (_req: Request, res: Response) => {
  res.json(serverLeaveBalances);
});

d365Router.get('/leave-transactions', (_req: Request, res: Response) => {
  res.json(serverLeaveTransactions);
});

d365Router.get('/leave-requests', (_req: Request, res: Response) => {
  res.json(serverLeaveRequests);
});

d365Router.post('/leave-requests', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.leaveTypeCode || !body.startDate || !body.endDate) {
    return res.status(400).json({ error: { message: 'بيانات طلب الإجازة غير مكتملة (نوع الإجازة وتاريخ البدء والانتهاء إلزامية).' } });
  }

  const newRequest: LeaveRequest = {
    id: `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    employeeId: 'EMP-10492',
    employeeName: 'هدى فتحي عبد المجيد',
    leaveTypeCode: body.leaveTypeCode,
    leaveTypeTitle: body.leaveTypeTitle || 'إجازة اعتيادية',
    startDate: body.startDate,
    endDate: body.endDate,
    requestedDays: body.requestedDays || 1,
    delegatedEmployeeId: body.delegatedEmployeeId || 'EMP-10001',
    delegatedEmployeeName: body.delegatedEmployeeName || 'أحمد المحمدي',
    delegatedEmployeeTitle: 'محلل نظم',
    socialInsuranceOption: body.socialInsuranceOption ?? true,
    healthInsuranceOption: body.healthInsuranceOption ?? true,
    attachments: body.attachments || [],
    submissionDate: new Date().toISOString().split('T')[0],
    status: 'InReview',
    statusAr: 'قيد المراجعة',
    notes: body.notes || '',
    d365SyncStatus: 'Synced',
  };

  serverLeaveRequests.unshift(newRequest);
  res.status(201).json(newRequest);
});

d365Router.delete('/leave-requests/:id', (req: Request, res: Response) => {
  const index = serverLeaveRequests.findIndex((r) => r.id === req.params.id);
  if (index >= 0) {
    serverLeaveRequests.splice(index, 1);
    return res.json({ success: true });
  }
  return res.status(404).json({ error: { message: 'طلب الإجازة غير موجود' } });
});

d365Router.get('/delegated-employees', (_req: Request, res: Response) => {
  res.json(serverDelegatedEmployees);
});

// Penalties
d365Router.get('/penalties', (_req: Request, res: Response) => {
  res.json(serverPenalties);
});

d365Router.post('/penalties/grievance', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.penaltyId || (!body.reasons && !body.grievanceDetails)) {
    return res.status(400).json({ error: { message: 'بيانات التظلم غير مكتملة (معرف الجزاء وأسباب التظلم مطلوبة).' } });
  }

  const newGrievance: Grievance = {
    id: `GRV-${Date.now().toString().slice(-4)}`,
    penaltyId: body.penaltyId,
    penaltyNumber: body.penaltyNumber || '2024/112',
    grievanceDate: new Date().toISOString().split('T')[0],
    grievanceSubject: body.grievanceSubject || 'تظلم رسمي ضد الجزاء التأديبي',
    grievanceDetails: body.reasons || body.grievanceDetails || 'أسباب التظلم القانونية',
    attachments: body.attachments || [],
    submissionDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    statusAr: 'قيد الدراسة لدى لجنة التظلمات',
  };

  serverGrievances.unshift(newGrievance);
  res.status(201).json(newGrievance);
});

// Training
d365Router.get('/training-courses', (_req: Request, res: Response) => {
  res.json(serverTrainingCourses);
});

d365Router.post('/training-courses/evaluation', (req: Request, res: Response) => {
  const body = req.body;
  const course = serverTrainingCourses.find((c) => c.id === body.courseId || c.courseId === body.courseId);
  if (!course) {
    return res.status(404).json({ error: { message: 'الدورة التدريبية غير موجودة' } });
  }

  course.generalEvaluationStatus = 'Evaluated';
  course.generalEvaluationScore = '4.8';

  const newEval: TrainingEvaluation = {
    id: `EVAL-${Date.now().toString().slice(-4)}`,
    courseId: course.courseId,
    courseTitle: course.courseTitle,
    submissionDate: new Date().toISOString().split('T')[0],
    trainerKnowledge: body.trainerKnowledge || 'ممتاز',
    trainerEngagement: body.trainerEngagement || 'ممتاز',
    courseContent: body.courseContent || 'ممتاز',
    overallProgramEvaluation: body.overallProgramEvaluation || 'ممتاز',
    programDuration: body.programDuration || 'جيد جداً',
    positiveFeedback: body.comments,
  };

  res.status(201).json(newEval);
});

// Team (Manager Self-Service)
d365Router.get('/team-members', (_req: Request, res: Response) => {
  res.json(serverTeamMembers);
});

d365Router.post('/team-requests/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;

  for (const member of serverTeamMembers) {
    const reqItem = member.requests.find((r) => r.id === id);
    if (reqItem) {
      reqItem.status = 'معتمد';
      reqItem.decisionDate = new Date().toISOString().split('T')[0];
      reqItem.managerNotes = notes || 'تمت الموافقة من قبل المدير المباشر عبر Dynamics 365';
      return res.json(reqItem);
    }
  }

  return res.status(404).json({ error: { message: `الطلب رقم ${id} غير موجود في سجلات الفريق.` } });
});

d365Router.post('/team-requests/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: { message: 'سبب الرفض إلزامي وفقاً لتعليمات Dynamics 365.' } });
  }

  for (const member of serverTeamMembers) {
    const reqItem = member.requests.find((r) => r.id === id);
    if (reqItem) {
      reqItem.status = 'مرفوض';
      reqItem.decisionDate = new Date().toISOString().split('T')[0];
      reqItem.managerNotes = reason;
      return res.json(reqItem);
    }
  }

  return res.status(404).json({ error: { message: `الطلب رقم ${id} غير موجود في سجلات الفريق.` } });
});

d365Router.post('/team-requests/on-behalf/leave', (req: Request, res: Response) => {
  const { memberId, leaveType, startDate, endDate, days, notes } = req.body;
  const member = serverTeamMembers.find((m) => m.id === memberId);
  if (!member) {
    return res.status(404).json({ error: { message: 'الموظف غير موجود في سجلات الفريق' } });
  }

  const newReq = {
    id: `REQ-${Date.now().toString().slice(-4)}`,
    employeeId: member.id,
    employeeName: member.name,
    employeeJobTitle: member.jobTitle,
    requestType: (leaveType || 'إجازة اعتيادية') as any,
    details: notes || `طلب إجازة بالنيابة (${startDate} إلى ${endDate})`,
    submissionDate: new Date().toISOString().split('T')[0],
    dates: `${startDate} إلى ${endDate}`,
    duration: `${days || 1} أيام`,
    status: 'معتمد' as const,
    decisionDate: new Date().toISOString().split('T')[0],
    managerNotes: 'تم تقديم واعتماد الطلب بالنيابة من قبل المدير المباشر',
  };

  member.requests.unshift(newReq);
  res.status(201).json(newReq);
});

d365Router.post('/team-requests/on-behalf/absence', (req: Request, res: Response) => {
  const { memberId, duration, date, reason } = req.body;
  const member = serverTeamMembers.find((m) => m.id === memberId);
  if (!member) {
    return res.status(404).json({ error: { message: 'الموظف غير موجود في سجلات الفريق' } });
  }

  const newReq = {
    id: `REQ-${Date.now().toString().slice(-4)}`,
    employeeId: member.id,
    employeeName: member.name,
    employeeJobTitle: member.jobTitle,
    requestType: 'إذن غياب' as const,
    details: reason || 'إذن غياب بالنيابة لأسباب العمل الرسمية',
    submissionDate: new Date().toISOString().split('T')[0],
    dates: date || new Date().toISOString().split('T')[0],
    duration: duration || '2 ساعة',
    status: 'معتمد' as const,
    decisionDate: new Date().toISOString().split('T')[0],
    managerNotes: 'تم منح الإذن بالنيابة من قبل المدير المباشر',
  };

  member.requests.unshift(newReq);
  res.status(201).json(newReq);
});
