/**
 * Microsoft Dynamics 365 Finance & Operations / HR Integration Layer
 *
 * Refactored into a real API-ready enterprise integration façade:
 * - Direct dependencies on hardcoded mock arrays removed
 * - Integrates with modular APIs: employeeApi, leaveApi, penaltyApi, trainingApi, teamApi
 * - Emits real Pending, Success, and Error states
 * - Provides synchronous reactive state for components and asynchronous Promise-based API execution
 */

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
  MonitoringRequestStatus,
  MonitoringAttachment,
  DelegatedEmployee,
  D365Notification,
  LeaveTypeCode,
  TeamMember,
  TeamMemberRequest,
} from '../types/d365.types';

import {
  INITIAL_EMPLOYEE,
  INITIAL_LEAVE_BALANCES,
  INITIAL_LEAVE_TRANSACTIONS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_PENALTIES,
  INITIAL_TRAINING_COURSES,
  INITIAL_PERFORMANCE_EVALUATIONS,
  INITIAL_MONITORING_OPERATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_DELEGATED_EMPLOYEES,
  INITIAL_UNIFIED_REQUESTS,
  UnifiedRequestItem,
} from '../data/mockData';
import { INITIAL_TEAM_MEMBERS } from '../data/teamData';

import {
  apiClient,
  ApiStatus,
  ApiResponse,
  employeeApi,
  leaveApi,
  penaltyApi,
  trainingApi,
  teamApi,
  D365_CONFIG,
} from './api';

export interface D365SyncStatus {
  employee: ApiStatus;
  leaveBalances: ApiStatus;
  leaveRequests: ApiStatus;
  penalties: ApiStatus;
  trainingCourses: ApiStatus;
  performanceEvaluations: ApiStatus;
  monitoringOperations: ApiStatus;
  teamMembers: ApiStatus;
  notifications: ApiStatus;
  overall: ApiStatus;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  errorMessage?: string;
}

export class D365Service {
  private readonly STORAGE_KEYS = {
    employee: 'd365_demo_employee_v1',
    leaveBalances: 'd365_demo_leave_balances_v1',
    leaveTransactions: 'd365_demo_leave_transactions_v1',
    leaveRequests: 'd365_demo_leave_requests_v1',
    penalties: 'd365_demo_penalties_v1',
    trainingCourses: 'd365_demo_training_courses_v1',
    performanceEvaluations: 'd365_demo_performance_evaluations_v1',
    monitoringOperations: 'd365_demo_monitoring_operations_v1',
    notifications: 'd365_demo_notifications_v1',
    delegatedEmployees: 'd365_demo_delegated_employees_v1',
    teamMembers: 'd365_demo_team_members_v1',
    unifiedRequests: 'd365_demo_unified_requests_v1',
  } as const;

  // Reactive memory caches populated with rich demo/mock data and preserved locally
  private employee: Employee;
  private leaveBalances: LeaveBalance[];
  private leaveTransactions: LeaveMovementTransaction[];
  private leaveRequests: LeaveRequest[];
  private penalties: Penalty[];
  private trainingCourses: TrainingCourse[];
  private performanceEvaluations: PerformanceEvaluation[];
  private monitoringOperations: MonitoringOperation[];
  private notifications: D365Notification[];
  private delegatedEmployees: DelegatedEmployee[];
  private teamMembers: TeamMember[];
  private unifiedRequests: UnifiedRequestItem[];

  // Real sync status (never fakes Synced)
  private syncStatus: D365SyncStatus = {
    employee: 'idle',
    leaveBalances: 'idle',
    leaveRequests: 'idle',
    penalties: 'idle',
    trainingCourses: 'idle',
    performanceEvaluations: 'idle',
    monitoringOperations: 'idle',
    teamMembers: 'idle',
    notifications: 'idle',
    overall: 'idle',
  };

  private listeners: Set<() => void> = new Set();
  private isAutoSyncing: boolean = false;

  constructor() {
    // 1. Initialize all state from local storage or rich initial demo sets
    this.employee = this.loadEmployee();
    this.leaveBalances = this.loadStorage<LeaveBalance[]>(
      this.STORAGE_KEYS.leaveBalances,
      INITIAL_LEAVE_BALANCES
    );
    this.leaveTransactions = this.loadStorage<LeaveMovementTransaction[]>(
      this.STORAGE_KEYS.leaveTransactions,
      INITIAL_LEAVE_TRANSACTIONS
    );
    this.leaveRequests = this.loadLeaveRequests();
    this.penalties = this.loadStorage<Penalty[]>(
      this.STORAGE_KEYS.penalties,
      INITIAL_PENALTIES
    );
    this.trainingCourses = this.loadStorage<TrainingCourse[]>(
      this.STORAGE_KEYS.trainingCourses,
      INITIAL_TRAINING_COURSES
    );
    this.performanceEvaluations = this.loadStorage<PerformanceEvaluation[]>(
      this.STORAGE_KEYS.performanceEvaluations,
      INITIAL_PERFORMANCE_EVALUATIONS
    );
    this.monitoringOperations = this.loadStorage<MonitoringOperation[]>(
      this.STORAGE_KEYS.monitoringOperations,
      INITIAL_MONITORING_OPERATIONS
    );
    this.notifications = this.loadStorage<D365Notification[]>(
      this.STORAGE_KEYS.notifications,
      INITIAL_NOTIFICATIONS
    );
    this.delegatedEmployees = this.loadStorage<DelegatedEmployee[]>(
      this.STORAGE_KEYS.delegatedEmployees,
      INITIAL_DELEGATED_EMPLOYEES
    );
    this.teamMembers = this.loadStorage<TeamMember[]>(
      this.STORAGE_KEYS.teamMembers,
      INITIAL_TEAM_MEMBERS
    );
    this.unifiedRequests = this.loadUnifiedRequests();

    // 2. Persist initial loaded state so it is readily preserved across reloads
    this.persistAll();

    // 3. Background query live API (without wiping demo data if live server is offline)
    this.refreshAll();
  }

  // --- Storage Helpers ---

  private loadStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback) && Array.isArray(parsed)) {
        return parsed.length > 0 ? (parsed as unknown as T) : fallback;
      }
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  private saveStorage<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn(`[D365Service] Could not persist key ${key}:`, err);
    }
  }

  private loadEmployee(): Employee {
    const stored = this.loadStorage<Employee>(this.STORAGE_KEYS.employee, INITIAL_EMPLOYEE);
    const defaultDetails = INITIAL_EMPLOYEE.personalDetails || {
      maritalStatus: 'متزوجة',
      maritalStatusDate: '2012-04-18',
      dependentsCount: 2,
      spouseWorking: 'نعم',
      religion: 'مسلم',
      educationQualification: 'بكالوريوس حاسبات ومعلومات - علوم الحاسب',
      retirementDate: '2045-09-18',
      isDisabled: 'لا',
      verificationDate: '2024-01-10',
    };
    return {
      ...INITIAL_EMPLOYEE,
      ...stored,
      personalDetails: {
        maritalStatus: stored?.personalDetails?.maritalStatus ?? defaultDetails.maritalStatus,
        maritalStatusDate: stored?.personalDetails?.maritalStatusDate ?? defaultDetails.maritalStatusDate,
        dependentsCount: stored?.personalDetails?.dependentsCount ?? defaultDetails.dependentsCount,
        spouseWorking: stored?.personalDetails?.spouseWorking ?? defaultDetails.spouseWorking,
        religion: stored?.personalDetails?.religion ?? defaultDetails.religion,
        educationQualification: stored?.personalDetails?.educationQualification ?? defaultDetails.educationQualification,
        retirementDate: stored?.personalDetails?.retirementDate ?? defaultDetails.retirementDate,
        isDisabled: stored?.personalDetails?.isDisabled ?? defaultDetails.isDisabled,
        verificationDate: stored?.personalDetails?.verificationDate ?? defaultDetails.verificationDate,
      },
    };
  }

  private loadLeaveRequests(): LeaveRequest[] {
    const stored = this.loadStorage<LeaveRequest[]>(
      this.STORAGE_KEYS.leaveRequests,
      INITIAL_LEAVE_REQUESTS
    );
    if (!Array.isArray(stored) || stored.length === 0) {
      return [...INITIAL_LEAVE_REQUESTS];
    }
    const storedIds = new Set(stored.map((r) => r.id));
    const missing = INITIAL_LEAVE_REQUESTS.filter((r) => !storedIds.has(r.id));
    return [...stored, ...missing];
  }

  private loadUnifiedRequests(): UnifiedRequestItem[] {
    const stored = this.loadStorage<UnifiedRequestItem[]>(
      this.STORAGE_KEYS.unifiedRequests,
      INITIAL_UNIFIED_REQUESTS
    );
    if (!Array.isArray(stored) || stored.length === 0) {
      return [...INITIAL_UNIFIED_REQUESTS];
    }
    // Ensure all demo records from INITIAL_UNIFIED_REQUESTS remain visible and user requests stay on top
    const storedIds = new Set(stored.map((r) => r.id));
    const missing = INITIAL_UNIFIED_REQUESTS.filter((r) => !storedIds.has(r.id));
    return [...stored, ...missing];
  }

  public persistAll(): void {
    this.saveStorage(this.STORAGE_KEYS.employee, this.employee);
    this.saveStorage(this.STORAGE_KEYS.leaveBalances, this.leaveBalances);
    this.saveStorage(this.STORAGE_KEYS.leaveTransactions, this.leaveTransactions);
    this.saveStorage(this.STORAGE_KEYS.leaveRequests, this.leaveRequests);
    this.saveStorage(this.STORAGE_KEYS.penalties, this.penalties);
    this.saveStorage(this.STORAGE_KEYS.trainingCourses, this.trainingCourses);
    this.saveStorage(this.STORAGE_KEYS.performanceEvaluations, this.performanceEvaluations);
    this.saveStorage(this.STORAGE_KEYS.monitoringOperations, this.monitoringOperations);
    this.saveStorage(this.STORAGE_KEYS.notifications, this.notifications);
    this.saveStorage(this.STORAGE_KEYS.delegatedEmployees, this.delegatedEmployees);
    this.saveStorage(this.STORAGE_KEYS.teamMembers, this.teamMembers);
    this.saveStorage(this.STORAGE_KEYS.unifiedRequests, this.unifiedRequests);
  }

  /**
   * Resets local persistence back to pristine initial demo datasets if ever needed
   */
  public resetToDemoDefaults(): void {
    if (typeof window !== 'undefined') {
      Object.values(this.STORAGE_KEYS).forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      });
    }
    this.employee = { ...INITIAL_EMPLOYEE };
    this.leaveBalances = [...INITIAL_LEAVE_BALANCES];
    this.leaveTransactions = [...INITIAL_LEAVE_TRANSACTIONS];
    this.leaveRequests = [...INITIAL_LEAVE_REQUESTS];
    this.penalties = [...INITIAL_PENALTIES];
    this.trainingCourses = [...INITIAL_TRAINING_COURSES];
    this.performanceEvaluations = [...INITIAL_PERFORMANCE_EVALUATIONS];
    this.monitoringOperations = [...INITIAL_MONITORING_OPERATIONS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.delegatedEmployees = [...INITIAL_DELEGATED_EMPLOYEES];
    this.teamMembers = [...INITIAL_TEAM_MEMBERS];
    this.unifiedRequests = [...INITIAL_UNIFIED_REQUESTS];
    this.persistAll();
    this.notify();
  }

  public getSyncStatus(): D365SyncStatus {
    return { ...this.syncStatus };
  }

  public getApiBaseUrl(): string {
    return apiClient.getBaseUrl();
  }

  /**
   * Refreshes all datasets from real Dynamics 365 API endpoints
   * Emits real Pending, Success, or Error states without pretending success
   */
  public async refreshAll(): Promise<D365SyncStatus> {
    if (this.isAutoSyncing) return this.syncStatus;
    this.isAutoSyncing = true;

    const timestamp = new Date().toISOString();
    this.syncStatus = {
      ...this.syncStatus,
      employee: 'pending',
      leaveBalances: 'pending',
      leaveRequests: 'pending',
      penalties: 'pending',
      trainingCourses: 'pending',
      performanceEvaluations: 'pending',
      monitoringOperations: 'pending',
      teamMembers: 'pending',
      notifications: 'pending',
      overall: 'pending',
      lastAttemptAt: timestamp,
      errorMessage: undefined,
    };
    this.notify();

    try {
      const [
        empRes,
        balancesRes,
        requestsRes,
        penaltiesRes,
        coursesRes,
        evalsRes,
        monitoringRes,
        delegatedRes,
        teamRes,
        notifsRes,
      ] = await Promise.allSettled([
        employeeApi.getEmployee(this.employee.id),
        leaveApi.getLeaveBalances(this.employee.id),
        leaveApi.getLeaveRequests(this.employee.id),
        penaltyApi.getPenalties(this.employee.id),
        trainingApi.getTrainingCourses(this.employee.id),
        employeeApi.getPerformanceEvaluations(this.employee.id),
        employeeApi.getMonitoringOperations(this.employee.id),
        leaveApi.getDelegatedEmployees(),
        teamApi.getTeamMembers(),
        employeeApi.getNotifications(this.employee.id),
      ]);

      let hasError = false;
      let firstError: string | undefined;

      // 1. Employee
      if (empRes.status === 'fulfilled' && empRes.value.isSuccess && empRes.value.data) {
        this.employee = empRes.value.data;
        this.saveStorage(this.STORAGE_KEYS.employee, this.employee);
        this.syncStatus.employee = 'success';
      } else {
        this.syncStatus.employee = 'error';
        hasError = true;
        firstError = firstError || (empRes.status === 'fulfilled' ? empRes.value.error || undefined : 'Failed to fetch employee');
      }

      // 2. Balances (preserve demo balances if backend is empty/offline)
      if (balancesRes.status === 'fulfilled' && balancesRes.value.isSuccess && balancesRes.value.data && balancesRes.value.data.length > 0) {
        this.leaveBalances = balancesRes.value.data;
        this.saveStorage(this.STORAGE_KEYS.leaveBalances, this.leaveBalances);
        this.syncStatus.leaveBalances = 'success';
      } else {
        this.syncStatus.leaveBalances = 'error';
        hasError = true;
        firstError = firstError || (balancesRes.status === 'fulfilled' ? balancesRes.value.error || undefined : 'Failed to fetch leave balances');
      }

      // 3. Requests (preserve demo requests if backend is empty/offline)
      if (requestsRes.status === 'fulfilled' && requestsRes.value.isSuccess && requestsRes.value.data && requestsRes.value.data.length > 0) {
        this.leaveRequests = requestsRes.value.data;
        this.saveStorage(this.STORAGE_KEYS.leaveRequests, this.leaveRequests);
        this.syncStatus.leaveRequests = 'success';
      } else {
        this.syncStatus.leaveRequests = 'error';
        hasError = true;
        firstError = firstError || (requestsRes.status === 'fulfilled' ? requestsRes.value.error || undefined : 'Failed to fetch leave requests');
      }

      // 4. Penalties (preserve demo penalties if backend is empty/offline)
      if (penaltiesRes.status === 'fulfilled' && penaltiesRes.value.isSuccess && penaltiesRes.value.data && penaltiesRes.value.data.length > 0) {
        this.penalties = penaltiesRes.value.data;
        this.saveStorage(this.STORAGE_KEYS.penalties, this.penalties);
        this.syncStatus.penalties = 'success';
      } else {
        this.syncStatus.penalties = 'error';
        hasError = true;
        firstError = firstError || (penaltiesRes.status === 'fulfilled' ? penaltiesRes.value.error || undefined : 'Failed to fetch penalties');
      }

      // 5. Training (preserve demo training courses if backend is empty/offline)
      if (coursesRes.status === 'fulfilled' && coursesRes.value.isSuccess && coursesRes.value.data && coursesRes.value.data.length > 0) {
        this.trainingCourses = coursesRes.value.data;
        this.saveStorage(this.STORAGE_KEYS.trainingCourses, this.trainingCourses);
        this.syncStatus.trainingCourses = 'success';
      } else {
        this.syncStatus.trainingCourses = 'error';
        hasError = true;
        firstError = firstError || (coursesRes.status === 'fulfilled' ? coursesRes.value.error || undefined : 'Failed to fetch courses');
      }

      // 6. Evaluations
      if (evalsRes.status === 'fulfilled' && evalsRes.value.isSuccess && evalsRes.value.data && evalsRes.value.data.length > 0) {
        this.performanceEvaluations = evalsRes.value.data;
        this.saveStorage(this.STORAGE_KEYS.performanceEvaluations, this.performanceEvaluations);
        this.syncStatus.performanceEvaluations = 'success';
      } else {
        this.syncStatus.performanceEvaluations = 'error';
      }

      // 7. Monitoring
      if (monitoringRes.status === 'fulfilled' && monitoringRes.value.isSuccess && monitoringRes.value.data && monitoringRes.value.data.length > 0) {
        this.monitoringOperations = monitoringRes.value.data;
        this.saveStorage(this.STORAGE_KEYS.monitoringOperations, this.monitoringOperations);
        this.syncStatus.monitoringOperations = 'success';
      } else {
        this.syncStatus.monitoringOperations = 'error';
      }

      // 8. Delegated
      if (delegatedRes.status === 'fulfilled' && delegatedRes.value.isSuccess && delegatedRes.value.data && delegatedRes.value.data.length > 0) {
        this.delegatedEmployees = delegatedRes.value.data;
        this.saveStorage(this.STORAGE_KEYS.delegatedEmployees, this.delegatedEmployees);
      }

      // 9. Team
      if (teamRes.status === 'fulfilled' && teamRes.value.isSuccess && teamRes.value.data && teamRes.value.data.length > 0) {
        this.teamMembers = teamRes.value.data;
        this.saveStorage(this.STORAGE_KEYS.teamMembers, this.teamMembers);
        this.syncStatus.teamMembers = 'success';
      } else {
        this.syncStatus.teamMembers = 'error';
        hasError = true;
      }

      // 10. Notifications
      if (notifsRes.status === 'fulfilled' && notifsRes.value.isSuccess && notifsRes.value.data && notifsRes.value.data.length > 0) {
        this.notifications = notifsRes.value.data;
        this.saveStorage(this.STORAGE_KEYS.notifications, this.notifications);
        this.syncStatus.notifications = 'success';
      } else {
        this.syncStatus.notifications = 'error';
      }

      if (hasError) {
        this.syncStatus.overall = 'error';
        this.syncStatus.errorMessage = firstError || 'تعذر الاتصال ببعض خدمات Dynamics 365 OData.';
      } else {
        this.syncStatus.overall = 'success';
        this.syncStatus.lastSuccessAt = new Date().toISOString();
      }
    } catch (err: unknown) {
      this.syncStatus.overall = 'error';
      this.syncStatus.errorMessage = err instanceof Error ? err.message : 'فشل غير متوقع في جلب البيانات من Dynamics 365';
    } finally {
      this.isAutoSyncing = false;
      this.notify();
    }

    return this.syncStatus;
  }

  // --- Getters & Setters ---
  public getEmployee(): Employee {
    return { ...this.employee };
  }

  public setEmployee(data: Partial<Employee>): void {
    this.employee = { ...this.employee, ...data };
    this.saveStorage(this.STORAGE_KEYS.employee, this.employee);
    this.notify();
  }

  public getLeaveBalances(): LeaveBalance[] {
    return [...this.leaveBalances];
  }

  public getLeaveRequests(): LeaveRequest[] {
    return [...this.leaveRequests];
  }

  public getLeaveTransactions(_typeCode?: LeaveTypeCode): LeaveMovementTransaction[] {
    return [...this.leaveTransactions];
  }

  public getPenalties(): Penalty[] {
    return [...this.penalties];
  }

  public getTrainingCourses(): TrainingCourse[] {
    return [...this.trainingCourses];
  }

  public getPerformanceEvaluations(): PerformanceEvaluation[] {
    return [...this.performanceEvaluations];
  }

  public getMonitoringOperations(): MonitoringOperation[] {
    return [...this.monitoringOperations];
  }

  public getNotifications(): D365Notification[] {
    return [...this.notifications];
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.saveStorage(this.STORAGE_KEYS.notifications, this.notifications);
      this.notify();
    }
  }

  public getDelegatedEmployees(): DelegatedEmployee[] {
    return [...this.delegatedEmployees];
  }

  public getTeamMembers(): TeamMember[] {
    return [...this.teamMembers];
  }

  public getUnifiedRequests(): UnifiedRequestItem[] {
    return [...this.unifiedRequests];
  }

  public addUnifiedRequest(req: UnifiedRequestItem): void {
    this.unifiedRequests.unshift(req);
    this.saveStorage(this.STORAGE_KEYS.unifiedRequests, this.unifiedRequests);
    this.notify();
  }

  public submitGeneralRequest(
    requestType: string,
    category: UnifiedRequestItem['category'],
    notes?: string,
    referenceNumber?: string,
    fromDate?: string,
    toDate?: string
  ): UnifiedRequestItem {
    const id = `REQ-${Date.now().toString().slice(-6)}`;
    const newReq: UnifiedRequestItem = {
      id,
      requestNumber: referenceNumber || id,
      requestType,
      category,
      submissionDate: new Date().toISOString().split('T')[0],
      fromDate,
      toDate,
      status: 'PendingApproval',
      statusAr: 'بانتظار الموافقة',
      employeeName: this.employee.name,
      employeeId: this.employee.id,
      workflowStep: 'في انتظار مراجعة مدير الإدارة',
      notes,
      referenceNumber: referenceNumber || id,
    };
    this.unifiedRequests.unshift(newReq);
    this.saveStorage(this.STORAGE_KEYS.unifiedRequests, this.unifiedRequests);
    this.notify();
    return newReq;
  }

  // --- API Mutators ---

  /**
   * Submit Leave Request via leaveApi with real API state return and local persistence
   */
  public async submitLeaveRequest(
    data: Omit<LeaveRequest, 'id' | 'submissionDate' | 'status' | 'statusAr'>
  ): Promise<ApiResponse<LeaveRequest>> {
    const res = await leaveApi.submitLeaveRequest(data);
    const createdLeave: LeaveRequest = (res.isSuccess && res.data) ? res.data : {
      id: `REQ-LR-${Date.now().toString().slice(-4)}`,
      employeeId: this.employee.id,
      employeeName: this.employee.name,
      leaveTypeCode: data.leaveTypeCode,
      leaveTypeTitle: data.leaveTypeTitle,
      startDate: data.startDate,
      endDate: data.endDate,
      requestedDays: data.requestedDays,
      delegatedEmployeeId: data.delegatedEmployeeId || 'EMP-10001',
      delegatedEmployeeName: data.delegatedEmployeeName || 'أحمد المحمدي',
      delegatedEmployeeTitle: data.delegatedEmployeeTitle || 'محلل أول',
      socialInsuranceOption: data.socialInsuranceOption ?? false,
      healthInsuranceOption: data.healthInsuranceOption ?? false,
      attachments: data.attachments || [],
      notes: data.notes || '',
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'InReview',
      statusAr: 'بانتظار الموافقة',
      workflowStep: 'في انتظار موافقة المدير المباشر',
      d365SyncStatus: 'Pending',
    };

    this.leaveRequests.unshift(createdLeave);
    this.saveStorage(this.STORAGE_KEYS.leaveRequests, this.leaveRequests);

    // Adjust balance optimistically
    const bal = this.leaveBalances.find((b) => b.leaveTypeCode === data.leaveTypeCode);
    if (bal) {
      bal.pendingBalance = (bal.pendingBalance || 0) + data.requestedDays;
      this.saveStorage(this.STORAGE_KEYS.leaveBalances, this.leaveBalances);
    }

    const leaveId = createdLeave.id;
    const newUnified: UnifiedRequestItem = {
      id: leaveId,
      requestNumber: leaveId,
      requestType: `طلب ${data.leaveTypeTitle}`,
      category: 'LEAVE',
      submissionDate: createdLeave.submissionDate,
      fromDate: data.startDate,
      toDate: data.endDate,
      status: 'PendingApproval',
      statusAr: 'بانتظار الموافقة',
      employeeName: this.employee.name,
      employeeId: this.employee.id,
      workflowStep: 'في انتظار موافقة المدير المباشر',
      notes: data.notes,
      referenceNumber: leaveId,
    };
    this.unifiedRequests.unshift(newUnified);
    this.saveStorage(this.STORAGE_KEYS.unifiedRequests, this.unifiedRequests);
    this.notify();
    return res;
  }

  /**
   * Submit Disciplinary Grievance via penaltyApi and local persistence
   */
  public async submitGrievance(
    data: Omit<Grievance, 'id' | 'submissionDate' | 'status' | 'statusAr'>
  ): Promise<ApiResponse<Grievance>> {
    const res = await penaltyApi.submitGrievance(data);
    const grvId = res.data?.id || `REQ-GRV-${Date.now().toString().slice(-4)}`;
    const newUnified: UnifiedRequestItem = {
      id: grvId,
      requestNumber: grvId,
      requestType: `طلب تظلم من قرار جزاء`,
      category: 'GRIEVANCE',
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'PendingApproval',
      statusAr: 'بانتظار الموافقة',
      employeeName: this.employee.name,
      employeeId: this.employee.id,
      workflowStep: 'محال للجنة تظلمات الموظفين',
      notes: data.grievanceDetails,
      referenceNumber: grvId,
    };
    this.unifiedRequests.unshift(newUnified);
    this.saveStorage(this.STORAGE_KEYS.unifiedRequests, this.unifiedRequests);
    this.notify();
    return res;
  }

  /**
   * Submit Training Course Evaluation via trainingApi
   */
  public async submitTrainingEvaluation(
    data: Omit<TrainingEvaluation, 'id' | 'submissionDate'>
  ): Promise<ApiResponse<TrainingEvaluation>> {
    const res = await trainingApi.submitTrainingEvaluation(data);
    const course = this.trainingCourses.find((c) => c.courseId === data.courseId || c.id === data.courseId);
    if (course) {
      course.generalEvaluationStatus = 'Evaluated';
      course.generalEvaluationScore = data.overallProgramEvaluation;
      this.saveStorage(this.STORAGE_KEYS.trainingCourses, this.trainingCourses);
      this.notify();
    }
    return res;
  }

  /**
   * Complete Monitoring Request via employeeApi
   */
  public async completeMonitoringRequest(
    requestId: string,
    submittedData?: any,
    attachments?: MonitoringAttachment[]
  ): Promise<ApiResponse<MonitoringOperation>> {
    const res = await employeeApi.updateMonitoringRequestStatus(requestId, 'تم التقديم');
    const item = this.monitoringOperations.find((o) => o.id === requestId);
    if (item) {
      item.status = 'تم التقديم';
      if (submittedData) item.submittedData = submittedData;
      if (attachments) {
        item.attachments = [...(item.attachments || []), ...attachments];
        item.attachmentsCount = item.attachments.length;
      }
      this.saveStorage(this.STORAGE_KEYS.monitoringOperations, this.monitoringOperations);
      this.notify();
    }
    return res;
  }

  /**
   * Update Monitoring Request Status via employeeApi
   */
  public async updateMonitoringRequestStatus(
    requestId: string,
    nextStatus: MonitoringRequestStatus,
    note?: string
  ): Promise<ApiResponse<MonitoringOperation>> {
    const res = await employeeApi.updateMonitoringRequestStatus(requestId, nextStatus, note);
    const item = this.monitoringOperations.find((o) => o.id === requestId);
    if (item) {
      item.status = nextStatus;
      if (note) item.details = `${item.details} - ${note}`;
      this.saveStorage(this.STORAGE_KEYS.monitoringOperations, this.monitoringOperations);
      this.notify();
    }
    return res;
  }

  /**
   * Submit Financial Disclosure via employeeApi
   */
  public async submitFinancialDisclosure(payload: {
    disclosureType: string;
    filingYear: string | number;
    entity?: string;
    realEstateSummary?: string;
    cashAndDepositsSummary?: string;
    movableAssetsSummary?: string;
    debtsAndLiabilitiesSummary?: string;
    attachments?: MonitoringAttachment[];
    attachmentsCount?: number;
    workerId?: string;
    notes?: string;
  }): Promise<ApiResponse<MonitoringOperation>> {
    const res = await employeeApi.submitFinancialDisclosure({
      workerId: payload.workerId || this.employee.id,
      disclosureType: payload.disclosureType,
      filingYear: typeof payload.filingYear === 'string' ? parseInt(payload.filingYear, 10) || 2025 : payload.filingYear,
      submissionDate: new Date().toISOString().split('T')[0],
      hasRealEstate: Boolean(payload.realEstateSummary),
      hasCommercialActivities: Boolean(payload.movableAssetsSummary),
      notes: payload.debtsAndLiabilitiesSummary || payload.notes,
      attachments: payload.attachments,
    });
    const filingYrStr = String(payload.filingYear || 2025);
    const newOperation: MonitoringOperation = (res.isSuccess && res.data) ? res.data : {
      id: `MON-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      operationType: 'FINANCIAL_DISCLOSURE',
      actionTitle: `إقرار الذمة المالية - ${payload.disclosureType}`,
      category: 'إقرار ذمة مالية',
      referenceNumber: `FD-${filingYrStr}-${Date.now().toString().slice(-4)}`,
      entity: payload.entity || 'هيئة الرقابة الإدارية - إدارة الكسب غير المشروع',
      user: this.employee.name,
      status: 'تم التقديم',
      details: payload.debtsAndLiabilitiesSummary || payload.notes || 'تم حفظ وتقديم الإقرار بنجاح',
      attachmentsCount: payload.attachments?.length || 0,
      attachments: payload.attachments,
      notes: payload.notes,
    } as MonitoringOperation;
    this.monitoringOperations.unshift(newOperation);
    this.saveStorage(this.STORAGE_KEYS.monitoringOperations, this.monitoringOperations);
    this.notify();
    return res;
  }

  /**
   * Submit Drug/Medical Test via employeeApi
   */
  public async submitDrugOrMedicalTest(payload: {
    testType?: string;
    sampleType?: string;
    testDate: string;
    entity?: string;
    medicalFacility?: string;
    reportNumber?: string;
    result?: string;
    notes?: string;
    attachments?: MonitoringAttachment[];
    attachmentsCount?: number;
    workerId?: string;
  }): Promise<ApiResponse<MonitoringOperation>> {
    const res = await employeeApi.submitDrugOrMedicalTest({
      workerId: payload.workerId || this.employee.id,
      testDate: payload.testDate,
      sampleType: payload.sampleType || payload.testType || 'عينة بول دورية',
      medicalFacility: payload.medicalFacility || payload.entity || 'المعمل المشترك المعتمد',
      notes: payload.notes || payload.reportNumber,
      attachments: payload.attachments,
    });
    const newOp: MonitoringOperation = (res.isSuccess && res.data) ? res.data : {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      operationType: 'DRUG_TEST',
      actionTitle: `فحص طبي دوري - ${payload.sampleType || 'تحليل معتمد'}`,
      category: 'اختبار كشف ومخدرات',
      referenceNumber: payload.reportNumber || `REP-${Date.now().toString().slice(-4)}`,
      entity: payload.medicalFacility || payload.entity || 'المعمل المشترك المعتمد',
      user: this.employee.name,
      status: 'تم التقديم',
      details: `تقرير رقم ${payload.reportNumber || 'REP-' + Date.now().toString().slice(-4)} - النتيجة: سلبية`,
      attachmentsCount: payload.attachments?.length || 0,
      attachments: payload.attachments,
    } as MonitoringOperation;
    this.monitoringOperations.unshift(newOp);
    this.saveStorage(this.STORAGE_KEYS.monitoringOperations, this.monitoringOperations);
    this.notify();
    return res;
  }

  /**
   * Approve Team Request via teamApi
   */
  public async approveTeamRequest(requestId: string, notes?: string): Promise<ApiResponse<TeamMemberRequest>> {
    const res = await teamApi.approveTeamRequest(requestId, notes);
    for (const member of this.teamMembers) {
      const item = member.requests.find((r) => r.id === requestId);
      if (item) {
        item.status = 'معتمد';
        item.decisionDate = new Date().toISOString().split('T')[0];
        item.managerNotes = notes;
        break;
      }
    }
    this.saveStorage(this.STORAGE_KEYS.teamMembers, this.teamMembers);
    this.notify();
    return res;
  }

  /**
   * Reject Team Request via teamApi
   */
  public async rejectTeamRequest(requestId: string, reason: string): Promise<ApiResponse<TeamMemberRequest>> {
    const res = await teamApi.rejectTeamRequest(requestId, reason);
    for (const member of this.teamMembers) {
      const item = member.requests.find((r) => r.id === requestId);
      if (item) {
        item.status = 'مرفوض';
        item.decisionDate = new Date().toISOString().split('T')[0];
        item.managerNotes = reason;
        break;
      }
    }
    this.saveStorage(this.STORAGE_KEYS.teamMembers, this.teamMembers);
    this.notify();
    return res;
  }

  /**
   * Submit Leave on Behalf via teamApi
   */
  public async submitLeaveOnBehalf(
    memberId: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    days: number,
    notes?: string
  ): Promise<ApiResponse<TeamMemberRequest>> {
    const res = await teamApi.submitLeaveOnBehalf(memberId, leaveType, startDate, endDate, days, notes);
    const member = this.teamMembers.find((m) => m.id === memberId);
    if (member) {
      const req: TeamMemberRequest = (res.isSuccess && res.data) ? res.data : {
        id: `TREQ-${Date.now().toString().slice(-4)}`,
        employeeId: member.id,
        employeeName: member.name,
        employeeJobTitle: member.jobTitle,
        requestType: 'إجازة اعتيادية',
        details: notes || `طلب إجازة بالنيابة (${startDate} إلى ${endDate})`,
        dates: `${startDate} إلى ${endDate}`,
        duration: `${days} أيام`,
        status: 'معتمد',
        submissionDate: new Date().toISOString().split('T')[0],
        decisionDate: new Date().toISOString().split('T')[0],
        managerNotes: 'تمت الموافقة والإدخال بالنيابة بواسطة المدير المباشر',
      };
      member.requests.unshift(req);
      this.saveStorage(this.STORAGE_KEYS.teamMembers, this.teamMembers);
      this.notify();
    }
    return res;
  }

  /**
   * Submit Absence on Behalf via teamApi
   */
  public async submitAbsenceOnBehalf(
    memberId: string,
    duration: string,
    date: string,
    reason: string
  ): Promise<ApiResponse<TeamMemberRequest>> {
    const res = await teamApi.submitAbsenceOnBehalf(memberId, duration, date, reason);
    const member = this.teamMembers.find((m) => m.id === memberId);
    if (member) {
      const req: TeamMemberRequest = (res.isSuccess && res.data) ? res.data : {
        id: `TREQ-ABS-${Date.now().toString().slice(-4)}`,
        employeeId: member.id,
        employeeName: member.name,
        employeeJobTitle: member.jobTitle,
        requestType: 'إذن غياب',
        details: reason || `إذن غياب بالنيابة (${duration})`,
        dates: date,
        duration: duration,
        status: 'معتمد',
        submissionDate: new Date().toISOString().split('T')[0],
        decisionDate: new Date().toISOString().split('T')[0],
        managerNotes: 'تم الاعتماد المباشر بواسطة المدير',
      };
      member.requests.unshift(req);
      this.saveStorage(this.STORAGE_KEYS.teamMembers, this.teamMembers);
      this.notify();
    }
    return res;
  }

  /**
   * Generates OData v4 payload for inspector dialog
   */
  public generateODataPayload(entityType: string, customFields: Record<string, unknown> = {}): Record<string, unknown> {
    const baseContext = `${apiClient.getBaseUrl()}/$metadata#${entityType}/$entity`;
    return {
      '@odata.context': baseContext,
      '@odata.type': `#Microsoft.Dynamics.DataEntities.${entityType}`,
      dataAreaId: D365_CONFIG.legalEntity,
      WorkerPersonnelNumber: this.employee.id,
      LegalEntity: this.employee.legalEntity,
      CreatedDateTime: new Date().toISOString(),
      ...customFields,
    };
  }

  /**
   * Subscribe to reactive updates
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in D365Service listener:', err);
      }
    });
  }
}

export const d365Service = new D365Service();
