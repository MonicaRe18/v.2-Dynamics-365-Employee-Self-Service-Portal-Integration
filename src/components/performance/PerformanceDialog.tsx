import React from 'react';
import { Star, Award, Calendar, CheckCircle2, TrendingUp, User } from 'lucide-react';
import { D365Dialog } from '../common/D365Dialog';
import { PerformanceEvaluation } from '../../types/d365.types';
import { exportToCsv } from '../../utils/exportUtils';

interface PerformanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  evaluations: PerformanceEvaluation[];
}

export const PerformanceDialog: React.FC<PerformanceDialogProps> = ({
  isOpen,
  onClose,
  evaluations,
}) => {
  const handleExport = () => {
    exportToCsv(
      'Performance_Evaluations',
      evaluations.map((e) => ({
        'سنة التقييم': e.year,
        'دورة التقييم': e.cycle,
        'التقدير العام': e.rating,
        'درجة الجدارات': `${e.competenciesScore}%`,
        'الأهداف المحققة': `${e.goalsAchievedCount} من ${e.totalGoalsCount}`,
        'اسم المقيم': e.reviewerName,
        'تاريخ الاعتماد': e.reviewDate,
        'الحالة': e.status,
      }))
    );
  };

  return (
    <D365Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="تقييمات الأداء السنوية"
      subtitle="سجل نتائج تقييم الأداء والجدارات الوظيفية - Microsoft Dynamics 365 Human Resources"
      maxWidth="3xl"
      secondaryActionLabel="إغلاق"
      onSecondaryAction={onClose}
      tertiaryActionLabel="تصدير إلى Excel"
      onTertiaryAction={handleExport}
    >
      <div className="space-y-4">
        <div className="bg-white border border-[#D1D1D1] overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1] text-[#323130] font-semibold">
                <th className="p-2.5 border-l border-[#D1D1D1]">سنة التقييم</th>
                <th className="p-2.5 border-l border-[#D1D1D1]">دورة التقييم</th>
                <th className="p-2.5 border-l border-[#D1D1D1]">التقدير العام</th>
                <th className="p-2.5 border-l border-[#D1D1D1]">نسبة الجدارات</th>
                <th className="p-2.5 border-l border-[#D1D1D1]">الأهداف المحققة</th>
                <th className="p-2.5">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((item) => (
                <tr key={item.id} className="border-b border-[#EDEBE9] hover:bg-[#FAF9F8]">
                  <td className="p-2.5 border-l border-[#EDEBE9] font-mono font-bold text-[#0078D4]">
                    {item.year}
                  </td>
                  <td className="p-2.5 border-l border-[#EDEBE9] font-medium text-[#323130]">
                    {item.cycle}
                  </td>
                  <td className="p-2.5 border-l border-[#EDEBE9] text-[#107C41] font-bold">
                    {item.rating}
                  </td>
                  <td className="p-2.5 border-l border-[#EDEBE9] font-mono text-[#323130]">
                    {item.competenciesScore}%
                  </td>
                  <td className="p-2.5 border-l border-[#EDEBE9] font-mono text-[#323130]">
                    {item.goalsAchievedCount} / {item.totalGoalsCount}
                  </td>
                  <td className="p-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-[#DFF6DD] text-[#107C41] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Evaluation Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {evaluations.map((item) => (
            <div key={item.id} className="p-3 bg-[#F9F9F9] border border-[#D1D1D1] space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#EDEBE9] pb-1.5">
                <span className="font-bold text-[#0078D4]">التقييم السنوي {item.year}</span>
                <span className="font-mono text-[#605E5C]">{item.reviewDate}</span>
              </div>
              <div className="text-[#323130]">
                المقيم: <span className="font-semibold">{item.reviewerName}</span>
              </div>
              <div className="text-[#323130]">
                النتيجة النهائية: <span className="font-bold text-[#107C41]">{item.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </D365Dialog>
  );
};
