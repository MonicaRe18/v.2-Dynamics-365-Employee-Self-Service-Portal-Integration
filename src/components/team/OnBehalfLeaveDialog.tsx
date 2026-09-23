import React, { useState } from 'react';
import { X, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { TeamMember } from '../../types/d365.types';

interface OnBehalfLeaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  initialMemberId?: string;
  onSubmit: (memberId: string, leaveType: string, startDate: string, endDate: string, days: number, notes?: string) => void;
}

export const OnBehalfLeaveDialog: React.FC<OnBehalfLeaveDialogProps> = ({
  isOpen,
  onClose,
  teamMembers,
  initialMemberId,
  onSubmit,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId || teamMembers[0]?.id || '');
  const [leaveType, setLeaveType] = useState('إجازة اعتيادية');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentMember = teamMembers.find((m) => m.id === selectedMemberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError('يرجى اختيار الموظف');
      return;
    }
    if (days <= 0) {
      setError('يرجى إدخال عدد أيام صالح');
      return;
    }
    setError(null);
    onSubmit(selectedMemberId, leaveType, startDate, endDate, days, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
      <div className="bg-white border border-[#0078D4] w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0078D4] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Calendar className="w-4 h-4" />
            <span>طلب إجازة نيابة عن موظف (Leave On Behalf)</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
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
            <div className="relative">
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
            {currentMember && (
              <div className="mt-1 p-2 bg-[#EFF6FC] border border-[#DEECF9] text-[11px] text-[#0078D4] flex items-center justify-between">
                <span>الرصيد الاعتيادي المتاح: <strong>{currentMember.leaves.annualAvailable} يوم</strong></span>
                <span>الرصيد العارض المتاح: <strong>{currentMember.leaves.casualAvailable} يوم</strong></span>
              </div>
            )}
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-[#323130] font-semibold mb-1">
              نوع الإجازة *
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none bg-white text-xs"
            >
              <option value="إجازة اعتيادية">إجازة اعتيادية سنوية</option>
              <option value="إجازة عارضة">إجازة عارضة طارئة</option>
              <option value="إجازة مرضية معتمدة">إجازة مرضية بتقرير طبي</option>
              <option value="إجازة رعاية أسرة">إجازة رعاية أسرية</option>
              <option value="إجازة مهمة رسمية">إجازة مهمة ومأمورية رسمية</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[#323130] font-semibold mb-1">
                تاريخ البدء *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[#323130] font-semibold mb-1">
                تاريخ الانتهاء *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[#323130] font-semibold mb-1">
                عدد الأيام *
              </label>
              <input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none text-xs font-bold"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[#323130] font-semibold mb-1">
              ملاحظات أو مبررات المشرف المباشر
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أسباب تسجيل الإجازة نيابة عن الموظف أو أرقام المكاتبات..."
              className="w-full p-2 border border-[#8A8886] focus:border-[#0078D4] outline-none text-xs"
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
              <span>تسجيل واعتماد الإجازة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
