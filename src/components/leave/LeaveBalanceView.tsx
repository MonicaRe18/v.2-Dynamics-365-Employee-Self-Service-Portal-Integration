import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  History,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  ArrowRightLeft
} from 'lucide-react';
import { D365ActionBar } from '../common/D365ActionBar';
import { D365Tabs, TabItem } from '../common/D365Tabs';
import { D365FastTab } from '../common/D365FastTab';
import { D365DataGrid, Column } from '../common/D365DataGrid';
import { D365Tile } from '../common/D365Tile';
import { LeaveBalance, LeaveMovementTransaction, LeaveTypeCode } from '../../types/d365.types';
import { d365Service } from '../../services/d365Service';

interface LeaveBalanceViewProps {
  leaveBalances: LeaveBalance[];
  onOpenNewLeaveDialog: (type?: LeaveTypeCode) => void;
  onRefresh: () => void;
  onExportExcel: () => void;
}

export const LeaveBalanceView: React.FC<LeaveBalanceViewProps> = ({
  leaveBalances,
  onOpenNewLeaveDialog,
  onRefresh,
  onExportExcel,
}) => {
  const [selectedLeaveTypeCode, setSelectedLeaveTypeCode] = useState<string>('ALL');
  const [asOfDate, setAsOfDate] = useState('2026-09-21');

  const selectedBalance =
    leaveBalances.find((b) => b.leaveTypeCode === selectedLeaveTypeCode) || leaveBalances[0];

  const transactions =
    selectedLeaveTypeCode !== 'ALL'
      ? d365Service.getLeaveTransactions(selectedLeaveTypeCode as LeaveTypeCode)
      : [];

  // Tabs: All Balances overview + each leave type
  const tabs: TabItem[] = [
    {
      id: 'ALL',
      label: 'جميع الأرصدة (All Balances)',
      count: leaveBalances.length,
    },
    ...leaveBalances.map((b) => ({
      id: b.leaveTypeCode,
      label: b.leaveTypeTitle,
      count: b.currentBalance,
    })),
  ];

  // Overview Table Columns (When "All" is active)
  const overviewColumns: Column<LeaveBalance>[] = [
    {
      key: 'leaveTypeTitle',
      header: 'نوع الإجازة (Leave Type)',
      width: '180px',
      render: (row) => (
        <div>
          <span className="font-semibold text-xs text-[#323130] block">{row.leaveTypeTitle}</span>
          <span className="font-mono text-[10px] text-[#8A8886]">{row.accrualPlanId}</span>
        </div>
      ),
    },
    {
      key: 'unit',
      header: 'الوحدة',
      width: '70px',
      render: (row) => <span className="text-xs text-[#605E5C]">{row.unit}</span>,
    },
    {
      key: 'allocatedBalance',
      header: 'المخصص السنوي',
      width: '95px',
      render: (row) => (
        <span className="font-mono text-xs text-[#323130] font-semibold">{row.allocatedBalance}</span>
      ),
    },
    {
      key: 'consumedBalance',
      header: 'المستهلك',
      width: '85px',
      render: (row) => (
        <span className="font-mono text-xs text-[#605E5C]">{row.consumedBalance}</span>
      ),
    },
    {
      key: 'pendingBalance',
      header: 'قيد الاعتماد',
      width: '90px',
      render: (row) => (
        <span className="font-mono text-xs text-[#D83B01] font-semibold">
          {row.pendingBalance > 0 ? `${row.pendingBalance}` : '0'}
        </span>
      ),
    },
    {
      key: 'currentBalance',
      header: 'الرصيد المتاح (Current)',
      width: '130px',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-sm text-[#0078D4]">{row.currentBalance}</span>
          <span className="text-[11px] text-[#605E5C]">{row.unit}</span>
        </div>
      ),
    },
    {
      key: 'accrualRate',
      header: 'معدل الاستحقاق (Accrual Rate)',
      width: '160px',
      render: (row) => <span className="text-[11px] text-[#323130]">{row.accrualRate}</span>,
    },
    {
      key: 'asOfDate',
      header: 'حتى تاريخ',
      width: '100px',
      render: () => <span className="font-mono text-[11px] text-[#605E5C]">{asOfDate}</span>,
    },
    {
      key: 'id',
      header: 'إجراء',
      width: '130px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedLeaveTypeCode(row.leaveTypeCode)}
            className="px-2 py-0.5 bg-white hover:bg-[#F3F2F1] text-[#0078D4] border border-[#0078D4] text-[11px] font-medium transition-colors"
          >
            التفاصيل
          </button>
          <button
            onClick={() => onOpenNewLeaveDialog(row.leaveTypeCode)}
            className="px-2 py-0.5 bg-[#0078D4] hover:bg-[#106EBE] text-white text-[11px] font-medium transition-colors"
          >
            طلب
          </button>
        </div>
      ),
    },
  ];

  // Transaction columns
  const txnColumns: Column<LeaveMovementTransaction>[] = [
    {
      key: 'referenceNumber',
      header: 'رقم المرجع (Ref #)',
      width: '140px',
      render: (row) => (
        <span className="font-mono text-[11px] text-[#0078D4] font-bold">{row.referenceNumber}</span>
      ),
    },
    {
      key: 'transactionDate',
      header: 'تاريخ الحركة',
      width: '110px',
      render: (row) => <span className="font-mono text-[11px]">{row.transactionDate}</span>,
    },
    {
      key: 'transactionType',
      header: 'نوع الحركة',
      width: '130px',
      render: (row) => {
        const isAddition = row.amount > 0;
        return (
          <span
            className={`px-1.5 py-0.5 text-[11px] font-medium ${
              isAddition
                ? 'bg-[#DFF6DD] text-[#107C41] border border-[#107C41]/30'
                : 'bg-[#EFF6FC] text-[#0078D4] border border-[#0078D4]/30'
            }`}
          >
            {row.transactionType}
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'الكمية (أيام)',
      width: '90px',
      render: (row) => (
        <span
          className={`font-mono font-bold text-xs ${
            row.amount > 0 ? 'text-[#107C41]' : 'text-[#A80000]'
          }`}
        >
          {row.amount > 0 ? `+${row.amount}` : row.amount}
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      header: 'الرصيد بعد الحركة',
      width: '120px',
      render: (row) => (
        <span className="font-mono font-semibold text-xs text-[#323130]">{row.balanceAfter} يوم</span>
      ),
    },
    {
      key: 'notes',
      header: 'ملاحظات وتفاصيل الاستحقاق',
      render: (row) => <span className="text-[#605E5C] text-xs">{row.notes}</span>,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Dynamics Action Bar */}
      <D365ActionBar
        onNew={() =>
          onOpenNewLeaveDialog(
            selectedLeaveTypeCode !== 'ALL' ? (selectedLeaveTypeCode as LeaveTypeCode) : undefined
          )
        }
        newButtonLabel="طلب إجازة جديد"
        onRefresh={onRefresh}
        onExportExcel={onExportExcel}
      />

      {/* Page Title & As-of Date Filter Bar */}
      <div className="bg-white border border-[#D1D1D1] p-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-[#323130] flex items-center gap-2">
            <span className="w-2 h-4 bg-[#0078D4]"></span>
            <span>استعلام أرصدة الإجازات (Leave and Absence Balances)</span>
          </h1>
          <p className="text-[11px] text-[#605E5C] mt-0.5">
            عرض أرصدة الاستحقاق ومعدلات التراكم وسجل الحركات المحاسبية من محرك الموارد البشرية لمايكروسوفت ديناميكس
          </p>
        </div>

        {/* As-of Date Filter Field */}
        <div className="flex items-center gap-2 bg-[#F5F5F5] p-1.5 border border-[#D1D1D1]">
          <label className="text-xs font-semibold text-[#323130] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>حتى تاريخ (As-of Date):</span>
          </label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="h-7 px-2 bg-white text-xs text-[#323130] border border-[#8A8886] focus:border-[#0078D4] outline-none font-mono"
          />
        </div>
      </div>

      {/* Balance Tabs (D365 Pivot Style) */}
      <div className="bg-white border border-[#D1D1D1]">
        <D365Tabs
          tabs={tabs}
          activeTabId={selectedLeaveTypeCode}
          onTabChange={(id) => setSelectedLeaveTypeCode(id)}
        />

        {/* Tab 1: Overview Table for all leave balances */}
        {selectedLeaveTypeCode === 'ALL' && (
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-[#605E5C]">
              <span className="font-semibold text-[#323130]">
                جدول كشف أرصدة الإجازات المعتمدة (Leave Balances Summary Grid):
              </span>
              <span className="text-[11px]">الأرصدة محسوبة بدقة حتى: <strong className="font-mono text-[#323130]">{asOfDate}</strong></span>
            </div>
            <D365DataGrid
              columns={overviewColumns}
              data={leaveBalances}
              keyExtractor={(b) => b.id}
              searchPlaceholder="بحث في نوع الإجازة أو رمز الخطة..."
            />
          </div>
        )}

        {/* Tab 2: Selected Leave Detail Header Card */}
        {selectedLeaveTypeCode !== 'ALL' && selectedBalance && (
          <div>
            <div className="p-4 bg-[#FAF9F8] border-b border-[#EDEBE9]">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Tile 1: Current Balance */}
                <div className="bg-white border-x border-b border-[#D1D1D1] border-t-[3px] border-t-[#0078D4] p-3">
                  <div className="text-[11px] text-[#605E5C] font-semibold">الرصيد الحالي المتاح</div>
                  <div className="text-3xl font-bold font-sans text-[#0078D4] mt-1">
                    {selectedBalance.currentBalance}
                    <span className="text-xs font-normal text-[#605E5C] mr-1.5">{selectedBalance.unit}</span>
                  </div>
                  <div className="text-[10px] text-[#8A8886] mt-1">
                    حتى تاريخ {asOfDate}
                  </div>
                </div>

                {/* Tile 2: Accrual Rate */}
                <div className="bg-white border-x border-b border-[#D1D1D1] border-t-[3px] border-t-[#107C41] p-3">
                  <div className="text-[11px] text-[#605E5C] font-semibold">معدل الاستحقاق السنوي</div>
                  <div className="text-base font-bold text-[#107C41] mt-1 truncate" title={selectedBalance.accrualRate}>
                    {selectedBalance.accrualRate}
                  </div>
                  <div className="text-[10px] text-[#8A8886] mt-1">
                    خطة الاستحقاق: <strong className="font-mono text-[#323130]">{selectedBalance.accrualPlanId}</strong>
                  </div>
                </div>

                {/* Tile 3: Consumed & Pending */}
                <div className="bg-white border-x border-b border-[#D1D1D1] border-t-[3px] border-t-[#D83B01] p-3">
                  <div className="text-[11px] text-[#605E5C] font-semibold">المستهلك والمعلق</div>
                  <div className="flex items-center gap-3 mt-1">
                    <div>
                      <span className="text-xs text-[#8A8886]">المستهلك: </span>
                      <strong className="text-sm font-bold text-[#323130]">{selectedBalance.consumedBalance}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-[#8A8886]">قيد الاعتماد: </span>
                      <strong className="text-sm font-bold text-[#D83B01]">{selectedBalance.pendingBalance}</strong>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#8A8886] mt-1">
                    إجمالي المخصص السنوي: {selectedBalance.allocatedBalance} {selectedBalance.unit}
                  </div>
                </div>

                {/* Tile 4: Quick Action */}
                <div className="bg-white border-x border-b border-[#D1D1D1] border-t-[3px] border-t-[#0078D4] p-3 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-[#323130]">إجراء مباشر</div>
                    <div className="text-[10px] text-[#605E5C] mt-0.5">تقديم طلب على هذا الرصيد مباشرة</div>
                  </div>
                  <button
                    onClick={() => onOpenNewLeaveDialog(selectedBalance.leaveTypeCode)}
                    className="w-full mt-2 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>طلب إجازة {selectedBalance.leaveTypeTitle.split(' ')[0]}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* FastTab 1: Movements History Grid */}
            <div className="p-3">
              <D365FastTab
                title={`سجل الحركات التاريخية للأرصدة (${selectedBalance?.leaveTypeTitle})`}
                summary={`${transactions.length} حركات مسجلة`}
                defaultExpanded={true}
              >
                <D365DataGrid
                  columns={txnColumns}
                  data={transactions}
                  keyExtractor={(t) => t.id}
                  searchPlaceholder="بحث في رقم المرجع أو نوع الحركة أو الملاحظات..."
                  emptyMessage="لا توجد حركات مسجلة لهذا النوع من الإجازات."
                />
              </D365FastTab>

              {/* FastTab 2: Accrual Policy & Rules */}
              <D365FastTab
                title="سياسات وشروط استحقاق الإجازات (Dynamics 365 Leave Policy)"
                summary="القواعد واللوائح التنظيمية"
                defaultExpanded={false}
              >
                <div className="text-xs text-[#605E5C] leading-relaxed space-y-2 p-2 bg-[#FAF9F8] border border-[#EDEBE9]">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#107C41] shrink-0 mt-0.5" />
                    <span>يتم احتساب الرصيد الدوري في اليوم الأول من كل شهر ميلادي بموجب جدول رواتب المؤسسة.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#107C41] shrink-0 mt-0.5" />
                    <span>الحد الأقصى للرصيد المرحل لنهاية العام المالي هو 15 يوماً فقط وفقاً لنظام العمل.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#107C41] shrink-0 mt-0.5" />
                    <span>يلزم تقديم طلب الإجازة الاعتيادية قبل 5 أيام عمل على الأقل لتمكين تسليم المهام للموظف البديل.</span>
                  </div>
                </div>
              </D365FastTab>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
