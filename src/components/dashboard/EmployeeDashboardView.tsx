import React, { useState } from 'react';
import {
  Calendar,
  Award,
  AlertTriangle,
  Clock,
  Plus,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Activity,
  Layers,
  FileCheck,
  Send,
  UserCheck,
  Building,
  RefreshCw,
  FileSpreadsheet,
  Users,
  Eye,
  XCircle,
  User
} from 'lucide-react';
import { D365ActionBar } from '../common/D365ActionBar';
import { D365Dialog } from '../common/D365Dialog';
import { PersonalDetailsDialog } from './PersonalDetailsDialog';
import { UnifiedRequestItem } from '../../types/d365.types';
import { d365Service } from '../../services/d365Service';
import {
  Employee,
  LeaveBalance,
  LeaveRequest,
  Penalty,
  TrainingCourse,
  PerformanceEvaluation,
  MonitoringOperation
} from '../../types/d365.types';
import { QuickActionType } from '../requests/QuickActionDialog';

interface EmployeeDashboardViewProps {
  employee: Employee;
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  penalties: Penalty[];
  trainingCourses: TrainingCourse[];
  performanceEvaluations: PerformanceEvaluation[];
  monitoringOperations: MonitoringOperation[];
  unifiedRequests?: UnifiedRequestItem[];
  onOpenNewLeave: () => void;
  onOpenLeaveBalanceDialog: () => void;
  onOpenPenaltiesDialog: () => void;
  onOpenTrainingDialog: () => void;
  onOpenPerformanceDialog: () => void;
  onOpenMonitoringDialog: (initialMode?: 'records' | 'disclosure' | 'test') => void;
  onQuickAction: (actionType: QuickActionType) => void;
  onRefresh: () => void;
  onExportExcel: () => void;
  onNavigateToTeam?: () => void;
}

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({
  employee,
  leaveBalances,
  leaveRequests,
  penalties,
  trainingCourses,
  performanceEvaluations,
  monitoringOperations,
  unifiedRequests,
  onOpenNewLeave,
  onOpenLeaveBalanceDialog,
  onOpenPenaltiesDialog,
  onOpenTrainingDialog,
  onOpenPerformanceDialog,
  onOpenMonitoringDialog,
  onQuickAction,
  onRefresh,
  onExportExcel,
  onNavigateToTeam,
}) => {
  const [selectedUnifiedRequest, setSelectedUnifiedRequest] = useState<UnifiedRequestItem | null>(null);
  const [isPersonalDetailsOpen, setIsPersonalDetailsOpen] = useState(false);

  const allRecentRequests = unifiedRequests && unifiedRequests.length > 0
    ? unifiedRequests
    : d365Service.getUnifiedRequests();

  // Active annual leave balance
  const annualBalance = leaveBalances.find((b) => b.leaveTypeCode === 'ANNUAL')?.currentBalance ?? 0;
  const penaltiesCount = penalties.length;

  return (
    <div className="space-y-4">
      {/* Dynamics Action Bar */}
      <D365ActionBar
        onNew={onOpenNewLeave}
        newButtonLabel="تقديم طلب إجازة"
        onRefresh={onRefresh}
      />

      {/* 1. Employee Information Card (Matching Screenshot 7) */}
      <div className="bg-white border border-[#D1D1D1] p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-[#EDEBE9]">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-[#002050] text-[#69AFE5] border border-[#0078D4] flex items-center justify-center font-bold text-2xl font-sans overflow-hidden shrink-0">
              {employee.avatarUrl ? (
                <img
                  src={employee.avatarUrl}
                  alt={employee.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                employee.name.slice(0, 1)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#323130]">{employee.name}</h1>
              </div>
              <div className="mt-0.5 mb-1">
                <button
                  type="button"
                  onClick={() => setIsPersonalDetailsOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-[#0078D4] hover:text-[#106EBE] hover:underline font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0078D4]"
                  title="عرض البيانات الشخصية"
                >
                  <User className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>البيانات الشخصية</span>
                </button>
              </div>
              <div className="text-xs text-[#605E5C] mt-0.5">
                المستوى الوظيفي: {employee.jobGrade} | الوظيفة: {employee.jobTitle}
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs text-[#605E5C]">
            <div className="px-2.5 py-1 bg-[#F5F5F5] border border-[#D1D1D1]">
              <span>المدير المباشر: </span>
              <strong className="text-[#323130]">{employee.directManager}</strong>
            </div>
            <div className="px-2.5 py-1 bg-[#F5F5F5] border border-[#D1D1D1]">
              <span>سنوات الخدمة: </span>
              <strong className="text-[#323130] font-mono">{employee.yearsOfService || '—'}</strong>
            </div>
            <div className="px-2.5 py-1 bg-[#F5F5F5] border border-[#D1D1D1]">
              <span>حالة الموظف: </span>
              <strong className="text-[#107C41]">{employee.employmentStatusAr || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Distinct Employee Info Grid (Matching Screenshot 7) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 text-xs">
          <div className="p-2 bg-[#F9F9F9] border border-[#EDEBE9]">
            <span className="text-[11px] text-[#605E5C] block">المستوى الوظيفي:</span>
            <strong className="text-[#323130] block mt-0.5">{employee.jobGrade}</strong>
          </div>

          <div className="p-2 bg-[#F9F9F9] border border-[#EDEBE9]">
            <span className="text-[11px] text-[#605E5C] block">الوظيفة:</span>
            <strong className="text-[#323130] block mt-0.5">{employee.jobTitle}</strong>
          </div>

          <div className="p-2 bg-[#F9F9F9] border border-[#EDEBE9]">
            <span className="text-[11px] text-[#605E5C] block">حالة الموظف:</span>
            <strong className="text-[#107C41] block mt-0.5">{employee.employmentStatusAr || '—'}</strong>
          </div>

          <div className="p-2 bg-[#F9F9F9] border border-[#EDEBE9]">
            <span className="text-[11px] text-[#605E5C] block">سنوات الخدمة:</span>
            <strong className="text-[#323130] font-mono block mt-0.5">{employee.yearsOfService || '—'}</strong>
          </div>

          <div className="p-2 bg-[#F9F9F9] border border-[#EDEBE9]">
            <span className="text-[11px] text-[#605E5C] block">المدير المباشر:</span>
            <strong className="text-[#323130] block mt-0.5 truncate" title={employee.directManager}>{employee.directManager}</strong>
          </div>

          <div className="p-2 bg-[#F9F9F9] border border-[#EDEBE9]">
            <span className="text-[11px] text-[#605E5C] block">الإدارة:</span>
            <strong className="text-[#323130] block mt-0.5">{employee.department}</strong>
          </div>

          <div className="p-2 bg-[#F9F9F9] border border-[#EDEBE9]">
            <span className="text-[11px] text-[#605E5C] block">المجموعة الوظيفية:</span>
            <strong className="text-[#323130] block mt-0.5">{employee.department}</strong>
          </div>

          <div className="p-2 bg-[#F9F9F9] border border-[#EDEBE9]">
            <span className="text-[11px] text-[#605E5C] block">المسمى الوظيفي:</span>
            <strong className="text-[#323130] block mt-0.5">{employee.jobTitle || '—'}</strong>
          </div>

          <div className="p-2 bg-[#F9F9F9] border border-[#EDEBE9]">
            <span className="text-[11px] text-[#605E5C] block">المجموعة النوعية:</span>
            <strong className="text-[#323130] block mt-0.5">{employee.jobGroup || '—'}</strong>
          </div>

          <div className="p-2 bg-[#F9F9F9] border border-[#EDEBE9]">
            <span className="text-[11px] text-[#605E5C] block">الرقم القومي:</span>
            <span className="font-mono text-[#0078D4] block mt-0.5">{employee.civilId || '—'}</span>
          </div>
        </div>
      </div>

      {/* 2. 5 KPI Cards in One Line (Matching Screenshot 7) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: رصيد الإجازات */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`رصيد الإجازات: ${annualBalance} يوم متاح`}
          onClick={onOpenLeaveBalanceDialog}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenLeaveBalanceDialog();
            }
          }}
          className="bg-white border border-[#D1D1D1] hover:border-[#0078D4] p-3 cursor-pointer transition-all hover:shadow-sm group text-right focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
        >
          <div className="flex items-center justify-between text-xs text-[#605E5C] mb-2">
            <span className="font-bold text-[#323130]">رصيد الإجازات</span>
            <Calendar className="w-4 h-4 text-[#0078D4]" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0078D4] group-hover:scale-105 transition-transform">
            {annualBalance}
          </div>
          <div className="text-[11px] text-[#605E5C] mt-1 flex items-center justify-between">
            <span>يوم متاح</span>
            <span className="text-[#0078D4] text-[10px] group-hover:underline">عرض الأرصدة &larr;</span>
          </div>
        </div>

        {/* Card 2: الجزاءات */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`الجزاءات: ${penaltiesCount} قرار مسجل`}
          onClick={onOpenPenaltiesDialog}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenPenaltiesDialog();
            }
          }}
          className="bg-white border border-[#D1D1D1] hover:border-[#0078D4] p-3 cursor-pointer transition-all hover:shadow-sm group text-right focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
        >
          <div className="flex items-center justify-between text-xs text-[#605E5C] mb-2">
            <span className="font-bold text-[#323130]">الجزاءات</span>
            <AlertTriangle className="w-4 h-4 text-[#D83B01]" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#D83B01] group-hover:scale-105 transition-transform">
            {penaltiesCount}
          </div>
          <div className="text-[11px] text-[#605E5C] mt-1 flex items-center justify-between">
            <span>قرار مسجل</span>
            <span className="text-[#0078D4] text-[10px] group-hover:underline">عرض الجزاءات &larr;</span>
          </div>
        </div>

        {/* Card 3: الدورات التدريبية */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`الدورات التدريبية: ${trainingCourses.length} دورات مسجلة`}
          onClick={onOpenTrainingDialog}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenTrainingDialog();
            }
          }}
          className="bg-white border border-[#D1D1D1] hover:border-[#0078D4] p-3 cursor-pointer transition-all hover:shadow-sm group text-right focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
        >
          <div className="flex items-center justify-between text-xs text-[#605E5C] mb-2">
            <span className="font-bold text-[#323130]">الدورات التدريبية</span>
            <Award className="w-4 h-4 text-[#0078D4]" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0078D4] group-hover:scale-105 transition-transform">
            {trainingCourses.length}
          </div>
          <div className="text-[11px] text-[#605E5C] mt-1 flex items-center justify-between">
            <span>دورات مسجلة</span>
            <span className="text-[#0078D4] text-[10px] group-hover:underline">استعراض الدورات &larr;</span>
          </div>
        </div>

        {/* Card 4: تقييمات الأداء */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`تقييمات الأداء: ${performanceEvaluations.length} تقارير معتمدة`}
          onClick={onOpenPerformanceDialog}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenPerformanceDialog();
            }
          }}
          className="bg-white border border-[#D1D1D1] hover:border-[#0078D4] p-3 cursor-pointer transition-all hover:shadow-sm group text-right focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
        >
          <div className="flex items-center justify-between text-xs text-[#605E5C] mb-2">
            <span className="font-bold text-[#323130]">تقييمات الأداء</span>
            <ShieldCheck className="w-4 h-4 text-[#107C41]" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#107C41] group-hover:scale-105 transition-transform">
            {performanceEvaluations.length}
          </div>
          <div className="text-[11px] text-[#605E5C] mt-1 flex items-center justify-between">
            <span>تقارير معتمدة</span>
            <span className="text-[#0078D4] text-[10px] group-hover:underline">عرض التقييمات &larr;</span>
          </div>
        </div>

        {/* Card 5: عمليات المراقبة */}
        <div
          role="button"
          tabIndex={0}
          aria-label="عمليات المراقبة والإقرارات"
          onClick={() => onOpenMonitoringDialog('records')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenMonitoringDialog('records');
            }
          }}
          className="bg-white border border-[#D1D1D1] hover:border-[#0078D4] p-3 cursor-pointer transition-all hover:shadow-sm group text-right focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
        >
          <div className="flex items-center justify-between text-xs text-[#605E5C] mb-2">
            <span className="font-bold text-[#323130]">عمليات المراقبة</span>
            <Activity className="w-4 h-4 text-[#0078D4]" aria-hidden="true" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-[#0078D4] group-hover:scale-105 transition-transform">
              {monitoringOperations.length}
            </div>
            {monitoringOperations.filter((o) => o.status === 'استكمل المطلوب').length > 0 && (
              <span className="bg-[#FFF4CE] text-[#D83B01] border border-[#FFB900] text-[10px] px-1.5 py-0.5 font-bold">
                {monitoringOperations.filter((o) => o.status === 'استكمل المطلوب').length} مطلوب استكماله
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#605E5C] mt-1 flex items-center justify-between">
            <span>إقرارات واختبارات</span>
            <span className="text-[#0078D4] text-[10px] group-hover:underline">تقديم واستكمال &larr;</span>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Row (Matching Screenshot 7) */}
      <div className="bg-white border border-[#D1D1D1] p-3">
        <div className="text-xs font-bold text-[#323130] mb-2.5 flex items-center gap-2">
          <div className="w-1.5 h-3.5 bg-[#0078D4]"></div>
          <span>الإجراءات السريعة:</span>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            onClick={onOpenNewLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0078D4] text-white hover:bg-[#106EBE] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>تقديم طلب إجازة</span>
          </button>

          <button
            onClick={() => onQuickAction('PERMISSION')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F3F2F1] text-[#323130] border border-[#8A8886] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <Clock className="w-3.5 h-3.5 text-[#0078D4]" aria-hidden="true" />
            <span>تقديم طلب إذن</span>
          </button>

          <button
            onClick={() => onQuickAction('SECONDMENT')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F3F2F1] text-[#323130] border border-[#8A8886] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <Layers className="w-3.5 h-3.5 text-[#0078D4]" aria-hidden="true" />
            <span>تقديم طلب ندب</span>
          </button>

          <button
            onClick={() => onQuickAction('LOAN')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F3F2F1] text-[#323130] border border-[#8A8886] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <Building className="w-3.5 h-3.5 text-[#0078D4]" aria-hidden="true" />
            <span>تقديم طلب إعارة</span>
          </button>

          <button
            onClick={() => onQuickAction('TRANSFER')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F3F2F1] text-[#323130] border border-[#8A8886] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#0078D4]" aria-hidden="true" />
            <span>تقديم طلب نقل</span>
          </button>

          <button
            onClick={() => onOpenMonitoringDialog('records')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F3F2F1] text-[#323130] border border-[#8A8886] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
            title="طلبات إقرارات الذمة المالية ضمن عمليات المراقبة"
          >
            <FileCheck className="w-3.5 h-3.5 text-[#0078D4]" aria-hidden="true" />
            <span>إقرارات الذمة المالية</span>
          </button>

          <button
            onClick={() => onOpenMonitoringDialog('records')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F3F2F1] text-[#323130] border border-[#8A8886] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
            title="طلبات اختبارات الكشف والمخدرات ضمن عمليات المراقبة"
          >
            <Activity className="w-3.5 h-3.5 text-[#107C41]" aria-hidden="true" />
            <span>اختبار المخدرات</span>
          </button>

          {onNavigateToTeam && (
            <button
              onClick={onNavigateToTeam}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FC] hover:bg-[#DEECF9] text-[#0078D4] border border-[#0078D4] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
              title="الانتقال إلى شاشة فريقي لمتابعة المرؤوسين"
            >
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>معلومات فريقي (18)</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Recent Requests Table (Unified Recent Requests Data Source) */}
      <div className="bg-white border border-[#D1D1D1]">
        <div className="p-3 border-b border-[#EDEBE9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 bg-[#0078D4]"></div>
            <h2 className="text-xs font-bold text-[#323130]">الطلبات المقدمة مؤخراً</h2>
          </div>
          <span className="text-[11px] text-[#605E5C] font-mono">
            {allRecentRequests.length} طلبات مسجلة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1] text-[#323130] font-semibold">
                <th className="p-2.5 border-l border-[#D1D1D1]">رقم الطلب</th>
                <th className="p-2.5 border-l border-[#D1D1D1]">نوع الطلب</th>
                <th className="p-2.5 border-l border-[#D1D1D1]">الموظف</th>
                <th className="p-2.5 border-l border-[#D1D1D1]">تاريخ التقديم</th>
                <th className="p-2.5 border-l border-[#D1D1D1]">الفترة (من - إلى)</th>
                <th className="p-2.5 border-l border-[#D1D1D1] text-center">الحالة</th>
                <th className="p-2.5 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {allRecentRequests.map((req) => {
                const reqNum = req.requestNumber || req.id;
                const empName = req.employeeName || employee.name;

                // Status styling helper
                const renderBadge = () => {
                  switch (req.status) {
                    case 'Approved':
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-[#DFF6DD] text-[#107C41] border border-[#92C353]">
                          <CheckCircle2 className="w-3 h-3" />
                          {req.statusAr || 'تمت الموافقة'}
                        </span>
                      );
                    case 'PendingApproval':
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-[#EFF6FC] text-[#0078D4] border border-[#C7E0F4]">
                          <Clock className="w-3 h-3" />
                          {req.statusAr || 'بانتظار الموافقة'}
                        </span>
                      );
                    case 'InReview':
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-[#FFF4CE] text-[#797673] border border-[#FED9CC]">
                          <Clock className="w-3 h-3" />
                          {req.statusAr || 'قيد المراجعة'}
                        </span>
                      );
                    case 'Draft':
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-[#F3F2F1] text-[#605E5C] border border-[#C8C6C4]">
                          <FileText className="w-3 h-3" />
                          {req.statusAr || 'مسودة'}
                        </span>
                      );
                    case 'Rejected':
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-[#FDE7E9] text-[#A80000] border border-[#F19999]">
                          <XCircle className="w-3 h-3" />
                          {req.statusAr || 'مرفوض'}
                        </span>
                      );
                    default:
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-[#F3F2F1] text-[#605E5C] border border-[#EDEBE9]">
                          {req.statusAr}
                        </span>
                      );
                  }
                };

                // Period helper
                const renderPeriod = () => {
                  if (!req.fromDate && !req.toDate) {
                    return <span className="text-[#A19F9D]">غير منطبق</span>;
                  }
                  if (req.fromDate && req.toDate) {
                    if (req.fromDate === req.toDate) {
                      return <span className="font-mono text-[#323130]">{req.fromDate}</span>;
                    }
                    return (
                      <span className="font-mono text-[#323130] text-[11px]">
                        {req.fromDate} <span className="text-[#605E5C] font-sans">إلى</span> {req.toDate}
                      </span>
                    );
                  }
                  if (req.fromDate) {
                    return (
                      <span className="font-mono text-[#323130] text-[11px]">
                        <span className="text-[#605E5C] font-sans">من</span> {req.fromDate}
                      </span>
                    );
                  }
                  return <span className="text-[#A19F9D]">غير منطبق</span>;
                };

                return (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedUnifiedRequest(req)}
                    className="border-b border-[#EDEBE9] hover:bg-[#FAF9F8] cursor-pointer transition-colors"
                  >
                    <td className="p-2.5 border-l border-[#EDEBE9] font-mono font-semibold text-[#0078D4]">
                      {reqNum}
                    </td>
                    <td className="p-2.5 border-l border-[#EDEBE9] font-semibold text-[#323130]">
                      {req.requestType}
                    </td>
                    <td className="p-2.5 border-l border-[#EDEBE9] text-[#323130]">
                      {empName}
                    </td>
                    <td className="p-2.5 border-l border-[#EDEBE9] font-mono text-[#605E5C]">
                      {req.submissionDate}
                    </td>
                    <td className="p-2.5 border-l border-[#EDEBE9]">
                      {renderPeriod()}
                    </td>
                    <td className="p-2.5 border-l border-[#EDEBE9] text-center">
                      {renderBadge()}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUnifiedRequest(req);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#0078D4] hover:text-[#106EBE] hover:bg-[#EFF6FC] border border-transparent hover:border-[#C7E0F4] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0078D4]"
                        title="عرض تفاصيل الطلب"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>عرض التفاصيل</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Request Details Dialog */}
      {selectedUnifiedRequest && (
        <D365Dialog
          isOpen={true}
          onClose={() => setSelectedUnifiedRequest(null)}
          title="تفاصيل الطلب المقدم"
          subtitle={`رقم الطلب: ${selectedUnifiedRequest.requestNumber || selectedUnifiedRequest.id} - Microsoft Dynamics 365 Human Resources`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F9F9F9] border border-[#EDEBE9]">
              <div>
                <span className="text-[#605E5C] block">رقم الطلب:</span>
                <strong className="text-[#0078D4] font-mono text-sm block mt-0.5">
                  {selectedUnifiedRequest.requestNumber || selectedUnifiedRequest.id}
                </strong>
              </div>
              <div>
                <span className="text-[#605E5C] block">نوع الطلب:</span>
                <strong className="text-[#323130] text-sm block mt-0.5">
                  {selectedUnifiedRequest.requestType}
                </strong>
              </div>
              <div>
                <span className="text-[#605E5C] block">الموظف مقدم الطلب:</span>
                <strong className="text-[#323130] block mt-0.5">
                  {selectedUnifiedRequest.employeeName || employee.name}
                  <span className="text-[#605E5C] font-mono text-[11px] mr-1.5 font-normal">
                    ({selectedUnifiedRequest.employeeId || employee.id})
                  </span>
                </strong>
              </div>
              <div>
                <span className="text-[#605E5C] block">تاريخ التقديم:</span>
                <strong className="text-[#323130] font-mono block mt-0.5">
                  {selectedUnifiedRequest.submissionDate}
                </strong>
              </div>
              <div>
                <span className="text-[#605E5C] block">الفترة (من - إلى):</span>
                <strong className="text-[#323130] font-mono block mt-0.5">
                  {selectedUnifiedRequest.fromDate && selectedUnifiedRequest.toDate
                    ? `${selectedUnifiedRequest.fromDate} إلى ${selectedUnifiedRequest.toDate}`
                    : selectedUnifiedRequest.fromDate
                    ? `من ${selectedUnifiedRequest.fromDate}`
                    : 'غير منطبق'}
                </strong>
              </div>
              <div>
                <span className="text-[#605E5C] block">حالة الطلب:</span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold ${
                      selectedUnifiedRequest.status === 'Approved'
                        ? 'bg-[#DFF6DD] text-[#107C41] border border-[#92C353]'
                        : selectedUnifiedRequest.status === 'PendingApproval'
                        ? 'bg-[#EFF6FC] text-[#0078D4] border border-[#C7E0F4]'
                        : selectedUnifiedRequest.status === 'InReview'
                        ? 'bg-[#FFF4CE] text-[#797673] border border-[#FED9CC]'
                        : selectedUnifiedRequest.status === 'Draft'
                        ? 'bg-[#F3F2F1] text-[#605E5C] border border-[#C8C6C4]'
                        : 'bg-[#FDE7E9] text-[#A80000] border border-[#F19999]'
                    }`}
                  >
                    {selectedUnifiedRequest.statusAr}
                  </span>
                </div>
              </div>
            </div>

            {selectedUnifiedRequest.workflowStep && (
              <div className="p-2.5 bg-[#EFF6FC] border border-[#C7E0F4] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0078D4] shrink-0" />
                <div>
                  <span className="text-[#0078D4] font-semibold block text-[11px]">مرحلة سير العمل الحالية (Dynamics 365 Workflow):</span>
                  <span className="text-[#323130]">{selectedUnifiedRequest.workflowStep}</span>
                </div>
              </div>
            )}

            {selectedUnifiedRequest.notes && (
              <div className="p-3 bg-white border border-[#EDEBE9]">
                <span className="text-[#605E5C] font-semibold block mb-1">البيانات والملاحظات المسجلة:</span>
                <p className="text-[#323130] leading-relaxed">{selectedUnifiedRequest.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedUnifiedRequest(null)}
                className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </D365Dialog>
      )}

      {/* Personal Details Dialog (Dynamics 365 HcmPersonPrivateDetails) */}
      <PersonalDetailsDialog
        isOpen={isPersonalDetailsOpen}
        onClose={() => setIsPersonalDetailsOpen(false)}
        employee={employee}
      />
    </div>
  );
};
