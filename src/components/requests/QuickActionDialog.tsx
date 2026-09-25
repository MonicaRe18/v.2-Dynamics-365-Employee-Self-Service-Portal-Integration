import React, { useEffect, useState } from 'react';
import { Send, CheckCircle2, AlertCircle, FileText, Upload, Calendar, X } from 'lucide-react';
import { D365Dialog } from '../common/D365Dialog';
import { d365Service } from '../../services/d365Service';
import { Employee, UnifiedRequestItem } from '../../types/d365.types';
import { reassignmentApi } from '../../services/api/reassignmentApi';

export type QuickActionType =
  | 'PERMISSION'
  | 'SECONDMENT'
  | 'LOAN'
  | 'TRANSFER'
  | 'FINANCIAL_DISCLOSURE'
  | 'DRUG_TEST';

interface QuickActionConfig {
  title: string;
  subtitle: string;
  typeLabel: string;
  dateLabel: string;
  reasonLabel: string;
}

const ACTION_CONFIGS: Record<QuickActionType, QuickActionConfig> = {
  PERMISSION: {
    title: 'تقديم طلب إذن غياب / انصراف',
    subtitle: 'طلب إذن شخصي أو مهمة عمل رسمية - Microsoft Dynamics 365 Human Resources',
    typeLabel: 'نوع الإذن',
    dateLabel: 'تاريخ الإذن المطلوب',
    reasonLabel: 'مبررات وأسباب طلب الإذن',
  },
  SECONDMENT: {
    title: 'تقديم طلب ندب وظيفي',
    subtitle: 'إرسال طلب الندب الوظيفي إلى الموارد البشرية',
    typeLabel: 'عنوان جهة الندب',
    dateLabel: 'تاريخ بدء الندب المطلوب',
    reasonLabel: 'ملاحظات',
  },
  LOAN: {
    title: 'تقديم طلب إعارة وظيفية',
    subtitle: 'طلب إعارة داخلية أو خارجية - Microsoft Dynamics 365 Human Resources',
    typeLabel: 'الجهة المستعيرة',
    dateLabel: 'تاريخ بدء فترة الإعارة',
    reasonLabel: 'تفاصيل ومبررات طلب الإعارة',
  },
  TRANSFER: {
    title: 'تقديم طلب نقل وظيفي',
    subtitle: 'طلب نقل وظيفي بين الإدارات أو الفروع - Microsoft Dynamics 365 Human Resources',
    typeLabel: 'الإدارة أو الجهة المطلوب النقل إليها',
    dateLabel: 'التاريخ المقترح للنقل',
    reasonLabel: 'أسباب ومبررات طلب النقل الوظيفي',
  },
  FINANCIAL_DISCLOSURE: {
    title: 'إقرارات الذمة المالية الدورية',
    subtitle: 'تسجيل وتحديث إقرار الذمة المالية الإلزامي - الرقابة الإدارية والحوكمة',
    typeLabel: 'نوع إقرار الذمة المالية',
    dateLabel: 'تاريخ سريان الإقرار',
    reasonLabel: 'إيضاحات وبيانات الذمة المالية والممتلكات',
  },
  DRUG_TEST: {
    title: 'سجل وفحص الكشف عن المخدرات الدوري',
    subtitle: 'سجل التحاليل الطبية الدورية الإلزامية - صندوق مكافحة وعلاج الإدمان',
    typeLabel: 'الجهة الطبية المعتمدة للتحليل',
    dateLabel: 'تاريخ إجراء الفحص الطبي',
    reasonLabel: 'رقم التقرير الطبي ونتيجة الفحص المعتمد',
  },
};

interface QuickActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: QuickActionType | null;
  employee: Employee;
  onSuccess: (message: string) => void;
}

export const QuickActionDialog: React.FC<QuickActionDialogProps> = ({
  isOpen,
  onClose,
  actionType,
  employee,
  onSuccess,
}) => {
  const [requestDate, setRequestDate] = useState('');
  const [targetEntity, setTargetEntity] = useState('');
  const [notes, setNotes] = useState('');
  const [reassignmentType, setReassignmentType] = useState(0);
  const [newCityKey, setNewCityKey] = useState('');
  const [cities, setCities] = useState<{ cityKey: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || actionType !== 'SECONDMENT') return;
    let current = true;
    reassignmentApi.getCities().then((result) => {
      if (current && result.isSuccess && result.data) setCities(result.data);
    });
    return () => { current = false; };
  }, [isOpen, actionType]);

  if (!actionType) return null;
  const config = ACTION_CONFIGS[actionType];

  const handleSubmit = async () => {
    if (!requestDate) {
      setErrorMessage(`يرجى إدخال ${config.dateLabel}`);
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    if (actionType === 'SECONDMENT') {
      try {
        const result = await reassignmentApi.submit(requestDate, targetEntity.trim(), reassignmentType, newCityKey);
        if (!result.isSuccess || !result.data?.submitted || !result.data.assignmentId) {
          setErrorMessage(result.error || 'تعذر إرسال طلب الندب إلى Dynamics 365.');
          return;
        }
        onSuccess(`تم إرسال طلب الندب الوظيفي برقم ${result.data.assignmentId}.`);
        onClose();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'تعذر إرسال طلب الندب إلى Dynamics 365.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!targetEntity.trim()) {
      setErrorMessage(`يرجى إدخال ${config.typeLabel}`);
      setIsSubmitting(false);
      return;
    }
    if (!notes.trim()) {
      setErrorMessage(`يرجى كتابة ${config.reasonLabel}`);
      setIsSubmitting(false);
      return;
    }

    const categoryMap: Record<QuickActionType, UnifiedRequestItem['category']> = {
      PERMISSION: 'PERMISSION',
      SECONDMENT: 'SECONDMENT',
      LOAN: 'LOAN',
      TRANSFER: 'TRANSFER',
      FINANCIAL_DISCLOSURE: 'MONITORING',
      DRUG_TEST: 'MONITORING',
    };

    const typeTitleMap: Record<QuickActionType, string> = {
      PERMISSION: 'طلب إذن غياب / انصراف',
      SECONDMENT: 'طلب ندب وظيفي',
      LOAN: 'طلب سلفة مالية',
      TRANSFER: 'طلب نقل وظيفي',
      FINANCIAL_DISCLOSURE: 'طلب إقرار ذمة مالية',
      DRUG_TEST: 'طلب فحص كشف مخدرات',
    };

    d365Service.submitGeneralRequest(
      `${typeTitleMap[actionType]} (${targetEntity})`,
      categoryMap[actionType],
      notes,
      undefined,
      requestDate
    );

    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(`تم إرسال ${config.title} بنجاح إلى سير عمل الموارد البشرية.`);
      onClose();
    }, 400);
  };

  return (
    <D365Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      subtitle={config.subtitle}
      maxWidth="md"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-2.5 bg-[#FDF3F2] border border-[#A80000] text-[#A80000] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          {actionType === 'SECONDMENT' && (
            <div className="grid grid-cols-2 gap-2 bg-[#F9F9F9] border border-[#EDEBE9] p-2 text-xs">
              <div><span className="text-[#605E5C] block">الموظف</span><strong>{employee.name}</strong></div>
              <div><span className="text-[#605E5C] block">الوظيفة</span><strong>{employee.jobTitle}</strong></div>
            </div>
          )}
          {actionType !== 'SECONDMENT' && <div>
            <label className="block text-xs font-semibold text-[#323130] mb-1">
              {config.typeLabel} <span className="text-[#A80000]">*</span>
            </label>
            <input
              type="text"
              value={targetEntity}
              onChange={(e) => setTargetEntity(e.target.value)}
              placeholder={`أدخل ${config.typeLabel}...`}
              className="w-full h-8 px-2 bg-white text-xs text-[#323130] border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] outline-none"
            />
          </div>}

          <div>
            <label className="block text-xs font-semibold text-[#323130] mb-1">
              {config.dateLabel} <span className="text-[#A80000]">*</span>
            </label>
            <div className="flex items-center gap-2 bg-white px-2 py-1 border border-[#8A8886] focus-within:border-[#0078D4]">
              <Calendar className="w-4 h-4 text-[#0078D4]" />
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="w-full bg-transparent text-xs text-[#323130] outline-none font-mono"
              />
            </div>
          </div>

          {actionType === 'SECONDMENT' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#323130] mb-1">عنوان جهة الندب</label>
                <input type="text" value={targetEntity} onChange={(e) => setTargetEntity(e.target.value)}
                  className="w-full h-8 px-2 bg-white text-xs border border-[#8A8886] focus:border-[#0078D4] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#323130] mb-1">نوع الندب</label>
                <select value={reassignmentType} onChange={(e) => setReassignmentType(Number(e.target.value))}
                  className="w-full h-8 px-2 bg-white text-xs border border-[#8A8886] focus:border-[#0078D4] outline-none">
                  <option value={0}>ندب داخلي</option>
                  <option value={1}>ندب خارجي</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#323130] mb-1">المدينة الجديدة (مصر)</label>
                <select value={newCityKey} onChange={(e) => setNewCityKey(e.target.value)}
                  className="w-full h-8 px-2 bg-white text-xs border border-[#8A8886] focus:border-[#0078D4] outline-none">
                  <option value="">بدون مدينة محددة</option>
                  {cities.map((city) => <option key={city.cityKey} value={city.cityKey}>{city.name}</option>)}
                </select>
              </div>
            </>
          )}
          {actionType !== 'SECONDMENT' && <div>
            <label className="block text-xs font-semibold text-[#323130] mb-1">
              {config.reasonLabel} <span className="text-[#A80000]">*</span>
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب التفاصيل والمبررات هنا..."
              className="w-full p-2 text-xs bg-white text-[#323130] border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] outline-none"
            ></textarea>
          </div>}
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-start gap-2 border-t border-[#EDEBE9]">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white text-xs font-semibold border border-[#0078D4] transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}</span>
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
