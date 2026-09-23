import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Send, X } from 'lucide-react';
import { D365Dialog } from '../common/D365Dialog';
import { TrainingCourse, EvaluationRating } from '../../types/d365.types';
import { d365Service } from '../../services/d365Service';

interface TrainingEvaluationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: TrainingCourse | null;
  onSuccess: () => void;
}

const RATING_COLUMNS: EvaluationRating[] = ['ممتاز', 'جيد جداً', 'جيد', 'متوسط', 'ضعيف'];

interface CriterionItem {
  id: string;
  statement: string;
}

const STATEMENTS: CriterionItem[] = [
  { id: 'relevance', statement: 'مدي ملاءمة محتوي البرنامج لاحتياجاتك التدريبية' },
  { id: 'trainerCompetence', statement: 'مدي كفاءة المدرب في توصيل المادة التدريبية' },
  { id: 'timeSufficiency', statement: 'مدي كفاية الوقت المخصص للبرنامج' },
  { id: 'organization', statement: 'التنظيم العام والتجهيزات' },
  { id: 'overallBenefit', statement: 'الاستفادة الكلية من الدورة التدريبية' },
];

export const TrainingEvaluationDialog: React.FC<TrainingEvaluationDialogProps> = ({
  isOpen,
  onClose,
  course,
  onSuccess,
}) => {
  const [ratings, setRatings] = useState<Record<string, EvaluationRating>>({
    relevance: 'ممتاز',
    trainerCompetence: 'ممتاز',
    timeSufficiency: 'جيد جداً',
    organization: 'ممتاز',
    overallBenefit: 'ممتاز',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!course) return null;

  const handleSelect = (statementId: string, rating: EvaluationRating) => {
    setRatings((prev) => ({ ...prev, [statementId]: rating }));
  };

  const handleSend = async () => {
    // Check all rated
    for (const item of STATEMENTS) {
      if (!ratings[item.id]) {
        setErrorMessage(`يرجى تحديد التقييم للبند: ${item.statement}`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await d365Service.submitTrainingEvaluation({
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        trainerKnowledge: ratings.trainerCompetence || 'ممتاز',
        trainerEngagement: ratings.trainerCompetence || 'ممتاز',
        courseContent: ratings.relevance || 'ممتاز',
        overallProgramEvaluation: ratings.overallBenefit || 'ممتاز',
        programDuration: ratings.timeSufficiency || 'جيد جداً',
        positiveFeedback: 'برنامج تدريبي متميز ومفيد جداً لمنظومة العمل الحكومي الرقمي.',
      });

      setIsSubmitting(false);

      if (response.isSuccess) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(response.error || 'فشل في إرسال تقييم الدورة إلى خادم Dynamics 365.');
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'فشل غير متوقع أثناء إرسال التقييم');
    }
  };

  return (
    <D365Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`تقييم دورة: ${course.courseTitle}`}
      subtitle={`معرف الدورة: ${course.courseId} - Microsoft Dynamics 365 Training Evaluation`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-2.5 bg-[#FDF3F2] border border-[#A80000] text-[#A80000] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="text-xs text-[#605E5C]">
          يرجى تقييم بنود البرنامج التدريبي باختيار التقدير المناسب لكل بيان من البيانات التالية:
        </div>

        {/* Matrix Table: Matching Screenshot 6 */}
        <div className="bg-white border border-[#D1D1D1] overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1] text-[#323130] font-semibold">
                <th className="p-3 border-l border-[#D1D1D1]">البيان</th>
                {RATING_COLUMNS.map((col) => (
                  <th key={col} className="p-3 border-l border-[#D1D1D1] text-center w-24">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STATEMENTS.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-b border-[#EDEBE9] ${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
                  } hover:bg-[#F3F2F1]`}
                >
                  <td className="p-3 border-l border-[#EDEBE9] text-[#323130] font-medium">
                    {item.statement}
                  </td>
                  {RATING_COLUMNS.map((col) => (
                    <td key={col} className="p-3 border-l border-[#EDEBE9] text-center">
                      <input
                        type="radio"
                        name={`rating-${item.id}`}
                        checked={ratings[item.id] === col}
                        onChange={() => handleSelect(item.id, col)}
                        className="w-4 h-4 text-[#0078D4] border-[#8A8886] focus:ring-[#0078D4] cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Buttons: Matching Screenshot 6: [إرسال] [إلغاء] */}
        <div className="pt-2 flex items-center justify-start gap-2 border-t border-[#EDEBE9]">
          <button
            type="button"
            onClick={handleSend}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white text-xs font-semibold border border-[#0078D4] transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-1.5 bg-white hover:bg-[#F3F2F1] text-[#605E5C] text-xs border border-[#D1D1D1] transition-colors"
          >
            <span>إلغاء</span>
          </button>
        </div>
      </div>
    </D365Dialog>
  );
};
