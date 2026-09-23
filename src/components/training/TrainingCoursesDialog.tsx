import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import { D365Dialog } from '../common/D365Dialog';
import { TrainingCourse } from '../../types/d365.types';
import { TrainingEvaluationDialog } from './TrainingEvaluationDialog';
import { exportToCsv } from '../../utils/exportUtils';

interface TrainingCoursesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courses: TrainingCourse[];
  onRefresh?: () => void;
}

const RATING_HEADERS = ['ممتاز', 'جيد جداً', 'جيد', 'متوسط', 'ضعيف'];

export const TrainingCoursesDialog: React.FC<TrainingCoursesDialogProps> = ({
  isOpen,
  onClose,
  courses,
  onRefresh,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(courses[0] || null);
  const [isImmediateEvalOpen, setIsImmediateEvalOpen] = useState(true);
  const [is3MonthsEvalOpen, setIs3MonthsEvalOpen] = useState(true);
  const [evalTargetCourse, setEvalTargetCourse] = useState<TrainingCourse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExport = () => {
    exportToCsv(
      'Employee_Training_Courses',
      courses.map((c) => ({
        'عنوان الدورة': c.courseTitle,
        'معرف الدورة': c.courseId,
        'تاريخ البدء': c.startDate,
        'تاريخ الانتهاء': c.endDate,
        'التقييم العام': c.generalEvaluationScore || '-',
        'تقييم بعد 3 شهور': c.evaluationAfter3MonthsScore || '-',
        'حالة الحضور': c.attendanceStatusAr,
      }))
    );
    setToastMessage('تم تصدير سجل الدورات التدريبية إلى Excel بنجاح.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleEvaluationSuccess = () => {
    if (onRefresh) onRefresh();
    setToastMessage('تم حفظ وإرسال تقييم الدورة التدريبية بنجاح.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <>
      <D365Dialog
        isOpen={isOpen}
        onClose={onClose}
        title="اختصاص الدورات التدريبية"
        subtitle="سجل البرامج والدورات التدريبية المعتمدة - Microsoft Dynamics 365 Human Resources"
        maxWidth="4xl"
        secondaryActionLabel="إغلاق"
        onSecondaryAction={onClose}
        tertiaryActionLabel="تصدير إلى Excel"
        onTertiaryAction={handleExport}
      >
        <div className="space-y-4">
          {toastMessage && (
            <div className="p-2.5 bg-[#DFF6DD] border border-[#107C41] text-[#107C41] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-xs hover:underline font-bold">
                إغلاق
              </button>
            </div>
          )}

          {/* Main Table: Matching Screenshot 5 */}
          <div className="bg-white border border-[#D1D1D1] overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1] text-[#323130] font-semibold">
                  <th className="p-2.5 border-l border-[#D1D1D1]">عنوان الدورة التدريبية</th>
                  <th className="p-2.5 border-l border-[#D1D1D1]">معرف الدورة</th>
                  <th className="p-2.5 border-l border-[#D1D1D1]">تاريخ البدء</th>
                  <th className="p-2.5 border-l border-[#D1D1D1]">تاريخ الانتهاء</th>
                  <th className="p-2.5 border-l border-[#D1D1D1]">التقييم العام</th>
                  <th className="p-2.5 border-l border-[#D1D1D1]">التقييم العام للموظف بعد 3 شهور</th>
                  <th className="p-2.5 text-center w-28">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const isSelected = selectedCourse?.id === course.id;
                  const isPending = course.generalEvaluationStatus === 'PendingEvaluation';
                  return (
                    <tr
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className={`border-b border-[#EDEBE9] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#EDEBE9]' : 'hover:bg-[#FAF9F8]'
                      }`}
                    >
                      <td className="p-2.5 border-l border-[#EDEBE9] font-semibold text-[#323130]">
                        {course.courseTitle}
                      </td>
                      <td className="p-2.5 border-l border-[#EDEBE9] font-mono text-[#0078D4]">
                        {course.courseId}
                      </td>
                      <td className="p-2.5 border-l border-[#EDEBE9] font-mono text-[#605E5C]">
                        {course.startDate}
                      </td>
                      <td className="p-2.5 border-l border-[#EDEBE9] font-mono text-[#605E5C]">
                        {course.endDate}
                      </td>
                      <td className="p-2.5 border-l border-[#EDEBE9] text-[#323130]">
                        {course.generalEvaluationScore || '-'}
                      </td>
                      <td className="p-2.5 border-l border-[#EDEBE9] text-[#323130]">
                        {course.evaluationAfter3MonthsScore || '-'}
                      </td>
                      <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => setEvalTargetCourse(course)}
                            className="px-2.5 py-1 bg-[#0078D4] hover:bg-[#106EBE] text-white text-[11px] font-semibold transition-colors"
                          >
                            تقييم الدورة
                          </button>
                        ) : (
                          <span className="inline-block px-2 py-1 text-[11px] bg-[#DFF6DD] text-[#107C41] font-semibold">
                            تم التقييم
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Accordion 1: التقييم العام للبرنامج بعد الدورة مباشرة (Matching Screenshot 5) */}
          <div className="bg-white border border-[#D1D1D1]">
            <button
              type="button"
              onClick={() => setIsImmediateEvalOpen(!isImmediateEvalOpen)}
              className="w-full px-3 py-2 bg-[#F3F2F1] border-b border-[#EDEBE9] flex items-center justify-between text-xs font-bold text-[#323130] hover:bg-[#EDEBE9] transition-colors"
            >
              <span>التقييم العام للبرنامج بعد الدورة مباشرة</span>
              {isImmediateEvalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isImmediateEvalOpen && (
              <div className="p-3">
                <table className="w-full text-xs text-right border-collapse border border-[#D1D1D1]">
                  <thead>
                    <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1] text-[#323130] font-semibold">
                      <th className="p-2.5 border-l border-[#D1D1D1]">البيان</th>
                      {RATING_HEADERS.map((h) => (
                        <th key={h} className="p-2.5 border-l border-[#D1D1D1] text-center w-20">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { statement: 'مدي ملاءمة محتوي البرنامج لاحتياجاتك التدريبية', selected: 'ممتاز' },
                      { statement: 'مدي كفاءة المدرب في توصيل المادة التدريبية', selected: 'ممتاز' },
                      { statement: 'مدي كفاية الوقت المخصص للبرنامج', selected: 'جيد جداً' },
                      { statement: 'التنظيم العام والتجهيزات', selected: 'ممتاز' },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-[#EDEBE9] hover:bg-[#FAFAFA]">
                        <td className="p-2.5 border-l border-[#EDEBE9] font-medium text-[#323130]">
                          {row.statement}
                        </td>
                        {RATING_HEADERS.map((h) => (
                          <td key={h} className="p-2.5 border-l border-[#EDEBE9] text-center">
                            <input
                              type="radio"
                              readOnly
                              checked={row.selected === h}
                              className="w-3.5 h-3.5 text-[#0078D4]"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Accordion 2: قياس أثر البرنامج التدريبي على الموظف بعد 3 شهور من الحصول على الدورة التدريبية (Matching Screenshot 5) */}
          <div className="bg-white border border-[#D1D1D1]">
            <button
              type="button"
              onClick={() => setIs3MonthsEvalOpen(!is3MonthsEvalOpen)}
              className="w-full px-3 py-2 bg-[#F3F2F1] border-b border-[#EDEBE9] flex items-center justify-between text-xs font-bold text-[#323130] hover:bg-[#EDEBE9] transition-colors"
            >
              <span>قياس أثر البرنامج التدريبي على الموظف بعد 3 شهور من الحصول على الدورة التدريبية</span>
              {is3MonthsEvalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {is3MonthsEvalOpen && (
              <div className="p-3">
                <table className="w-full text-xs text-right border-collapse border border-[#D1D1D1]">
                  <thead>
                    <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1] text-[#323130] font-semibold">
                      <th className="p-2.5 border-l border-[#D1D1D1]">البيان</th>
                      {RATING_HEADERS.map((h) => (
                        <th key={h} className="p-2.5 border-l border-[#D1D1D1] text-center w-20">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { statement: 'مدي رغبة الموظف في التطوير ونقل المعرفة للزملاء', selected: 'جيد جداً' },
                      { statement: 'تحسن كفاءة وسرعة إنجاز المهام الوظيفية المرتبطة بالدورة', selected: 'ممتاز' },
                      { statement: 'القدرة على حل المشكلات التقنية وتطبيق الحلول الرقمية', selected: 'جيد جداً' },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-[#EDEBE9] hover:bg-[#FAFAFA]">
                        <td className="p-2.5 border-l border-[#EDEBE9] font-medium text-[#323130]">
                          {row.statement}
                        </td>
                        {RATING_HEADERS.map((h) => (
                          <td key={h} className="p-2.5 border-l border-[#EDEBE9] text-center">
                            <input
                              type="radio"
                              readOnly
                              checked={row.selected === h}
                              className="w-3.5 h-3.5 text-[#0078D4]"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </D365Dialog>

      {/* Course Evaluation Modal (Screenshot 6) */}
      <TrainingEvaluationDialog
        isOpen={!!evalTargetCourse}
        onClose={() => setEvalTargetCourse(null)}
        course={evalTargetCourse}
        onSuccess={handleEvaluationSuccess}
      />
    </>
  );
};
