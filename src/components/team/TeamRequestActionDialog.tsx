import React, { useState } from 'react';
import { X, CheckCircle, XCircle, FileText, AlertTriangle } from 'lucide-react';
import { TeamMemberRequest } from '../../types/d365.types';

interface TeamRequestActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: TeamMemberRequest | null;
  actionType: 'approve' | 'reject';
  onConfirm: (requestId: string, notes?: string) => void;
}

export const TeamRequestActionDialog: React.FC<TeamRequestActionDialogProps> = ({
  isOpen,
  onClose,
  request,
  actionType,
  onConfirm,
}) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const isApprove = actionType === 'approve';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApprove && !notes.trim()) {
      setError('يرجى ذكر سبب عدم الموافقة أو الرفض للموظف.');
      return;
    }
    setError(null);
    onConfirm(request.id, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
      <div className="bg-white border border-[#D1D1D1] w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div
          className={`px-4 py-3 flex items-center justify-between text-white ${
            isApprove ? 'bg-[#107C41]' : 'bg-[#A80000]'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {isApprove ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{isApprove ? 'اعتماد وموافقة على طلب الموظف' : 'رفض طلب الموظف'}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          {error && (
            <div className="p-2 bg-[#FDE7E9] text-[#A80000] border border-[#FDE7E9]">
              {error}
            </div>
          )}

          {/* Request Brief */}
          <div className="p-3 bg-[#FAF9F8] border border-[#EDEBE9] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#323130]">{request.employeeName}</span>
              <span className="text-[#605E5C]">{request.employeeJobTitle}</span>
            </div>
            <div className="text-[11px] text-[#0078D4] font-semibold">
              {request.requestType} • {request.duration}
            </div>
            <div className="text-[11px] text-[#605E5C]">
              الفترة: {request.dates}
            </div>
            <div className="text-[11px] text-[#323130] mt-1 bg-white p-1.5 border border-[#EDEBE9]">
              {request.details}
            </div>
          </div>

          {/* Notes / Reason */}
          <div>
            <label className="block text-[#323130] font-semibold mb-1">
              {isApprove ? 'ملاحظات المشرف المباشر (اختياري)' : 'سبب وتبرير الرفض (إلزامي) *'}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isApprove
                  ? 'ملاحظات إضافية مثل تكليف موظف بديل أو توجيهات...'
                  : 'يرجى كتابة سبب الرفض بوضوح لإبلاغ الموظف به رسمياً...'
              }
              className="w-full p-2 border border-[#8A8886] focus:border-[#0078D4] outline-none text-xs"
              required={!isApprove}
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDEBE9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-[#8A8886] text-[#323130] hover:bg-[#EDEBE9]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-white font-semibold flex items-center gap-1.5 shadow-xs ${
                isApprove
                  ? 'bg-[#107C41] hover:bg-[#0E6A37]'
                  : 'bg-[#A80000] hover:bg-[#8F0000]'
              }`}
            >
              {isApprove ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{isApprove ? 'تأكيد الاعتماد' : 'تأكيد الرفض'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
