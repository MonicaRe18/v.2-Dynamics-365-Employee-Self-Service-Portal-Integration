import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Send,
  Save,
  X
} from 'lucide-react';
import { D365Dialog } from '../common/D365Dialog';
import { LeaveBalance, DelegatedEmployee, LeaveTypeCode } from '../../types/d365.types';
import { d365Service } from '../../services/d365Service';
import { authService } from '../../services/authService';

interface LeaveRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (requestId: string) => void;
  leaveBalances: LeaveBalance[];
  delegatedEmployees: DelegatedEmployee[];
  initialLeaveType?: LeaveTypeCode;
}

export const LeaveRequestDialog: React.FC<LeaveRequestDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leaveBalances,
  delegatedEmployees,
  initialLeaveType = 'ANNUAL',
}) => {
  const [leaveTypeCode, setLeaveTypeCode] = useState<LeaveTypeCode>(initialLeaveType);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [delegatedEmployeeId, setDelegatedEmployeeId] = useState(
    ''
  );
  const [socialInsuranceOption, setSocialInsuranceOption] = useState<string>('yes');
  const [takafulFundOption, setTakafulFundOption] = useState<string>('yes');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<Array<{ id: string; fileName: string; fileType: string; uploadDate: string }>>([]);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const [isBalancesOpen, setIsBalancesOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStartDate('');
      setEndDate('');
      setErrorMessage(null);
      if (initialLeaveType) {
        setLeaveTypeCode(initialLeaveType);
      }
    }
  }, [isOpen, initialLeaveType]);

  useEffect(() => {
    if (!delegatedEmployees.some((employee) => employee.id === delegatedEmployeeId)) {
      setDelegatedEmployeeId('');
    }
  }, [delegatedEmployees, delegatedEmployeeId]);

  const selectedBalance = leaveBalances.find((b) => b.leaveTypeCode === leaveTypeCode) || leaveBalances[0];
  const availableBalance = selectedBalance ? selectedBalance.currentBalance : 0;

  const calculateDays = (): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    let days = 0;
    for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
      if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) days++;
    }
    return days;
  };

  const requestedDays = calculateDays();
  const remainingBalance = availableBalance - requestedDays;
  const isBalanceExceeded = remainingBalance < 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAtt = {
        id: `att-${Date.now()}`,
        fileName: file.name,
        fileType: file.type.includes('pdf') ? 'مستند PDF' : 'مرفق داعم',
        uploadDate: new Date().toISOString().split('T')[0],
      };
      setAttachments([...attachments, newAtt]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!startDate || !endDate) {
      setErrorMessage('يرجى تحديد تاريخ البدء وتاريخ الانتهاء للإجازة.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setErrorMessage('تاريخ الانتهاء يجب ألا يسبق تاريخ البدء.');
      return;
    }
    if (startDate < new Date().toISOString().slice(0, 10) || requestedDays === 0) {
      setErrorMessage('اختر تاريخاً حالياً أو مستقبلياً يتضمن يوم عمل واحداً على الأقل.');
      return;
    }
    if (selectedBalance?.unit !== 'Days' && selectedBalance?.unit !== 'أيام') {
      setErrorMessage('يمكن إرسال أنواع الإجازة المحسوبة بالأيام فقط حالياً.');
      return;
    }
    if (attachments.length > 0) {
      setErrorMessage('رفع المرفقات إلى Dynamics غير متاح حالياً؛ احذفها قبل الإرسال.');
      return;
    }
    if (socialInsuranceOption !== 'yes' || takafulFundOption !== 'yes') {
      setErrorMessage('خيارات التأمين غير مرتبطة بـ Dynamics حالياً؛ اتركها على الإعدادات الافتراضية.');
      return;
    }
    if (!isDraft && isBalanceExceeded) {
      setErrorMessage(`الرصيد المتاح (${availableBalance}) لا يكفي لتغطية الأيام المطلوبة (${requestedDays}).`);
      return;
    }
    if (!delegatedEmployeeId || !delegatedEmployees.some((employee) => employee.id === delegatedEmployeeId)) {
      setErrorMessage('يرجى اختيار القائم بالأعمال من القائمة.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const chosenDelegated = delegatedEmployees.find((e) => e.id === delegatedEmployeeId);
    const currentUser = authService.getCurrentUser();

    try {
      const response = await d365Service.submitLeaveRequest({
        employeeId: currentUser?.id || '',
        employeeName: currentUser?.name || '',
        leaveTypeCode: leaveTypeCode,
        leaveTypeTitle: selectedBalance?.leaveTypeTitle || 'إجازة اعتيادية',
        startDate: startDate,
        endDate: endDate,
        requestedDays: requestedDays,
        saveAsDraft: isDraft,
        delegatedEmployeeId: chosenDelegated?.id || '',
        delegatedEmployeeName: chosenDelegated?.name || '',
        delegatedEmployeeTitle: chosenDelegated?.jobTitle || '',
        socialInsuranceOption: socialInsuranceOption === 'yes',
        healthInsuranceOption: takafulFundOption === 'yes',
        attachments: attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileSize: '350 KB',
          uploadDate: a.uploadDate,
        })),
        notes: notes || (isDraft ? 'مسودة طلب إجازة' : 'طلب إجازة رسمي'),
        d365SyncStatus: 'Pending',
      });

      setIsSubmitting(false);

      if (response.isSuccess && response.data) {
        onSuccess(response.data.id);
        onClose();
      } else {
        setErrorMessage(response.error || 'فشل في إرسال طلب الإجازة إلى Dynamics 365. الخادم لم يستجب بنجاح.');
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'فشل غير متوقع أثناء إرسال طلب الإجازة');
    }
  };

  return (
    <D365Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`طلب الإجازة لـ ${authService.getCurrentUser()?.name || 'الموظف'}`}
      subtitle="بوابة الخدمة الذاتية للعاملين - Microsoft Dynamics 365 Human Resources"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        <div className="p-2.5 bg-[#FFF4CE] border border-[#E1C24B] text-[#323130] text-xs">
          رقم القائم بالأعمال يُحفظ مؤقتاً في تعليق الطلب في Dynamics، وليس في حقل WorkerRecive.
          المرفقات وخيارات التأمين غير مرتبطة حالياً؛ اترك خيارات التأمين على نعم ولا تضف مرفقات.
        </div>
        {errorMessage && (
          <div className="p-2.5 bg-[#FDF3F2] border border-[#A80000] text-[#A80000] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Top Form Fields (Matching Screenshot 2) */}
        <div className="bg-white border border-[#D1D1D1] p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* نوع الإجازة */}
            <div>
              <label htmlFor="leaveTypeSelect" className="block text-xs font-semibold text-[#323130] mb-1">
                نوع الإجازة <span className="text-[#A80000]">*</span>
              </label>
              <select
                id="leaveTypeSelect"
                value={leaveTypeCode}
                onChange={(e) => setLeaveTypeCode(e.target.value as LeaveTypeCode)}
                className="w-full h-8 px-2 bg-white text-xs text-[#323130] border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] outline-none"
              >
                {leaveBalances.map((b) => (
                  <option key={b.leaveTypeCode} value={b.leaveTypeCode}>
                    {b.leaveTypeTitle} (الرصيد: {b.currentBalance.toFixed(2)} {b.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* القائم بالأعمال خلال الفترة */}
            <div>
              <label htmlFor="delegatedSelect" className="block text-xs font-semibold text-[#323130] mb-1">
                القائم بالأعمال خلال الفترة <span className="text-[#A80000]">*</span>
              </label>
              <select
                id="delegatedSelect"
                value={delegatedEmployeeId}
                onChange={(e) => setDelegatedEmployeeId(e.target.value)}
                className="w-full h-8 px-2 bg-white text-xs text-[#323130] border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] outline-none"
              >
                <option value="">{delegatedEmployees.length ? 'اختر القائم بالأعمال' : 'لا يوجد موظفون مؤهلون في نفس الإدارة'}</option>
                {delegatedEmployees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} - {e.jobTitle}
                  </option>
                ))}
              </select>
            </div>

            {/* اشتراك التأمين الاجتماعي */}
            <div>
              <label htmlFor="socialInsuranceSelect" className="block text-xs font-semibold text-[#323130] mb-1">
                اشتراك التأمين الاجتماعي
              </label>
              <select
                id="socialInsuranceSelect"
                value={socialInsuranceOption}
                onChange={(e) => setSocialInsuranceOption(e.target.value)}
                className="w-full h-8 px-2 bg-white text-xs text-[#323130] border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] outline-none"
              >
                <option value="yes">نعم</option>
                <option value="no">لا</option>
              </select>
            </div>

            {/* اشتراك صندوق التكافل الاجتماعي */}
            <div>
              <label htmlFor="takafulFundSelect" className="block text-xs font-semibold text-[#323130] mb-1">
                اشتراك صندوق التكافل الاجتماعي
              </label>
              <select
                id="takafulFundSelect"
                value={takafulFundOption}
                onChange={(e) => setTakafulFundOption(e.target.value)}
                className="w-full h-8 px-2 bg-white text-xs text-[#323130] border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] outline-none"
              >
                <option value="yes">نعم</option>
                <option value="no">لا</option>
              </select>
            </div>

            {/* تاريخ البدء */}
            <div>
              <label htmlFor="leaveStartDate" className="block text-xs font-semibold text-[#323130] mb-1">
                تاريخ البدء <span className="text-[#A80000]">*</span>
              </label>
              <input
                id="leaveStartDate"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-8 px-2 bg-white text-xs text-[#323130] border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] outline-none font-mono"
              />
            </div>

            {/* تاريخ الانتهاء */}
            <div>
              <label htmlFor="leaveEndDate" className="block text-xs font-semibold text-[#323130] mb-1">
                تاريخ الانتهاء <span className="text-[#A80000]">*</span>
              </label>
              <input
                id="leaveEndDate"
                type="date"
                min={startDate || new Date().toISOString().slice(0, 10)}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-8 px-2 bg-white text-xs text-[#323130] border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] outline-none font-mono"
              />
            </div>
          </div>
        </div>

            {/* Accordion 1: المرفقات (Matching Screenshot 2) */}
        <div className="bg-white border border-[#D1D1D1]">
          <button
            type="button"
            aria-expanded={isAttachmentsOpen}
            aria-label={`المرفقات، ${isAttachmentsOpen ? 'موسع' : 'مطوي'}`}
            onClick={() => setIsAttachmentsOpen(!isAttachmentsOpen)}
            className="w-full px-3 py-2 bg-[#F3F2F1] border-b border-[#EDEBE9] flex items-center justify-between text-xs font-bold text-[#323130] hover:bg-[#EDEBE9] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <span>المرفقات</span>
            {isAttachmentsOpen ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          </button>

          {isAttachmentsOpen && (
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0078D4] text-white hover:bg-[#106EBE] text-xs font-semibold cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-[#0078D4]">
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>تحميل ملف جديد</span>
                  <input
                    type="file"
                    aria-label="تحميل ملف مرفق جديد"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-[#605E5C]">
                  الحد الأقصى لحجم الملف 10 ميجابايت (PDF, DOCX, PNG)
                </span>
              </div>

              {/* Table of attachments */}
              <div className="border border-[#D1D1D1] overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1] text-[#323130] font-semibold">
                      <th className="p-2 border-l border-[#D1D1D1]">اسم الملف</th>
                      <th className="p-2 border-l border-[#D1D1D1]">نوع المرفق</th>
                      <th className="p-2 border-l border-[#D1D1D1]">تاريخ الإضافة</th>
                      <th className="p-2 text-center w-20">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attachments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-[#605E5C]">
                          لا توجد مرفقات مضافة
                        </td>
                      </tr>
                    ) : (
                      attachments.map((att) => (
                        <tr key={att.id} className="border-b border-[#EDEBE9] hover:bg-[#FAF9F8]">
                          <td className="p-2 border-l border-[#EDEBE9] font-mono text-xs text-[#323130]">
                            {att.fileName}
                          </td>
                          <td className="p-2 border-l border-[#EDEBE9] text-[#605E5C]">
                            {att.fileType}
                          </td>
                          <td className="p-2 border-l border-[#EDEBE9] font-mono text-xs text-[#605E5C]">
                            {att.uploadDate}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeAttachment(att.id)}
                              className="p-1 text-[#A80000] hover:bg-[#FDF3F2] transition-colors focus-visible:ring-2 focus-visible:ring-[#A80000] focus-visible:outline-none"
                              title="حذف المرفق"
                              aria-label={`حذف المرفق ${att.fileName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 2: ملاحظات (Matching Screenshot 2) */}
        <div className="bg-white border border-[#D1D1D1]">
          <button
            type="button"
            aria-expanded={isNotesOpen}
            aria-label={`ملاحظات، ${isNotesOpen ? 'موسع' : 'مطوي'}`}
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            className="w-full px-3 py-2 bg-[#F3F2F1] border-b border-[#EDEBE9] flex items-center justify-between text-xs font-bold text-[#323130] hover:bg-[#EDEBE9] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <span>ملاحظات</span>
            {isNotesOpen ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          </button>

          {isNotesOpen && (
            <div className="p-3">
              <label htmlFor="leaveNotes" className="sr-only">ملاحظات طلب الإجازة</label>
              <textarea
                id="leaveNotes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أدخل أي ملاحظات إضافية بخصوص طلب الإجازة هنا..."
                className="w-full p-2 text-xs bg-white text-[#323130] placeholder-[#605E5C] border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] focus-visible:ring-2 focus-visible:ring-[#0078D4] outline-none"
              ></textarea>
            </div>
          )}
        </div>

        {/* Accordion 3: الأرصدة (Matching Screenshot 2 exactly) */}
        <div className="bg-white border border-[#D1D1D1]">
          <button
            type="button"
            aria-expanded={isBalancesOpen}
            aria-label={`الأرصدة، ${isBalancesOpen ? 'موسع' : 'مطوي'}`}
            onClick={() => setIsBalancesOpen(!isBalancesOpen)}
            className="w-full px-3 py-2 bg-[#F3F2F1] border-b border-[#EDEBE9] flex items-center justify-between text-xs font-bold text-[#323130] hover:bg-[#EDEBE9] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <span>الأرصدة</span>
            {isBalancesOpen ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          </button>

          {isBalancesOpen && (
            <div className="p-3">
              <div className="border border-[#D1D1D1] overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1] text-[#323130] font-semibold">
                      <th className="p-2 border-l border-[#D1D1D1]">النوع</th>
                      <th className="p-2 border-l border-[#D1D1D1]">الوحدة</th>
                      <th className="p-2 border-l border-[#D1D1D1]">متوفر</th>
                      <th className="p-2 border-l border-[#D1D1D1]">مطلوب</th>
                      <th className="p-2">المتبقي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#EDEBE9] hover:bg-[#FAF9F8]">
                      <td className="p-2 border-l border-[#EDEBE9] font-semibold text-[#323130]">
                        {selectedBalance?.leaveTypeTitle || 'اجازة اعتيادي'}
                      </td>
                      <td className="p-2 border-l border-[#EDEBE9] text-[#605E5C]">
                        {selectedBalance?.unit || 'أيام'}
                      </td>
                      <td className="p-2 border-l border-[#EDEBE9] font-mono text-[#0078D4] font-bold">
                        {availableBalance.toFixed(2)}
                      </td>
                      <td className="p-2 border-l border-[#EDEBE9] font-mono font-bold text-[#323130]">
                        {requestedDays.toFixed(2)}
                      </td>
                      <td
                        className={`p-2 font-mono font-bold ${
                          isBalanceExceeded ? 'text-[#A80000] bg-[#FDF3F2]' : 'text-[#107C41]'
                        }`}
                      >
                        {remainingBalance.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Matching Screenshot 2: [إرسال] [حفظ المسودة] [إلغاء] */}
        <div className="pt-2 flex items-center justify-start gap-2 border-t border-[#EDEBE9]">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white text-xs font-semibold border border-[#0078D4] transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>إرسال</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-[#F3F2F1] text-[#323130] text-xs font-semibold border border-[#8A8886] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <Save className="w-3.5 h-3.5 text-[#0078D4]" aria-hidden="true" />
            <span>حفظ المسودة</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-1.5 bg-white hover:bg-[#F3F2F1] text-[#605E5C] text-xs border border-[#D1D1D1] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <span>إلغاء</span>
          </button>
        </div>
      </div>
    </D365Dialog>
  );
};
