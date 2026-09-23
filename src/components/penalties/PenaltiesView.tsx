import React, { useState } from 'react';
import {
  Scale,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import { D365ActionBar } from '../common/D365ActionBar';
import { D365DataGrid, Column } from '../common/D365DataGrid';
import { D365StatusBadge } from '../common/D365StatusBadge';
import { D365FastTab } from '../common/D365FastTab';
import { PenaltyGrievanceDialog } from './PenaltyGrievanceDialog';
import { Penalty } from '../../types/d365.types';

interface PenaltiesViewProps {
  penalties: Penalty[];
  onRefresh: () => void;
  onExportExcel: () => void;
  onGrievanceSuccess: () => void;
}

export const PenaltiesView: React.FC<PenaltiesViewProps> = ({
  penalties,
  onRefresh,
  onExportExcel,
  onGrievanceSuccess,
}) => {
  const [selectedPenaltyForGrievance, setSelectedPenaltyForGrievance] = useState<Penalty | null>(null);
  const [activePenaltyDetails, setActivePenaltyDetails] = useState<Penalty | null>(penalties[0] || null);

  const activePenaltiesCount = penalties.filter((p) => p.penaltyStatus === 'Active').length;
  const underGrievanceCount = penalties.filter((p) => p.penaltyStatus === 'UnderGrievance').length;

  const columns: Column<Penalty>[] = [
    {
      key: 'penaltyNumber',
      header: 'رقم الجزاء (Penalty #)',
      width: '130px',
      render: (row) => (
        <span className="font-mono text-[11px] font-bold text-[#0078D4]">{row.penaltyNumber}</span>
      ),
    },
    {
      key: 'penaltyStatusAr',
      header: 'حالة الجزاء (Status)',
      width: '140px',
      render: (row) => <D365StatusBadge status={row.penaltyStatus} label={row.penaltyStatusAr} />,
    },
    {
      key: 'penaltySigningDate',
      header: 'تاريخ التوقيع',
      width: '110px',
      render: (row) => <span className="font-mono text-[11px]">{row.penaltySigningDate}</span>,
    },
    {
      key: 'penaltyStartDate',
      header: 'تاريخ السريان',
      width: '110px',
      render: (row) => <span className="font-mono text-[11px]">{row.penaltyStartDate}</span>,
    },
    {
      key: 'action',
      header: 'الإجراء المتخذ',
      width: '150px',
      render: (row) => (
        <span className="font-semibold text-xs text-[#323130]">{row.action}</span>
      ),
    },
    {
      key: 'investigationAuthority',
      header: 'جهة التحقيق',
      width: '160px',
      render: (row) => (
        <span className="text-[11px] text-[#605E5C] truncate block" title={row.investigationAuthority}>
          {row.investigationAuthority}
        </span>
      ),
    },
    {
      key: 'employeePenalty',
      header: 'عقوبة الموظف',
      width: '130px',
      render: (row) => <span className="text-xs text-[#323130]">{row.employeePenalty}</span>,
    },
    {
      key: 'duration',
      header: 'المدة / الأثر',
      width: '120px',
      render: (row) => <span className="text-xs font-mono text-[#A80000]">{row.duration}</span>,
    },
    {
      key: 'penaltyDetails',
      header: 'تفاصيل وسبب الجزاء',
      render: (row) => (
        <span className="text-[#605E5C] text-xs truncate block max-w-xs" title={row.penaltyDetails}>
          {row.penaltyDetails}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Dynamics Action Bar */}
      <D365ActionBar
        onRefresh={onRefresh}
        onExportExcel={onExportExcel}
      />

      {/* Page Title & Status Strip */}
      <div className="bg-white border border-[#D1D1D1] p-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-[#323130] flex items-center gap-2">
            <span className="w-2 h-4 bg-[#D83B01]"></span>
            <span>الجزاءات والعقوبات الإدارية (Disciplinary Actions)</span>
          </h1>
          <p className="text-[11px] text-[#605E5C] mt-0.5">
            سجل القرارات التأديبية والتحقيقات الإدارية وإمكانية تقديم تظلم رسمي عبر محرك HcmDisciplinaryAction
          </p>
        </div>

        {/* Status Metrics */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-[#FAF9F8] border border-[#D1D1D1] text-xs">
            <span className="text-[#605E5C]">الجزاءات النافذة: </span>
            <strong className="text-[#A80000] font-sans">{activePenaltiesCount}</strong>
          </div>
          <div className="px-3 py-1.5 bg-[#FAF9F8] border border-[#D1D1D1] text-xs">
            <span className="text-[#605E5C]">تظلمات قيد الدراسة: </span>
            <strong className="text-[#0078D4] font-sans">{underGrievanceCount}</strong>
          </div>
        </div>
      </div>

      {/* Penalties Grid */}
      <D365DataGrid
        columns={columns}
        data={penalties}
        keyExtractor={(p) => p.id}
        title="قائمة الجزاءات الصادرة بالملف الوظيفي"
        searchPlaceholder="بحث في رقم الجزاء أو الإجراء أو جهة التحقيق..."
        onRowSelect={(p) => setActivePenaltyDetails(p)}
        actions={(row) => (
          <div className="flex items-center justify-center gap-1.5">
            {row.penaltyStatus === 'Active' && !row.hasGrievance ? (
              <button
                onClick={() => setSelectedPenaltyForGrievance(row)}
                className="px-2.5 py-1 bg-[#0078D4] hover:bg-[#106EBE] text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
                title="تقديم تظلم رسمي على هذا الجزاء"
              >
                <Scale className="w-3 h-3" />
                <span>تقديم تظلم (Grievance)</span>
              </button>
            ) : row.hasGrievance ? (
              <span className="text-[11px] text-[#0078D4] bg-[#EFF6FC] px-2 py-0.5 border border-[#0078D4]/30 font-medium">
                {row.grievanceId || 'تم تقديم تظلم'}
              </span>
            ) : (
              <span className="text-[11px] text-[#8A8886]">—</span>
            )}
          </div>
        )}
      />

      {/* Selected Penalty Detailed Card (FastTab) */}
      {activePenaltyDetails && (
        <D365FastTab
          title={`تفاصيل الجزاء المحدد: ${activePenaltyDetails.penaltyNumber} - ${activePenaltyDetails.action}`}
          summary={activePenaltyDetails.penaltyStatusAr}
          defaultExpanded={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FAF9F8] p-3 border border-[#EDEBE9]">
            <div>
              <div className="text-[11px] font-bold text-[#605E5C]">رقم الجزاء والجهة المصدرة:</div>
              <div className="text-xs font-mono font-bold text-[#0078D4] mt-0.5">{activePenaltyDetails.penaltyNumber}</div>
              <div className="text-xs text-[#323130] mt-1">{activePenaltyDetails.investigationAuthority}</div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-[#605E5C]">التواريخ والمدة:</div>
              <div className="text-xs text-[#323130] mt-0.5">
                تاريخ التوقيع: <strong className="font-mono">{activePenaltyDetails.penaltySigningDate}</strong>
              </div>
              <div className="text-xs text-[#323130] mt-1">
                تاريخ السريان: <strong className="font-mono">{activePenaltyDetails.penaltyStartDate}</strong>
              </div>
              <div className="text-xs text-[#A80000] mt-1 font-semibold">
                الأثر الإداري/المالي: {activePenaltyDetails.duration}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-[#605E5C]">تفاصيل المخالفة وسبب الجزاء:</div>
              <div className="text-xs text-[#323130] mt-0.5 leading-relaxed bg-white p-2 border border-[#D1D1D1]">
                {activePenaltyDetails.penaltyDetails}
              </div>
              {activePenaltyDetails.grievanceStatus && (
                <div className="mt-2 text-[11px] text-[#0078D4] bg-[#EFF6FC] p-1.5 border border-[#0078D4]/20">
                  <strong>موقف التظلم: </strong> {activePenaltyDetails.grievanceStatus}
                </div>
              )}
            </div>
          </div>
        </D365FastTab>
      )}

      {/* Penalty Grievance Modal */}
      <PenaltyGrievanceDialog
        isOpen={!!selectedPenaltyForGrievance}
        onClose={() => setSelectedPenaltyForGrievance(null)}
        penalty={selectedPenaltyForGrievance}
        onSuccess={() => {
          setSelectedPenaltyForGrievance(null);
          onGrievanceSuccess();
        }}
      />
    </div>
  );
};
