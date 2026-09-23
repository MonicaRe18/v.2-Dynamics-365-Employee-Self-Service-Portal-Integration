import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Calendar,
  GraduationCap,
  Award,
  AlertOctagon,
  FileCheck2,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  RefreshCw,
  Building,
  Mail,
  Phone,
  FileText,
  BadgeCheck,
  Check,
  X,
} from 'lucide-react';
import {
  TeamMember,
  TeamPosition,
  TeamMemberRequest,
} from '../../types/d365.types';
import { OnBehalfLeaveDialog } from './OnBehalfLeaveDialog';
import { OnBehalfAbsenceDialog } from './OnBehalfAbsenceDialog';
import { TeamRequestActionDialog } from './TeamRequestActionDialog';
import { exportToCsv } from '../../utils/exportUtils';

export type TeamSubTab =
  | 'overview' // ملخص وبطاقات الموظفين
  | 'positions' // المناصب التي على فريقه
  | 'leaves' // الإجازات والغياب
  | 'training' // خطط التدريب والتعلم
  | 'performance' // تقييم الأداء والمراجعات
  | 'penalties' // الجزاءات
  | 'requests'; // الطلبات المقدمة من الفريق

interface MyTeamViewProps {
  teamMembers: TeamMember[];
  onRefresh: () => void;
  onApproveRequest: (requestId: string, notes?: string) => void;
  onRejectRequest: (requestId: string, reason: string) => void;
  onSubmitLeaveOnBehalf: (
    memberId: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    days: number,
    notes?: string
  ) => void;
  onSubmitAbsenceOnBehalf: (
    memberId: string,
    duration: string,
    date: string,
    reason: string
  ) => void;
  onShowToast: (msg: string) => void;
}

export const MyTeamView: React.FC<MyTeamViewProps> = ({
  teamMembers,
  onRefresh,
  onApproveRequest,
  onRejectRequest,
  onSubmitLeaveOnBehalf,
  onSubmitAbsenceOnBehalf,
  onShowToast,
}) => {
  // Navigation & selection state
  const [activeSubTab, setActiveSubTab] = useState<TeamSubTab>('overview');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(teamMembers[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(false);

  // Dialogs state
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false);
  const [requestActionState, setRequestActionState] = useState<{
    request: TeamMemberRequest | null;
    action: 'approve' | 'reject';
  }>({ request: null, action: 'approve' });

  // Selected member object
  const selectedMember =
    teamMembers.find((m) => m.id === selectedMemberId) || teamMembers[0];

  // All team requests aggregated
  const allTeamRequests = teamMembers.flatMap((m) => m.requests);
  const pendingRequestsCount = allTeamRequests.filter(
    (r) => r.status === 'في انتظار موافقة المدير'
  ).length;

  // Filtered members for search & department
  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      departmentFilter === 'ALL' || m.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // Department unique list
  const departments = Array.from(new Set(teamMembers.map((m) => m.department)));

  // Sub-tabs list matching Dynamics 365 screenshot & user requirements
  const subTabs = [
    {
      id: 'overview' as TeamSubTab,
      label: 'ملخص (Summary)',
      count: teamMembers.length,
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      id: 'positions' as TeamSubTab,
      label: 'المناصب (Positions)',
      count: teamMembers.length,
      icon: <Briefcase className="w-3.5 h-3.5" />,
    },
    {
      id: 'leaves' as TeamSubTab,
      label: 'الإجازة والغياب (Leaves)',
      icon: <Calendar className="w-3.5 h-3.5" />,
    },
    {
      id: 'training' as TeamSubTab,
      label: 'خطط التدريب والتعلم (Training)',
      icon: <GraduationCap className="w-3.5 h-3.5" />,
    },
    {
      id: 'performance' as TeamSubTab,
      label: 'تقييم الأداء (Performance)',
      icon: <Award className="w-3.5 h-3.5" />,
    },
    {
      id: 'penalties' as TeamSubTab,
      label: 'الجزاءات (Disciplinary)',
      icon: <AlertOctagon className="w-3.5 h-3.5" />,
    },
    {
      id: 'requests' as TeamSubTab,
      label: 'الطلبات المقدمة من الفريق (Requests)',
      count: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      icon: <FileCheck2 className="w-3.5 h-3.5" />,
    },
  ];

  // Export current sub-tab data to Excel
  const handleExportTeamData = () => {
    switch (activeSubTab) {
      case 'overview':
      case 'positions': {
        const rows = teamMembers.map((m) => ({
          'الرقم الوظيفي': m.id,
          'اسم الموظف': m.name,
          'المسمى الوظيفي': m.jobTitle,
          'الإدارة': m.department,
          'رقم المنصب': m.positionId,
          'الدرجة المالية': m.grade,
          'تاريخ التعيين': m.hireDate,
          'البريد الإلكتروني': m.email,
          'رقم الهاتف': m.phone,
        }));
        exportToCsv('D365_Team_Members_and_Positions', rows);
        onShowToast('تم تصدير بيانات الفريق والمناصب إلى ملف Excel بنجاح.');
        break;
      }
      case 'leaves': {
        const rows = teamMembers.map((m) => ({
          'اسم الموظف': m.name,
          'الوظيفة': m.jobTitle,
          'الرصيد الاعتيادي المتاح': m.leaves.annualAvailable,
          'الرصيد العارض المتاح': m.leaves.casualAvailable,
          'المرضي المستهلك': m.leaves.sickConsumed,
        }));
        exportToCsv('D365_Team_Leave_Balances', rows);
        onShowToast('تم تصدير أرصدة إجازات الفريق إلى Excel بنجاح.');
        break;
      }
      case 'training': {
        const rows = teamMembers.flatMap((m) =>
          m.trainingPlans.map((t) => ({
            'اسم الموظف': m.name,
            'عنوان الدورة': t.courseTitle,
            'الجهة التدريبية': t.provider,
            'تاريخ البدء': t.startDate,
            'تاريخ الانتهاء': t.endDate,
            'الساعات': t.hours,
            'الحالة': t.status,
            'التقييم': t.evaluation || 'قيد الانتظار',
          }))
        );
        exportToCsv('D365_Team_Training_Plans', rows);
        onShowToast('تم تصدير خطط تدريب الفريق إلى Excel بنجاح.');
        break;
      }
      case 'performance': {
        const rows = teamMembers.map((m) => ({
          'اسم الموظف': m.name,
          'الوظيفة': m.jobTitle,
          'آخر تقييم': m.performance.lastRating,
          'دورة التقييم': m.performance.cycle,
          'الأهداف المحققة': `${m.performance.goalsAchievedCount} من ${m.performance.totalGoalsCount}`,
          'تاريخ المراجعة': m.performance.reviewDate,
          'نقاط القوة': m.performance.strengths,
        }));
        exportToCsv('D365_Team_Performance_Reviews', rows);
        onShowToast('تم تصدير تقييمات أداء الفريق إلى Excel بنجاح.');
        break;
      }
      case 'penalties': {
        const rows = teamMembers.flatMap((m) =>
          m.penalties.map((p) => ({
            'اسم الموظف': m.name,
            'رقم الجزاء': p.penaltyNumber,
            'العقوبة': p.action,
            'التاريخ': p.signingDate,
            'المدة': p.duration,
            'الحالة': p.status,
            'جهة التحقيق': p.investigationAuthority,
          }))
        );
        exportToCsv('D365_Team_Disciplinary_Actions', rows);
        onShowToast('تم تصدير سجل جزاءات الفريق إلى Excel بنجاح.');
        break;
      }
      case 'requests': {
        const rows = allTeamRequests.map((r) => ({
          'رقم الطلب': r.id,
          'اسم الموظف': r.employeeName,
          'الوظيفة': r.employeeJobTitle,
          'نوع الطلب': r.requestType,
          'التفاصيل': r.details,
          'الفترة': r.dates,
          'المدة': r.duration,
          'تاريخ التقديم': r.submissionDate,
          'الحالة': r.status,
          'قرار المدير': r.managerNotes || '',
        }));
        exportToCsv('D365_Team_Requests', rows);
        onShowToast('تم تصدير طلبات الفريق إلى Excel بنجاح.');
        break;
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar matching Microsoft Dynamics 365 screenshot */}
      <div className="bg-white border border-[#D1D1D1] shadow-xs">
        {/* Section title & Collapsible header */}
        <div className="px-4 py-2.5 bg-[#FAF9F8] border-b border-[#EDEBE9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSectionCollapsed(!isSectionCollapsed)}
              className="text-[#605E5C] hover:text-[#0078D4] p-0.5"
              title={isSectionCollapsed ? 'توسيع' : 'طي'}
            >
              {isSectionCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
            <h1 className="font-bold text-sm text-[#323130] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0078D4]" />
              <span>معلومات فريقي (My team)</span>
            </h1>
            <span className="text-[11px] text-[#605E5C] bg-[#EDEBE9] px-2 py-0.5 rounded-none font-mono">
              {teamMembers.length} موظف
            </span>
            {pendingRequestsCount > 0 && (
              <span className="text-[11px] bg-[#FFF4CE] text-[#797673] border border-[#FFB900] px-2 py-0.5 font-bold animate-pulse">
                {pendingRequestsCount} طلب بانتظار الاعتماد
              </span>
            )}
          </div>

          {/* Quick Actions (matching the exact screenshot links: طلب إجازة | طلب إذن غياب) */}
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setIsLeaveDialogOpen(true)}
              className="text-[#0078D4] hover:text-[#106EBE] hover:underline font-semibold flex items-center gap-1 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>طلب إجازة</span>
            </button>
            <span className="text-[#D1D1D1]">|</span>
            <button
              onClick={() => setIsAbsenceDialogOpen(true)}
              className="text-[#0078D4] hover:text-[#106EBE] hover:underline font-semibold flex items-center gap-1 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>طلب إذن غياب</span>
            </button>
            <span className="text-[#D1D1D1]">|</span>
            <button
              onClick={handleExportTeamData}
              className="text-[#605E5C] hover:text-[#323130] flex items-center gap-1"
              title="تصدير إلى Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تصدير</span>
            </button>
            <button
              onClick={onRefresh}
              className="text-[#605E5C] hover:text-[#0078D4] p-1"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        {!isSectionCollapsed && (
          <div className="p-3 bg-white border-b border-[#EDEBE9] flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#8A8886]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم، المنصب، أو الإدارة..."
                className="w-full h-8 pr-8 pl-3 border border-[#8A8886] focus:border-[#0078D4] outline-none text-xs bg-white"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[#605E5C] text-[11px] font-semibold flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>الإدارة:</span>
              </span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none bg-white text-xs"
              >
                <option value="ALL">جميع الإدارات والأقسام ({teamMembers.length})</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept} ({teamMembers.filter((m) => m.department === dept).length})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 2. Main Team Grid & Right Sub-Tabs Layout */}
        {!isSectionCollapsed && (
          <div className="flex flex-col lg:flex-row">
            {/* Main Area: Team Member Cards Grid (Matching Screenshot) */}
            <div className="flex-1 p-3 bg-[#F8F9FA] overflow-y-auto max-h-[620px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2.5">
                {filteredMembers.map((member) => {
                  const isSelected = member.id === selectedMemberId;
                  const hasDirectReports = (member.directReportsCount || 0) > 0;
                  const hasPendingRequest = member.requests.some(
                    (r) => r.status === 'في انتظار موافقة المدير'
                  );

                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`relative cursor-pointer transition-all duration-150 border text-right flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#EFF6FC] border-[#0078D4] shadow-sm ring-1 ring-[#0078D4]'
                          : 'bg-white border-[#D1D1D1] hover:border-[#0078D4] hover:shadow-xs'
                      }`}
                    >
                      {/* Top Blue Accent Bar (matching screenshot) */}
                      <div className="h-1.5 bg-[#0078D4] w-full relative">
                        {/* Direct Reports Badge (e.g., "التقارير المباشرة: 1" shown on وفاء سيد عرابى على in screenshot) */}
                        {hasDirectReports && (
                          <div className="absolute top-0 right-0 bg-[#004E8C] text-white text-[9px] px-1.5 py-0.2 font-mono font-bold leading-tight">
                            التقارير المباشرة: {member.directReportsCount}
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-2.5 flex items-start justify-between gap-2 flex-1">
                        <div className="flex-1 min-w-0">
                          {/* Employee Name */}
                          <h3
                            className="font-bold text-xs text-[#323130] truncate"
                            title={member.name}
                          >
                            {member.name}
                          </h3>

                          {/* Job Title */}
                          <p
                            className="text-[11px] text-[#605E5C] truncate mt-0.5"
                            title={member.jobTitle}
                          >
                            {member.jobTitle}
                          </p>

                          {/* Department */}
                          <p
                            className="text-[10px] text-[#8A8886] truncate mt-0.5"
                            title={member.department}
                          >
                            {member.department}
                          </p>

                          {/* Pending Request Indicator */}
                          {hasPendingRequest && (
                            <span className="inline-block mt-1 text-[9px] bg-[#FFF4CE] text-[#797673] border border-[#FFB900] px-1 font-semibold">
                              طلب معلق
                            </span>
                          )}
                        </div>

                        {/* User Icon (matching the circular user outline in screenshot) */}
                        <div className="w-8 h-8 rounded-full border border-[#0078D4]/40 flex items-center justify-center shrink-0 bg-white">
                          <User className="w-5 h-5 text-[#0078D4] stroke-[1.5]" />
                        </div>
                      </div>

                      {/* Selected State Footer: "التفاصيل ∨" (as shown on selected card in screenshot) */}
                      {isSelected ? (
                        <div className="border-t border-[#0078D4]/20 py-1 px-2 bg-[#DEECF9] flex items-center justify-center gap-1 text-[11px] text-[#0078D4] font-semibold">
                          <span>التفاصيل</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="h-1 bg-transparent" />
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredMembers.length === 0 && (
                <div className="p-8 text-center text-[#605E5C] bg-white border border-[#EDEBE9]">
                  لا توجد نتائج مطابقة لبحثك. يرجى تعديل معايير البحث أو اختيار إدارة أخرى.
                </div>
              )}
            </div>

            {/* Right Sub-Tabs Navigation (Matching Dynamics 365 vertical menu on right) */}
            <div className="w-full lg:w-56 bg-white border-t lg:border-t-0 lg:border-r border-[#D1D1D1] flex flex-col shrink-0">
              <div className="p-2.5 bg-[#FAF9F8] border-b border-[#EDEBE9] font-bold text-xs text-[#323130] flex items-center justify-between">
                <span>أقسام وبيانات الفريق</span>
                <span className="text-[10px] text-[#605E5C] font-mono">D365 HR</span>
              </div>
              <div className="divide-y divide-[#EDEBE9] flex-1">
                {subTabs.map((tab) => {
                  const isActive = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSubTab(tab.id)}
                      className={`w-full px-3 py-2.5 text-xs text-right flex items-center justify-between transition-colors outline-none ${
                        isActive
                          ? 'bg-[#EFF6FC] text-[#0078D4] font-bold border-l-4 border-l-[#0078D4]'
                          : 'text-[#323130] hover:bg-[#F3F2F1]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isActive ? 'text-[#0078D4]' : 'text-[#605E5C]'}>
                          {tab.icon}
                        </span>
                        <span>{tab.label}</span>
                      </div>
                      {tab.count !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-none font-bold ${
                            isActive
                              ? 'bg-[#0078D4] text-white'
                              : 'bg-[#EDEBE9] text-[#605E5C]'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Detailed Workspace for Active Sub-Tab */}
      <div className="bg-white border border-[#D1D1D1] shadow-xs">
        {/* Sub-Tab Header */}
        <div className="px-4 py-3 bg-[#FAF9F8] border-b border-[#EDEBE9] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#0078D4]" />
            <h2 className="font-bold text-sm text-[#323130]">
              {activeSubTab === 'overview' && `بيانات الموظف المحدد: ${selectedMember.name}`}
              {activeSubTab === 'positions' && 'المناصب الوظيفية التي على فريقه (Team Positions)'}
              {activeSubTab === 'leaves' && `أرصدة وسجل إجازات: ${selectedMember.name}`}
              {activeSubTab === 'training' && `خطط التدريب والتعلم: ${selectedMember.name}`}
              {activeSubTab === 'performance' && `تقييم الأداء والمراجعات: ${selectedMember.name}`}
              {activeSubTab === 'penalties' && `سجل الجزاءات والعقوبات: ${selectedMember.name}`}
              {activeSubTab === 'requests' && 'الطلبات المقدمة من موظفي الفريق (Team Requests)'}
            </h2>
          </div>

          {/* Contextual actions */}
          <div className="flex items-center gap-2 text-xs">
            {activeSubTab === 'leaves' && (
              <button
                onClick={() => setIsLeaveDialogOpen(true)}
                className="px-2.5 py-1 bg-[#0078D4] hover:bg-[#106EBE] text-white font-semibold flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>تسجيل إجازة للموظف</span>
              </button>
            )}
            {activeSubTab === 'requests' && (
              <span className="text-[11px] text-[#605E5C]">
                إجمالي الطلبات: {allTeamRequests.length} (المعلقة: {pendingRequestsCount})
              </span>
            )}
          </div>
        </div>

        {/* Sub-Tab Content View */}
        <div className="p-4 text-xs">
          {/* A. OVERVIEW / SUMMARY */}
          {activeSubTab === 'overview' && (
            <div className="space-y-4">
              {/* Member Profile Banner */}
              <div className="p-4 bg-[#F8F9FA] border border-[#EDEBE9] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-[#0078D4] bg-[#EFF6FC] flex items-center justify-center">
                    <User className="w-7 h-7 text-[#0078D4]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#323130]">{selectedMember.name}</h3>
                      <span className="text-[10px] bg-[#DFF6DD] text-[#107C41] border border-[#107C41] px-1.5 font-bold">
                        نشط (Active)
                      </span>
                    </div>
                    <p className="text-[#605E5C] text-xs">
                      {selectedMember.jobTitle} • {selectedMember.department}
                    </p>
                    <p className="text-[11px] text-[#8A8886] font-mono">
                      الرقم الوظيفي: {selectedMember.id} | المنصب: {selectedMember.positionId} | الدرجة: {selectedMember.grade}
                    </p>
                  </div>
                </div>

                {/* Quick stats for selected member */}
                <div className="flex items-center gap-3">
                  <div className="text-center p-2 bg-white border border-[#D1D1D1] min-w-[90px]">
                    <div className="text-sm font-bold text-[#0078D4]">
                      {selectedMember.leaves.annualAvailable}
                    </div>
                    <div className="text-[10px] text-[#605E5C]">رصيد اعتيادي</div>
                  </div>
                  <div className="text-center p-2 bg-white border border-[#D1D1D1] min-w-[90px]">
                    <div className="text-sm font-bold text-[#107C41]">
                      {selectedMember.leaves.casualAvailable}
                    </div>
                    <div className="text-[10px] text-[#605E5C]">رصيد عارض</div>
                  </div>
                  <div className="text-center p-2 bg-white border border-[#D1D1D1] min-w-[90px]">
                    <div className="text-sm font-bold text-[#323130]">
                      {selectedMember.trainingPlans.length}
                    </div>
                    <div className="text-[10px] text-[#605E5C]">دورات تدريبية</div>
                  </div>
                </div>
              </div>

              {/* 3 Columns: Position Brief, Leave Brief, Performance Brief */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Position Card */}
                <div className="border border-[#D1D1D1] p-3 space-y-2 bg-white">
                  <div className="font-bold text-[#323130] border-b border-[#EDEBE9] pb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#0078D4]" />
                      <span>بيانات المنصب</span>
                    </span>
                    <button
                      onClick={() => setActiveSubTab('positions')}
                      className="text-[10px] text-[#0078D4] hover:underline"
                    >
                      عرض الكل
                    </button>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div><strong>رقم المنصب:</strong> {selectedMember.position.positionId}</div>
                    <div><strong>المسمى:</strong> {selectedMember.position.positionTitle}</div>
                    <div><strong>القسم:</strong> {selectedMember.position.division}</div>
                    <div><strong>المشرف:</strong> {selectedMember.position.reportsTo}</div>
                    <div><strong>تاريخ التسكين:</strong> {selectedMember.position.assignmentDate}</div>
                    <div><strong>نسبة التفرغ (FTE):</strong> {selectedMember.position.fte}</div>
                  </div>
                </div>

                {/* 2. Leaves Card */}
                <div className="border border-[#D1D1D1] p-3 space-y-2 bg-white">
                  <div className="font-bold text-[#323130] border-b border-[#EDEBE9] pb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0078D4]" />
                      <span>أرصدة الإجازات</span>
                    </span>
                    <button
                      onClick={() => setActiveSubTab('leaves')}
                      className="text-[10px] text-[#0078D4] hover:underline"
                    >
                      السجل الكامل
                    </button>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span>إجازة اعتيادية:</span>
                      <strong className="text-[#0078D4]">{selectedMember.leaves.annualAvailable} يوم متاح</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>إجازة عارضة:</span>
                      <strong className="text-[#107C41]">{selectedMember.leaves.casualAvailable} يوم متاح</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>إجازة مرضية مستهلكة:</span>
                      <span>{selectedMember.leaves.sickConsumed} يوم</span>
                    </div>
                    <div className="pt-2 border-t border-[#EDEBE9] flex gap-2">
                      <button
                        onClick={() => setIsLeaveDialogOpen(true)}
                        className="flex-1 py-1 bg-[#EFF6FC] border border-[#DEECF9] text-[#0078D4] font-semibold hover:bg-[#DEECF9] text-center"
                      >
                        طلب إجازة للموظف
                      </button>
                      <button
                        onClick={() => setIsAbsenceDialogOpen(true)}
                        className="flex-1 py-1 bg-[#FAF9F8] border border-[#EDEBE9] text-[#323130] font-semibold hover:bg-[#EDEBE9] text-center"
                      >
                        طلب إذن غياب
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Performance Card */}
                <div className="border border-[#D1D1D1] p-3 space-y-2 bg-white">
                  <div className="font-bold text-[#323130] border-b border-[#EDEBE9] pb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#0078D4]" />
                      <span>تقييم الأداء السنوي</span>
                    </span>
                    <button
                      onClick={() => setActiveSubTab('performance')}
                      className="text-[10px] text-[#0078D4] hover:underline"
                    >
                      التفاصيل
                    </button>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="font-bold text-[#107C41] text-xs">
                      {selectedMember.performance.lastRating}
                    </div>
                    <div><strong>دورة التقييم:</strong> {selectedMember.performance.cycle}</div>
                    <div>
                      <strong>الأهداف المحققة:</strong>{' '}
                      {selectedMember.performance.goalsAchievedCount} من{' '}
                      {selectedMember.performance.totalGoalsCount} أهداف
                    </div>
                    <div><strong>تاريخ الاعتماد:</strong> {selectedMember.performance.reviewDate}</div>
                    <div className="text-[10px] text-[#605E5C] line-clamp-2 mt-1">
                      <strong>أبرز نقاط القوة:</strong> {selectedMember.performance.strengths}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Member Requests if any */}
              {selectedMember.requests.length > 0 && (
                <div className="border border-[#D1D1D1] p-3 bg-white space-y-2">
                  <div className="font-bold text-[#323130] border-b border-[#EDEBE9] pb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-[#0078D4]" />
                      <span>طلبات الموظف المعلقة في انتظار قرار المشرف</span>
                    </span>
                    <button
                      onClick={() => setActiveSubTab('requests')}
                      className="text-[10px] text-[#0078D4] hover:underline"
                    >
                      عرض جميع طلبات الفريق
                    </button>
                  </div>
                  <div className="divide-y divide-[#EDEBE9]">
                    {selectedMember.requests.map((req) => (
                      <div key={req.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-[#323130] flex items-center gap-2">
                            <span>{req.requestType}</span>
                            <span className="text-[10px] bg-[#EFF6FC] text-[#0078D4] px-1 font-mono">
                              {req.duration}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#605E5C]">
                            الفترة: {req.dates} • تاريخ التقديم: {req.submissionDate}
                          </div>
                          <div className="text-[11px] text-[#323130] mt-0.5">{req.details}</div>
                        </div>

                        {req.status === 'في انتظار موافقة المدير' ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() =>
                                setRequestActionState({ request: req, action: 'approve' })
                              }
                              className="px-2.5 py-1 bg-[#107C41] hover:bg-[#0E6A37] text-white font-semibold flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>اعتماد</span>
                            </button>
                            <button
                              onClick={() =>
                                setRequestActionState({ request: req, action: 'reject' })
                              }
                              className="px-2 py-1 bg-white hover:bg-[#FDE7E9] border border-[#A80000] text-[#A80000] font-semibold flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              <span>رفض</span>
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold ${
                              req.status === 'معتمد'
                                ? 'bg-[#DFF6DD] text-[#107C41]'
                                : 'bg-[#FDE7E9] text-[#A80000]'
                            }`}
                          >
                            {req.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. POSITIONS (المناصب التي على فريقه) */}
          {activeSubTab === 'positions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#605E5C]">
                  جدول المناصب الوظيفية المعتمدة بهيكل الإدارة التابعة للمشرف المباشر
                </span>
                <span className="font-mono text-[#0078D4] font-bold">
                  إجمالي المناصب: {teamMembers.length} منصب مشغول (0 شاغر)
                </span>
              </div>

              <div className="overflow-x-auto border border-[#D1D1D1]">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-[#FAF9F8] border-b border-[#D1D1D1] text-[#323130] font-bold">
                    <tr>
                      <th className="p-2.5 border-l border-[#EDEBE9]">رقم المنصب</th>
                      <th className="p-2.5 border-l border-[#EDEBE9]">المسمى الوظيفي</th>
                      <th className="p-2.5 border-l border-[#EDEBE9]">الموظف المسكن</th>
                      <th className="p-2.5 border-l border-[#EDEBE9]">الإدارة / القسم</th>
                      <th className="p-2.5 border-l border-[#EDEBE9]">الدرجة المالية</th>
                      <th className="p-2.5 border-l border-[#EDEBE9]">المشرف المباشر</th>
                      <th className="p-2.5 border-l border-[#EDEBE9]">تاريخ التسكين</th>
                      <th className="p-2.5 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEBE9]">
                    {teamMembers.map((member) => (
                      <tr
                        key={member.id}
                        className={`hover:bg-[#F3F2F1] cursor-pointer ${
                          member.id === selectedMemberId ? 'bg-[#EFF6FC]' : ''
                        }`}
                        onClick={() => setSelectedMemberId(member.id)}
                      >
                        <td className="p-2.5 border-l border-[#EDEBE9] font-mono font-bold text-[#0078D4]">
                          {member.position.positionId}
                        </td>
                        <td className="p-2.5 border-l border-[#EDEBE9] font-semibold text-[#323130]">
                          {member.position.positionTitle}
                        </td>
                        <td className="p-2.5 border-l border-[#EDEBE9] text-[#323130]">
                          {member.name}
                        </td>
                        <td className="p-2.5 border-l border-[#EDEBE9] text-[#605E5C]">
                          {member.department}
                        </td>
                        <td className="p-2.5 border-l border-[#EDEBE9] text-[#605E5C]">
                          {member.grade}
                        </td>
                        <td className="p-2.5 border-l border-[#EDEBE9] text-[#605E5C]">
                          {member.position.reportsTo}
                        </td>
                        <td className="p-2.5 border-l border-[#EDEBE9] font-mono text-[#8A8886]">
                          {member.position.assignmentDate}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="bg-[#DFF6DD] text-[#107C41] border border-[#107C41] px-2 py-0.5 text-[10px] font-bold">
                            مشغول (1.0 FTE)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* C. LEAVES & ABSENCE (الإجازات والغياب) */}
          {activeSubTab === 'leaves' && (
            <div className="space-y-4">
              {/* Balances Grid for all team members */}
              <div className="border border-[#D1D1D1] overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-[#FAF9F8] border-b border-[#D1D1D1] font-bold text-[#323130]">
                    <tr>
                      <th className="p-2.5 border-l border-[#EDEBE9]">الموظف</th>
                      <th className="p-2.5 border-l border-[#EDEBE9]">الوظيفة</th>
                      <th className="p-2.5 border-l border-[#EDEBE9] text-center">الرصيد الاعتيادي المتاح</th>
                      <th className="p-2.5 border-l border-[#EDEBE9] text-center">الرصيد العارض المتاح</th>
                      <th className="p-2.5 border-l border-[#EDEBE9] text-center">المرضي المستهلك</th>
                      <th className="p-2.5 border-l border-[#EDEBE9]">آخر إجازة مسجلة</th>
                      <th className="p-2.5 text-center">إجراءات المشرف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEBE9]">
                    {teamMembers.map((m) => (
                      <tr
                        key={m.id}
                        className={`hover:bg-[#F3F2F1] ${m.id === selectedMemberId ? 'bg-[#EFF6FC]' : ''}`}
                      >
                        <td className="p-2.5 border-l border-[#EDEBE9] font-bold text-[#323130]">
                          {m.name}
                        </td>
                        <td className="p-2.5 border-l border-[#EDEBE9] text-[#605E5C]">
                          {m.jobTitle}
                        </td>
                        <td className="p-2.5 border-l border-[#EDEBE9] text-center font-bold text-[#0078D4]">
                          {m.leaves.annualAvailable} يوم
                        </td>
                        <td className="p-2.5 border-l border-[#EDEBE9] text-center font-bold text-[#107C41]">
                          {m.leaves.casualAvailable} يوم
                        </td>
                        <td className="p-2.5 border-l border-[#EDEBE9] text-center text-[#605E5C]">
                          {m.leaves.sickConsumed} يوم
                        </td>
                        <td className="p-2.5 border-l border-[#EDEBE9] text-[11px] text-[#605E5C]">
                          {m.leaves.recentLeaves[0] ? (
                            <span>
                              {m.leaves.recentLeaves[0].leaveType} ({m.leaves.recentLeaves[0].days} أيام)
                            </span>
                          ) : (
                            <span className="text-[#8A8886]">لا توجد إجازات حديثة</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => {
                              setSelectedMemberId(m.id);
                              setIsLeaveDialogOpen(true);
                            }}
                            className="px-2 py-1 bg-[#EFF6FC] border border-[#DEECF9] text-[#0078D4] hover:bg-[#DEECF9] font-semibold text-[11px]"
                          >
                            طلب إجازة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* D. TRAINING PLANS (خطط التدريب والتعلم) */}
          {activeSubTab === 'training' && (
            <div className="space-y-3">
              <div className="text-xs text-[#605E5C]">
                البرامج والدورات التدريبية المخططة والمكتملة لفرق العمل وفق خطة التطوير المؤسسي
              </div>

              <div className="border border-[#D1D1D1] overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-[#FAF9F8] border-b border-[#D1D1D1] font-bold text-[#323130]">
                    <tr>
                      <th className="p-2.5 border-l border-[#EDEBE9]">الموظف</th>
                      <th className="p-2.5 border-l border-[#EDEBE9]">عنوان البرنامج التدريبي</th>
                      <th className="p-2.5 border-l border-[#EDEBE9]">الجهة التدريبية</th>
                      <th className="p-2.5 border-l border-[#EDEBE9] text-center">الساعات</th>
                      <th className="p-2.5 border-l border-[#EDEBE9]">الفترة الزمنية</th>
                      <th className="p-2.5 border-l border-[#EDEBE9] text-center">حالة الدورة</th>
                      <th className="p-2.5 text-center">التقييم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEBE9]">
                    {teamMembers.flatMap((member) =>
                      member.trainingPlans.map((plan) => (
                        <tr key={plan.id} className="hover:bg-[#F3F2F1]">
                          <td className="p-2.5 border-l border-[#EDEBE9] font-semibold text-[#323130]">
                            {member.name}
                          </td>
                          <td className="p-2.5 border-l border-[#EDEBE9] font-bold text-[#0078D4]">
                            {plan.courseTitle}
                          </td>
                          <td className="p-2.5 border-l border-[#EDEBE9] text-[#605E5C]">
                            {plan.provider}
                          </td>
                          <td className="p-2.5 border-l border-[#EDEBE9] text-center font-mono">
                            {plan.hours} س
                          </td>
                          <td className="p-2.5 border-l border-[#EDEBE9] text-[11px] font-mono text-[#605E5C]">
                            {plan.startDate} إلى {plan.endDate}
                          </td>
                          <td className="p-2.5 border-l border-[#EDEBE9] text-center">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold ${
                                plan.status === 'مكتمل'
                                  ? 'bg-[#DFF6DD] text-[#107C41]'
                                  : 'bg-[#FFF4CE] text-[#797673]'
                              }`}
                            >
                              {plan.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-[#107C41]">
                            {plan.evaluation || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* E. PERFORMANCE EVALUATION (تقييم الأداء والمراجعات) */}
          {activeSubTab === 'performance' && (
            <div className="space-y-3">
              <div className="text-xs text-[#605E5C]">
                نتائج التقييم السنوي المعتمد ومؤشرات الأداء لجميع أعضاء الفريق
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="border border-[#D1D1D1] bg-white p-3 space-y-2 hover:border-[#0078D4] transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-[#EDEBE9] pb-2">
                      <div>
                        <h4 className="font-bold text-xs text-[#323130]">{member.name}</h4>
                        <p className="text-[11px] text-[#605E5C]">{member.jobTitle}</p>
                      </div>
                      <span className="text-[10px] bg-[#DFF6DD] text-[#107C41] px-1.5 py-0.5 font-bold">
                        معتمد
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span>النتيجة النهائية:</span>
                        <strong className="text-[#107C41]">{member.performance.lastRating}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>الأهداف المحققة:</span>
                        <strong className="text-[#0078D4]">
                          {member.performance.goalsAchievedCount} من {member.performance.totalGoalsCount}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>تاريخ الاعتماد:</span>
                        <span className="font-mono text-[#8A8886]">
                          {member.performance.reviewDate}
                        </span>
                      </div>
                      <div className="pt-1 text-[10px] text-[#605E5C] border-t border-[#EDEBE9]">
                        <strong>نقاط القوة:</strong> {member.performance.strengths}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* F. DISCIPLINARY & PENALTIES (الجزاءات) */}
          {activeSubTab === 'penalties' && (
            <div className="space-y-3">
              <div className="text-xs text-[#605E5C]">
                سجل الجزاءات والتحقيقات الإدارية لأفراد الفريق (وفق قانون الخدمة المدنية)
              </div>

              {teamMembers.some((m) => m.penalties.length > 0) ? (
                <div className="border border-[#D1D1D1] overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead className="bg-[#FAF9F8] border-b border-[#D1D1D1] font-bold text-[#323130]">
                      <tr>
                        <th className="p-2.5 border-l border-[#EDEBE9]">الموظف</th>
                        <th className="p-2.5 border-l border-[#EDEBE9]">رقم الجزاء</th>
                        <th className="p-2.5 border-l border-[#EDEBE9]">الإجراء المتخذ</th>
                        <th className="p-2.5 border-l border-[#EDEBE9]">تاريخ التوقيع</th>
                        <th className="p-2.5 border-l border-[#EDEBE9]">جهة التحقيق</th>
                        <th className="p-2.5 border-l border-[#EDEBE9]">المدة / الأيام</th>
                        <th className="p-2.5 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEBE9]">
                      {teamMembers.flatMap((member) =>
                        member.penalties.map((pen) => (
                          <tr key={pen.id} className="hover:bg-[#F3F2F1]">
                            <td className="p-2.5 border-l border-[#EDEBE9] font-bold text-[#323130]">
                              {member.name}
                            </td>
                            <td className="p-2.5 border-l border-[#EDEBE9] font-mono text-[#A80000]">
                              {pen.penaltyNumber}
                            </td>
                            <td className="p-2.5 border-l border-[#EDEBE9] font-semibold text-[#A80000]">
                              {pen.action}
                            </td>
                            <td className="p-2.5 border-l border-[#EDEBE9] font-mono text-[#605E5C]">
                              {pen.signingDate}
                            </td>
                            <td className="p-2.5 border-l border-[#EDEBE9] text-[#605E5C]">
                              {pen.investigationAuthority}
                            </td>
                            <td className="p-2.5 border-l border-[#EDEBE9] font-mono">
                              {pen.duration}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="bg-[#FDE7E9] text-[#A80000] border border-[#FDE7E9] px-2 py-0.5 text-[10px] font-bold">
                                {pen.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#FAF9F8] border border-[#EDEBE9] text-xs text-[#107C41] space-y-1">
                  <BadgeCheck className="w-8 h-8 mx-auto text-[#107C41]" />
                  <div className="font-bold text-sm">سجل الجزاءات نظيف تماماً لجميع أعضاء الفريق</div>
                  <div className="text-[11px] text-[#605E5C]">
                    لا توجد أي جزاءات أو تحقيقات إدارية موقعة على أي من المرؤوسين في الفترة الحالية.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* G. TEAM REQUESTS (الطلبات المقدمة من الفريق) */}
          {activeSubTab === 'requests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#605E5C]">
                  الطلبات الرسمية المرفوعة من موظفي الفريق (إجازات، أذونات، ندب، إعارة، نقل)
                </span>
                <span className="font-bold text-[#0078D4]">
                  {pendingRequestsCount} طلبات في انتظار اعتمادك
                </span>
              </div>

              {allTeamRequests.length > 0 ? (
                <div className="border border-[#D1D1D1] overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead className="bg-[#FAF9F8] border-b border-[#D1D1D1] font-bold text-[#323130]">
                      <tr>
                        <th className="p-2.5 border-l border-[#EDEBE9]">الموظف مقدم الطلب</th>
                        <th className="p-2.5 border-l border-[#EDEBE9]">الوظيفة</th>
                        <th className="p-2.5 border-l border-[#EDEBE9]">نوع الطلب</th>
                        <th className="p-2.5 border-l border-[#EDEBE9]">تفاصيل ومبررات الطلب</th>
                        <th className="p-2.5 border-l border-[#EDEBE9]">الفترة / المدة</th>
                        <th className="p-2.5 border-l border-[#EDEBE9] text-center">تاريخ التقديم</th>
                        <th className="p-2.5 border-l border-[#EDEBE9] text-center">الحالة</th>
                        <th className="p-2.5 text-center">إجراء المدير</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEBE9]">
                      {allTeamRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-[#F3F2F1]">
                          <td className="p-2.5 border-l border-[#EDEBE9] font-bold text-[#323130]">
                            {req.employeeName}
                          </td>
                          <td className="p-2.5 border-l border-[#EDEBE9] text-[#605E5C]">
                            {req.employeeJobTitle}
                          </td>
                          <td className="p-2.5 border-l border-[#EDEBE9] font-semibold text-[#0078D4]">
                            {req.requestType}
                          </td>
                          <td className="p-2.5 border-l border-[#EDEBE9] text-[#323130] max-w-xs">
                            {req.details}
                            {req.managerNotes && (
                              <div className="text-[10px] text-[#605E5C] mt-0.5 bg-[#FAF9F8] p-1 border border-[#EDEBE9]">
                                <strong>قرار المدير:</strong> {req.managerNotes}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 border-l border-[#EDEBE9] text-[11px] font-mono text-[#605E5C]">
                            {req.dates} ({req.duration})
                          </td>
                          <td className="p-2.5 border-l border-[#EDEBE9] text-center font-mono text-[#8A8886]">
                            {req.submissionDate}
                          </td>
                          <td className="p-2.5 border-l border-[#EDEBE9] text-center">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold ${
                                req.status === 'معتمد'
                                  ? 'bg-[#DFF6DD] text-[#107C41]'
                                  : req.status === 'مرفوض'
                                  ? 'bg-[#FDE7E9] text-[#A80000]'
                                  : 'bg-[#FFF4CE] text-[#797673] animate-pulse'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            {req.status === 'في انتظار موافقة المدير' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() =>
                                    setRequestActionState({ request: req, action: 'approve' })
                                  }
                                  className="px-2.5 py-1 bg-[#107C41] hover:bg-[#0E6A37] text-white font-semibold flex items-center gap-1 shadow-xs"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>اعتماد</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setRequestActionState({ request: req, action: 'reject' })
                                  }
                                  className="px-2 py-1 bg-white hover:bg-[#FDE7E9] border border-[#A80000] text-[#A80000] font-semibold flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  <span>رفض</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#8A8886]">
                                تم اتخاذ القرار
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center bg-[#FAF9F8] border border-[#EDEBE9] text-xs text-[#605E5C]">
                  لا توجد طلبات مقدمة من أعضاء الفريق حالياً.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Dialogs */}
      {/* A. Leave On Behalf Dialog */}
      <OnBehalfLeaveDialog
        isOpen={isLeaveDialogOpen}
        onClose={() => setIsLeaveDialogOpen(false)}
        teamMembers={teamMembers}
        initialMemberId={selectedMemberId}
        onSubmit={(memberId, leaveType, startDate, endDate, days, notes) => {
          onSubmitLeaveOnBehalf(memberId, leaveType, startDate, endDate, days, notes);
          onShowToast(`تم تسجيل واعتماد طلب الإجازة للموظف بنجاح.`);
        }}
      />

      {/* B. Absence On Behalf Dialog */}
      <OnBehalfAbsenceDialog
        isOpen={isAbsenceDialogOpen}
        onClose={() => setIsAbsenceDialogOpen(false)}
        teamMembers={teamMembers}
        initialMemberId={selectedMemberId}
        onSubmit={(memberId, duration, date, reason) => {
          onSubmitAbsenceOnBehalf(memberId, duration, date, reason);
          onShowToast(`تم تسجيل إذن الغياب للموظف بنجاح.`);
        }}
      />

      {/* C. Approve / Reject Request Dialog */}
      <TeamRequestActionDialog
        isOpen={!!requestActionState.request}
        onClose={() => setRequestActionState({ request: null, action: 'approve' })}
        request={requestActionState.request}
        actionType={requestActionState.action}
        onConfirm={(requestId, notes) => {
          if (requestActionState.action === 'approve') {
            onApproveRequest(requestId, notes);
            onShowToast('تم اعتماد طلب الموظف بنجاح وإرسال إشعار رسمي.');
          } else {
            onRejectRequest(requestId, notes || 'تم الرفض لعدم توافر الشروط أو لظروف العمل.');
            onShowToast('تم رفض طلب الموظف وتدوين أسباب القرار.');
          }
        }}
      />
    </div>
  );
};
