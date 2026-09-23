import React from 'react';
import {
  Plus,
  Save,
  Trash2,
  Edit,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  GitBranch,
  Layers,
  ChevronDown,
  Download
} from 'lucide-react';

interface D365ActionBarProps {
  onNew?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onWorkflow?: () => void;
  newButtonLabel?: string;
  disableNew?: boolean;
  disableSave?: boolean;
  disableDelete?: boolean;
  customActions?: React.ReactNode;
}

export const D365ActionBar: React.FC<D365ActionBarProps> = ({
  onNew,
  onSave,
  onDelete,
  onRefresh,
  onExportExcel,
  onPrint,
  onWorkflow,
  newButtonLabel = 'جديد',
  disableNew = false,
  disableSave = true,
  disableDelete = true,
  customActions,
}) => {
  return (
    <div className="bg-[#F3F2F1] border-b border-[#D1D1D1] px-3 py-1 flex flex-wrap items-center justify-between gap-1 text-[#323130] text-xs">
      {/* Primary Commands Group */}
      <div className="flex items-center flex-wrap gap-1">
        {onNew && (
          <button
            onClick={onNew}
            disabled={disableNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] active:bg-[#005A9E] disabled:bg-[#C8C6C4] disabled:text-[#605E5C] text-white font-medium transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
            title="إنشاء سجل أو طلب جديد"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
            <span>{newButtonLabel}</span>
          </button>
        )}

        {onSave && (
          <button
            onClick={onSave}
            disabled={disableSave}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#EDEBE9] border border-[#8A8886] disabled:border-[#E1DFDD] disabled:text-[#605E5C] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
            title="حفظ التغييرات"
          >
            <Save className="w-3.5 h-3.5 text-[#0078D4]" aria-hidden="true" />
            <span>حفظ</span>
          </button>
        )}

        {onDelete && (
          <button
            onClick={onDelete}
            disabled={disableDelete}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#FDF3F2] hover:text-[#A80000] border border-[#8A8886] disabled:border-[#E1DFDD] disabled:text-[#605E5C] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
            title="حذف السجل المحدد"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>حذف</span>
          </button>
        )}

        <div className="h-4 w-px bg-[#D1D1D1] mx-1"></div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#EDEBE9] border border-[#8A8886] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
            title="تحديث البيانات من خدمة Dynamics 365"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0078D4]" aria-hidden="true" />
            <span>تحديث (F5)</span>
          </button>
        )}

        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#EDEBE9] border border-[#8A8886] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
            title="فتح وتصدير إلى Microsoft Excel عبر OData"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#107C41]" aria-hidden="true" />
            <span>تصدير إلى Excel</span>
          </button>
        )}

        {onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#EDEBE9] border border-[#8A8886] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
            title="طباعة التقرير"
          >
            <Printer className="w-3.5 h-3.5 text-[#605E5C]" aria-hidden="true" />
            <span>طباعة</span>
          </button>
        )}

        {customActions}
      </div>

      {/* Right / Secondary Group */}
      <div className="flex items-center gap-1.5"></div>
    </div>
  );
};
