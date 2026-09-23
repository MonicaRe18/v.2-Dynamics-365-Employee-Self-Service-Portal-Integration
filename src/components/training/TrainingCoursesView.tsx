import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  FileSpreadsheet,
  Star
} from 'lucide-react';
import { D365ActionBar } from '../common/D365ActionBar';
import { D365DataGrid, Column } from '../common/D365DataGrid';
import { D365StatusBadge } from '../common/D365StatusBadge';
import { D365FastTab } from '../common/D365FastTab';
import { TrainingEvaluationDialog } from './TrainingEvaluationDialog';
import { TrainingCourse } from '../../types/d365.types';

interface TrainingCoursesViewProps {
  courses: TrainingCourse[];
  onRefresh: () => void;
  onExportExcel: () => void;
  onEvaluationSuccess: () => void;
}

export const TrainingCoursesView: React.FC<TrainingCoursesViewProps> = ({
  courses,
  onRefresh,
  onExportExcel,
  onEvaluationSuccess,
}) => {
  const [selectedCourseForEval, setSelectedCourseForEval] = useState<TrainingCourse | null>(null);

  const pendingEvalCount = courses.filter((c) => c.generalEvaluationStatus === 'PendingEvaluation').length;
  const completedCoursesCount = courses.filter((c) => c.attendanceStatus === 'Attended').length;

  const columns: Column<TrainingCourse>[] = [
    {
      key: 'courseId',
      header: 'رمز الدورة (Course ID)',
      width: '140px',
      render: (row) => (
        <span className="font-mono text-[11px] font-bold text-[#0078D4]">{row.courseId}</span>
      ),
    },
    {
      key: 'courseTitle',
      header: 'عنوان الدورة التدريبية (Course Title)',
      render: (row) => (
        <div>
          <div className="font-semibold text-xs text-[#323130]">{row.courseTitle}</div>
          <div className="text-[10px] text-[#605E5C] mt-0.5">{row.provider} • {row.location}</div>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'تاريخ البدء',
      width: '105px',
      render: (row) => <span className="font-mono text-[11px]">{row.startDate}</span>,
    },
    {
      key: 'endDate',
      header: 'تاريخ الانتهاء',
      width: '105px',
      render: (row) => <span className="font-mono text-[11px]">{row.endDate}</span>,
    },
    {
      key: 'generalEvaluation',
      header: 'التقييم العام',
      width: '140px',
      render: (row) => {
        if (row.generalEvaluationStatus === 'Evaluated') {
          return (
            <span className="px-2 py-0.5 text-[11px] bg-[#DFF6DD] text-[#107C41] border border-[#107C41]/30 font-semibold flex items-center gap-1 w-max">
              <Star className="w-3 h-3 fill-current" />
              <span>{row.generalEvaluationScore || 'تم التقييم'}</span>
            </span>
          );
        }
        return (
          <span className="px-2 py-0.5 text-[11px] bg-[#FFF4CE] text-[#797673] border border-[#FDE300]/50 font-medium">
            بانتظار التقييم
          </span>
        );
      },
    },
    {
      key: 'evaluationAfter3Months',
      header: 'التقييم بعد 3 أشهر (أثر التدريب)',
      width: '160px',
      render: (row) => {
        if (row.evaluationAfter3MonthsStatus === 'Completed') {
          return (
            <div className="text-[11px] text-[#107C41] font-medium truncate" title={row.evaluationAfter3MonthsScore}>
              {row.evaluationAfter3MonthsScore}
            </div>
          );
        }
        return (
          <span className="text-[11px] text-[#8A8886]">
            قيد الانتظار لموعد المتابعة
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      {/* Dynamics Action Bar */}
      <D365ActionBar
        onRefresh={onRefresh}
        onExportExcel={onExportExcel}
      />

      {/* Page Title & KPI Bar */}
      <div className="bg-white border border-[#D1D1D1] p-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-[#323130] flex items-center gap-2">
            <span className="w-2 h-4 bg-[#0078D4]"></span>
            <span>الدورات والبرامج التدريبية (HcmCourseAttendance & Skills)</span>
          </h1>
          <p className="text-[11px] text-[#605E5C] mt-0.5">
            سجل الدورات المعتمدة وتقييم البرامج وقياس الأثر التدريبي للموظف في مايكروسوفت ديناميكس
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-[#FAF9F8] border border-[#D1D1D1] text-xs">
            <span className="text-[#605E5C]">الدورات المنجزة: </span>
            <strong className="text-[#107C41] font-sans">{completedCoursesCount}</strong>
          </div>
          <div className="px-3 py-1.5 bg-[#FAF9F8] border border-[#D1D1D1] text-xs">
            <span className="text-[#605E5C]">تقييمات معلقة: </span>
            <strong className="text-[#D83B01] font-sans">{pendingEvalCount}</strong>
          </div>
        </div>
      </div>

      {/* Training Courses Data Grid */}
      <D365DataGrid
        columns={columns}
        data={courses}
        keyExtractor={(c) => c.id}
        title="قائمة الدورات التدريبية المعتمدة للموظف"
        searchPlaceholder="بحث برمز الدورة أو العنوان أو الجهة التدريبية..."
        actions={(row) => (
          <div className="flex items-center justify-center">
            {row.generalEvaluationStatus === 'PendingEvaluation' ? (
              <button
                onClick={() => setSelectedCourseForEval(row)}
                className="px-2.5 py-1 bg-[#0078D4] hover:bg-[#106EBE] text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
                title="إجراء تقييم لهذه الدورة"
              >
                <Award className="w-3 h-3" />
                <span>تقييم الدورة (Evaluate)</span>
              </button>
            ) : (
              <button
                onClick={() => setSelectedCourseForEval(row)}
                className="px-2 py-0.5 bg-white hover:bg-[#F3F2F1] text-[#0078D4] border border-[#0078D4] text-[11px] font-medium transition-colors"
                title="عرض وتعديل التقييم السابق"
              >
                عرض التقييم
              </button>
            )}
          </div>
        )}
      />

      {/* FastTab: Professional Development Plan */}
      <D365FastTab
        title="خطة التطوير المهني ومسار الشهادات التخصصية (Learning Path)"
        summary="شهادات مايكروسوفت والسحابة"
        defaultExpanded={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#FAF9F8] p-3 border border-[#EDEBE9] text-xs">
          <div className="p-2.5 bg-white border border-[#D1D1D1]">
            <div className="font-bold text-[#0078D4]">Microsoft Certified: D365 F&O Developer</div>
            <div className="text-[11px] text-[#605E5C] mt-1">كود الاختبار: MB-500</div>
            <div className="text-[10px] text-[#107C41] mt-1 font-semibold">مكتمل ومعتمد في سجل الكفاءات</div>
          </div>
          <div className="p-2.5 bg-white border border-[#D1D1D1]">
            <div className="font-bold text-[#0078D4]">Microsoft Certified: Azure AI Engineer</div>
            <div className="text-[11px] text-[#605E5C] mt-1">كود الاختبار: AI-102</div>
            <div className="text-[10px] text-[#107C41] mt-1 font-semibold">مكتمل ومعتمد في سجل الكفاءات</div>
          </div>
          <div className="p-2.5 bg-white border border-[#D1D1D1]">
            <div className="font-bold text-[#323130]">Microsoft Certified: Power Platform Solution Architect</div>
            <div className="text-[11px] text-[#605E5C] mt-1">كود الاختبار: PL-600</div>
            <div className="text-[10px] text-[#0078D4] mt-1 font-semibold">مدرج في خطة الربع الرابع 2026</div>
          </div>
        </div>
      </D365FastTab>

      {/* Evaluation Dialog */}
      <TrainingEvaluationDialog
        isOpen={!!selectedCourseForEval}
        onClose={() => setSelectedCourseForEval(null)}
        course={selectedCourseForEval}
        onSuccess={() => {
          setSelectedCourseForEval(null);
          onEvaluationSuccess();
        }}
      />
    </div>
  );
};
