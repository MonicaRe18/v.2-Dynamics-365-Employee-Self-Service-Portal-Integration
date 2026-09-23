import React, { useState } from 'react';
import { X, Clock, CheckCircle2 } from 'lucide-react';
import { TeamMember } from '../../types/d365.types';

interface OnBehalfAbsenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  initialMemberId?: string;
  onSubmit: (memberId: string, duration: string, date: string, reason: string) => void;
}

export const OnBehalfAbsenceDialog: React.FC<OnBehalfAbsenceDialogProps> = ({
  isOpen,
  onClose,
  teamMembers,
  initialMemberId,
  onSubmit,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId || teamMembers[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('ساعتان');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentMember = teamMembers.find((m) => m.id === selectedMemberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError('يرجى اختيار الموظف');
      return;
    }
    if (!reason.trim()) {
      setError('يرجى كتابة سبب الإذن أو الغياب الرسمي');
      return;
    }
    setError(null);
    onSubmit(selectedMemberId, duration, date, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
      <div className="bg-white border border-[#0078D4] w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0078D4] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>طلب إذن غياب / خروج نيابة عن موظف (Absence On Behalf)</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {error && (
            <div className="p-2 bg-[#FDE7E9] text-[#A80000] border border-[#FDE7E9]">
              {error}
            </div>
          )}

          {/* Member Selection */}
          <div>
            <label className="block text-[#323130] font-semibold mb-1">
              الموظف المعني في الفريق *
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none bg-white text-xs"
            >
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} - {m.jobTitle} ({m.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-[#323130] font-semibold mb-1">
                تاريخ الإذن / الغياب *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none text-xs"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-[#323130] font-semibold mb-1">
                مدة الإذن *
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none bg-white text-xs"
              >
                <option value="ساعة واحدة">ساعة واحدة (تأخير صباحي / خروج مبكر)</option>
                <option value="ساعتان">ساعتان (إذن رسمي قانوني)</option>
                <option value="3 ساعات">3 ساعات (مأمورية جزئية)</option>
                <option value="يوم كامل (إذن غياب)">يوم كامل (إذن غياب بموافقة جهة العمل)</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[#323130] font-semibold mb-1">
              سبب الإذن ومبررات الغياب الرسمي *
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب سبب التصريح بالإذن (مأمورية خارجية، التوجه للنيابة الإدارية، ظرف عائلي، إلخ)..."
              className="w-full p-2 border border-[#8A8886] focus:border-[#0078D4] outline-none text-xs"
              required
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDEBE9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-[#8A8886] text-[#323130] hover:bg-[#EDEBE9]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تسجيل الإذن رسمياً</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
