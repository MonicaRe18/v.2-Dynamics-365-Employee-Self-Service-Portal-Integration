import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { D365Dialog } from '../common/D365Dialog';
import { Penalty } from '../../types/d365.types';
import { PenaltyGrievanceDialog } from './PenaltyGrievanceDialog';
import { exportToCsv } from '../../utils/exportUtils';

interface PenaltiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  penalties: Penalty[];
  onRefresh?: () => void;
}

export const PenaltiesDialog: React.FC<PenaltiesDialogProps> = ({
  isOpen,
  onClose,
  penalties,
  onRefresh,
}) => {
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(penalties[0] || null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [grievanceTargetPenalty, setGrievanceTargetPenalty] = useState<Penalty | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExport = () => {
    exportToCsv(
      'Penalties_Records',
      penalties.map((p) => ({
        'رقم الجزاء': p.penaltyNumber,
        'حالة الجزاء': p.hearingStatus || p.penaltyStatusAr,
        'تاريخ توقيع الجزاء': p.penaltySigningDate,
        'تاريخ محو الجزاء': p.penaltyRemovalDate || '2026-09-07',
        'عقوبة الموظف': p.employeePenalty,
        'جهة التحقيق': p.investigationAuthority,
        'مدة الجزاء': p.duration,
      }))
    );
    setToastMessage('تم تصدير سجل الجزاءات إلى Excel بنجاح.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGrievanceSuccess = () => {
    if (onRefresh) onRefresh();
    setToastMessage('تم إرسال طلب التظلم بنجاح وقيده بلجنة الشؤون القانونية والتظلمات.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <>
      <D365Dialog
        isOpen={isOpen}
        onClose={onClose}
        title="الجزاءات"
        subtitle="سجل الجزاءات التأديبية - Microsoft Dynamics 365 Human Resources"
        maxWidth="3xl"
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

          {/* Table: Matching Screenshot 3 */}
          <div className="bg-white border border-[#D1D1D1] overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1] text-[#323130] font-semibold">
                  <th className="p-2.5 border-l border-[#D1D1D1]">رقم الجزاء</th>
                  <th className="p-2.5 border-l border-[#D1D1D1]">حالة الجزاء</th>
                  <th className="p-2.5 border-l border-[#D1D1D1]">تاريخ توقيع الجزاء</th>
                  <th className="p-2.5 border-l border-[#D1D1D1]">تاريخ محو الجزاء</th>
                  <th className="p-2.5 text-center w-28">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {penalties.map((penalty) => {
                  const isSelected = selectedPenalty?.id === penalty.id;
                  return (
                    <tr
                      key={penalty.id}
                      onClick={() => setSelectedPenalty(penalty)}
                      className={`border-b border-[#EDEBE9] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#EDEBE9]' : 'hover:bg-[#FAF9F8]'
                      }`}
                    >
                      <td className="p-2.5 border-l border-[#EDEBE9] font-mono font-semibold text-[#0078D4]">
                        {penalty.penaltyNumber}
                      </td>
                      <td className="p-2.5 border-l border-[#EDEBE9] text-[#323130]">
                        {penalty.hearingStatus || penalty.penaltyStatusAr}
                      </td>
                      <td className="p-2.5 border-l border-[#EDEBE9] font-mono text-[#605E5C]">
                        {penalty.penaltySigningDate}
                      </td>
                      <td className="p-2.5 border-l border-[#EDEBE9] font-mono text-[#605E5C]">
                        {penalty.penaltyRemovalDate || '2026-09-07'}
                      </td>
                      <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {penalty.hasGrievance ? (
                          <span className="inline-block px-2 py-1 text-[11px] bg-[#F3F2F1] text-[#605E5C] border border-[#D1D1D1]">
                            تم تقديم تظلم
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setGrievanceTargetPenalty(penalty)}
                            className="px-2.5 py-1 bg-[#0078D4] hover:bg-[#106EBE] text-white text-[11px] font-semibold transition-colors"
                          >
                            تقديم تظلم
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Accordion: تفاصيل الجزاء (Matching Screenshot 3) */}
          {selectedPenalty && (
            <div className="bg-white border border-[#D1D1D1]">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="w-full px-3 py-2 bg-[#F3F2F1] border-b border-[#EDEBE9] flex items-center justify-between text-xs font-bold text-[#323130] hover:bg-[#EDEBE9] transition-colors"
              >
                <span>تفاصيل الجزاء ({selectedPenalty.penaltyNumber})</span>
                {isDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isDetailsOpen && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* جهة التحقيق */}
                  <div className="space-y-1">
                    <span className="text-[#605E5C] block">جهة التحقيق:</span>
                    <span className="font-semibold text-[#323130] bg-[#F9F9F9] p-2 block border border-[#EDEBE9]">
                      {selectedPenalty.investigationAuthority || 'الشئون القانونية'}
                    </span>
                  </div>

                  {/* الجزاء التأديبي للموظف */}
                  <div className="space-y-1">
                    <span className="text-[#605E5C] block">الجزاء التأديبي للموظف:</span>
                    <span className="font-semibold text-[#A80000] bg-[#F9F9F9] p-2 block border border-[#EDEBE9]">
                      {selectedPenalty.employeePenalty || selectedPenalty.action}
                    </span>
                  </div>

                  {/* حالة الجزاء */}
                  <div className="space-y-1">
                    <span className="text-[#605E5C] block">حالة الجزاء:</span>
                    <span className="font-semibold text-[#323130] bg-[#F9F9F9] p-2 block border border-[#EDEBE9]">
                      {selectedPenalty.penaltyStatusAr || 'سارية'}
                    </span>
                  </div>

                  {/* مدة الجزاء */}
                  <div className="space-y-1">
                    <span className="text-[#605E5C] block">مدة الجزاء:</span>
                    <span className="font-semibold text-[#323130] bg-[#F9F9F9] p-2 block border border-[#EDEBE9]">
                      {selectedPenalty.duration || '-'}
                    </span>
                  </div>

                  {/* تاريخ محو الجزاء */}
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-[#605E5C] block">تاريخ محو الجزاء:</span>
                    <span className="font-mono font-semibold text-[#0078D4] bg-[#F9F9F9] p-2 block border border-[#EDEBE9]">
                      {selectedPenalty.penaltyRemovalDate || '2026-09-07'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </D365Dialog>

      {/* Grievance Submission Dialog (Screenshot 4) */}
      <PenaltyGrievanceDialog
        isOpen={!!grievanceTargetPenalty}
        onClose={() => setGrievanceTargetPenalty(null)}
        penalty={grievanceTargetPenalty}
        onSuccess={handleGrievanceSuccess}
      />
    </>
  );
};
