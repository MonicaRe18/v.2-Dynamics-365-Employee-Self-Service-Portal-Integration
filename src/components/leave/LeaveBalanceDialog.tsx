import React, { useState } from 'react';
import {
  Calendar,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { D365Dialog } from '../common/D365Dialog';
import { D365Tabs, TabItem } from '../common/D365Tabs';
import { D365DataGrid, Column } from '../common/D365DataGrid';
import { LeaveBalance, LeaveRequest, LeaveTypeCode } from '../../types/d365.types';
import { d365Service } from '../../services/d365Service';
import { exportToCsv } from '../../utils/exportUtils';

interface LeaveBalanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leaveBalances: LeaveBalance[];
  onOpenNewLeave: (leaveTypeCode?: LeaveTypeCode) => void;
  onRefresh?: () => void;
}

export const LeaveBalanceDialog: React.FC<LeaveBalanceDialogProps> = ({
  isOpen,
  onClose,
  leaveBalances,
  onOpenNewLeave,
  onRefresh,
}) => {
  // Main tabs from Screenshot 1:
  // 1. الأرصدة
  // 2. أيام الإجازة المعتمد
  // 3. طلبات الإجازة المقدمة
  const [activeMainTab, setActiveMainTab] = useState<'BALANCES' | 'APPROVED_DAYS' | 'SUBMITTED_REQUESTS'>('BALANCES');
  const [asOfDate, setAsOfDate] = useState<string>('2025-09-18');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [selectedBalanceRow, setSelectedBalanceRow] = useState<LeaveBalance | null>(leaveBalances[0] || null);

  const allRequests = d365Service.getLeaveRequests();
  const approvedRequests = allRequests.filter((r) => r.status === 'Approved');

  const mainTabs: TabItem[] = [
    {
      id: 'BALANCES',
      label: 'الأرصدة',
      count: leaveBalances.length,
    },
    {
      id: 'APPROVED_DAYS',
      label: 'أيام الإجازة المعتمد',
      count: approvedRequests.length,
    },
    {
      id: 'SUBMITTED_REQUESTS',
      label: 'طلبات الإجازة المقدمة',
      count: allRequests.length,
    },
  ];

  const handleApplyFilter = () => {
    if (onRefresh) onRefresh();
    setFeedbackNotice(`تم تطبيق التصفية واحتساب الرصيد الفعلي اعتباراً من تاريخ ${asOfDate}`);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const handleExportExcel = () => {
    if (activeMainTab === 'BALANCES') {
      exportToCsv(
        `Leave_Balances_${asOfDate}`,
        leaveBalances.map((b) => ({
          'النوع': b.leaveTypeTitle,
          'الوحدة': b.unit,
          'الرصيد الحالي': b.currentBalance.toFixed(2),
          'معدل الاستحقاق': b.accrualRate,
          'اعتباراً من تاريخ': asOfDate,
        }))
      );
    } else if (activeMainTab === 'APPROVED_DAYS') {
      exportToCsv(
        'Approved_Leave_Days',
        approvedRequests.map((r) => ({
          'رقم الطلب': r.id,
          'النوع': r.leaveTypeTitle,
          'تاريخ البدء': r.startDate,
          'تاريخ الانتهاء': r.endDate,
          'الأيام المعتمدة': r.requestedDays,
          'القائم بالأعمال': r.delegatedEmployeeName,
          'تاريخ الاعتماد': r.submissionDate,
        }))
      );
    } else {
      exportToCsv(
        'Submitted_Leave_Requests',
        allRequests.map((r) => ({
          'رقم الطلب': r.id,
          'النوع': r.leaveTypeTitle,
          'تاريخ التقديم': r.submissionDate,
          'تاريخ البدء': r.startDate,
          'تاريخ الانتهاء': r.endDate,
          'الأيام': r.requestedDays,
          'الحالة': r.statusAr,
        }))
      );
    }
    setFeedbackNotice('تم تصدير البيانات إلى ملف Excel بنجاح.');
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Columns for Tab 1: الأرصدة (Matching Screenshot 1 exactly)
  const balancesColumns: Column<LeaveBalance>[] = [
    {
      key: 'leaveTypeTitle',
      header: 'النوع',
      width: '180px',
      render: (row) => (
        <span className="font-semibold text-xs text-[#323130]">{row.leaveTypeTitle}</span>
      ),
    },
    {
      key: 'unit',
      header: 'الوحدة',
      width: '100px',
      render: (row) => <span className="text-xs text-[#605E5C]">{row.unit}</span>,
    },
    {
      key: 'currentBalance',
      header: 'الرصيد الحالي',
      width: '130px',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-[#0078D4]">
          {row.currentBalance.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'accrualRate',
      header: 'معدل الاستحقاق',
      render: (row) => (
        <span className="text-xs text-[#323130]">{row.accrualRate}</span>
      ),
    },
  ];

  // Columns for Tab 2: أيام الإجازة المعتمد
  const approvedDaysColumns: Column<LeaveRequest>[] = [
    {
      key: 'leaveTypeTitle',
      header: 'نوع الإجازة',
      width: '160px',
      render: (row) => <span className="font-semibold text-xs text-[#323130]">{row.leaveTypeTitle}</span>,
    },
    {
      key: 'startDate',
      header: 'تاريخ البدء',
      width: '110px',
      render: (row) => <span className="font-mono text-xs text-[#605E5C]">{row.startDate}</span>,
    },
    {
      key: 'endDate',
      header: 'تاريخ الانتهاء',
      width: '110px',
      render: (row) => <span className="font-mono text-xs text-[#605E5C]">{row.endDate}</span>,
    },
    {
      key: 'requestedDays',
      header: 'الأيام المعتمدة',
      width: '110px',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-[#107C41]">
          {row.requestedDays} يوم
        </span>
      ),
    },
    {
      key: 'delegatedEmployeeName',
      header: 'القائم بالأعمال',
      width: '150px',
      render: (row) => <span className="text-xs text-[#323130]">{row.delegatedEmployeeName}</span>,
    },
    {
      key: 'statusAr',
      header: 'حالة الاعتماد',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-[#DFF6DD] text-[#107C41] font-semibold">
          <CheckCircle2 className="w-3 h-3" />
          {row.statusAr}
        </span>
      ),
    },
  ];

  // Columns for Tab 3: طلبات الإجازة المقدمة
  const submittedRequestsColumns: Column<LeaveRequest>[] = [
    {
      key: 'id',
      header: 'رقم الطلب',
      width: '120px',
      render: (row) => <span className="font-mono text-xs text-[#0078D4] font-semibold">{row.id}</span>,
    },
    {
      key: 'leaveTypeTitle',
      header: 'نوع الإجازة',
      width: '150px',
      render: (row) => <span className="font-semibold text-xs text-[#323130]">{row.leaveTypeTitle}</span>,
    },
    {
      key: 'submissionDate',
      header: 'تاريخ التقديم',
      width: '110px',
      render: (row) => <span className="font-mono text-xs text-[#605E5C]">{row.submissionDate}</span>,
    },
    {
      key: 'startDate',
      header: 'من تاريخ',
      width: '100px',
      render: (row) => <span className="font-mono text-xs text-[#605E5C]">{row.startDate}</span>,
    },
    {
      key: 'endDate',
      header: 'إلى تاريخ',
      width: '100px',
      render: (row) => <span className="font-mono text-xs text-[#605E5C]">{row.endDate}</span>,
    },
    {
      key: 'requestedDays',
      header: 'الأيام',
      width: '80px',
      render: (row) => <span className="font-mono font-semibold text-xs text-[#323130]">{row.requestedDays}</span>,
    },
    {
      key: 'statusAr',
      header: 'الحالة',
      render: (row) => {
        const isApproved = row.status === 'Approved';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold ${
              isApproved ? 'bg-[#DFF6DD] text-[#107C41]' : 'bg-[#FFF4CE] text-[#797673]'
            }`}
          >
            {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {row.statusAr}
          </span>
        );
      },
    },
  ];

  return (
    <D365Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="الأرصدة"
      subtitle="استعلام رصيد الإجازات والاستحقاق - Microsoft Dynamics 365 Human Resources"
      maxWidth="4xl"
      primaryActionLabel="تقديم طلب إجازة جديد"
      onPrimaryAction={() => {
        onClose();
        onOpenNewLeave(selectedBalanceRow?.leaveTypeCode || 'ANNUAL');
      }}
      secondaryActionLabel="إغلاق"
      onSecondaryAction={onClose}
      tertiaryActionLabel="تصدير إلى Excel"
      onTertiaryAction={handleExportExcel}
    >
      <div className="space-y-3">
        {/* Feedback message banner if triggered */}
        {feedbackNotice && (
          <div className="p-2.5 bg-[#DFF6DD] border border-[#107C41] text-[#107C41] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
            <button
              onClick={() => setFeedbackNotice(null)}
              className="text-xs hover:underline font-bold"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* 3 Main Tabs: الأرصدة | أيام الإجازة المعتمد | طلبات الإجازة المقدمة */}
        <div className="bg-white border border-[#D1D1D1]">
          <D365Tabs
            tabs={mainTabs}
            activeTabId={activeMainTab}
            onTabChange={(id) => setActiveMainTab(id as any)}
          />

          {/* As-of Date Filter Bar (Matching Screenshot 1) */}
          <div className="p-3 bg-[#F9F9F9] border-t border-b border-[#EDEBE9] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="asOfDateField" className="text-xs font-semibold text-[#323130]">
                اعتباراً من تاريخ:
              </label>
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 border border-[#8A8886] focus-within:border-[#0078D4]">
                <Calendar className="w-3.5 h-3.5 text-[#0078D4]" />
                <input
                  id="asOfDateField"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="h-5 bg-transparent text-xs text-[#323130] outline-none font-mono"
                />
              </div>
              <button
                onClick={handleApplyFilter}
                className="px-3 py-1 bg-[#0078D4] hover:bg-[#106EBE] text-white text-xs font-semibold border border-[#0078D4] transition-colors"
              >
                تطبيق
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F3F2F1] text-xs text-[#107C41] border border-[#D1D1D1] transition-colors"
                title="تصدير السجلات إلى Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>تصدير Excel</span>
              </button>
              <button
                onClick={() => {
                  setAsOfDate('2025-09-18');
                  handleApplyFilter();
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F3F2F1] text-xs text-[#605E5C] border border-[#D1D1D1] transition-colors"
                title="إعادة تعيين للتاريخ الافتراضي"
              >
                <RefreshCw className="w-3 h-3" />
                <span>إعادة تعيين</span>
              </button>
            </div>
          </div>

          {/* Tab 1 Content: الأرصدة Table */}
          {activeMainTab === 'BALANCES' && (
            <div className="p-3">
              <D365DataGrid
                columns={balancesColumns}
                data={leaveBalances}
                keyExtractor={(row) => row.id}
                onRowSelect={(row: LeaveBalance) => setSelectedBalanceRow(row)}
                selectedIds={selectedBalanceRow ? [selectedBalanceRow.id] : []}
                emptyMessage="لا توجد أرصدة مسجلة في هذا الحساب"
              />

              {/* Selected Balance Quick Info Footer */}
              {selectedBalanceRow && (
                <div className="mt-3 p-3 bg-[#F3F2F1] border border-[#D1D1D1] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-[#0078D4]" />
                    <span className="font-semibold text-[#323130]">
                      النوع المختار: {selectedBalanceRow.leaveTypeTitle}
                    </span>
                    <span className="text-[#605E5C]">
                      الرصيد المتاح: <strong className="text-[#0078D4]">{selectedBalanceRow.currentBalance.toFixed(2)} {selectedBalanceRow.unit}</strong>
                    </span>
                    <span className="text-[#605E5C]">
                      معدل الاستحقاق: {selectedBalanceRow.accrualRate}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenNewLeave(selectedBalanceRow.leaveTypeCode);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-[#0078D4] text-white hover:bg-[#106EBE] text-xs font-semibold transition-colors"
                  >
                    <span>طلب {selectedBalanceRow.leaveTypeTitle}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2 Content: أيام الإجازة المعتمد */}
          {activeMainTab === 'APPROVED_DAYS' && (
            <div className="p-3">
              <D365DataGrid
                columns={approvedDaysColumns}
                data={approvedRequests}
                keyExtractor={(row) => row.id}
                emptyMessage="لا توجد أيام إجازة معتمدة مسجلة"
              />
            </div>
          )}

          {/* Tab 3 Content: طلبات الإجازة المقدمة */}
          {activeMainTab === 'SUBMITTED_REQUESTS' && (
            <div className="p-3">
              <D365DataGrid
                columns={submittedRequestsColumns}
                data={allRequests}
                keyExtractor={(row) => row.id}
                emptyMessage="لا توجد طلبات إجازة مقدمة حتى الآن"
              />
            </div>
          )}
        </div>
      </div>
    </D365Dialog>
  );
};
