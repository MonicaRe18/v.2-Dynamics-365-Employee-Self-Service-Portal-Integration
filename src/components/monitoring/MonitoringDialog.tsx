import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileCheck,
  Activity,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
  Upload,
  FileText,
  AlertCircle,
  Search,
  Filter,
  Eye,
  X,
  Paperclip,
  Download,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Send,
  Sparkles,
} from 'lucide-react';
import { D365Dialog } from '../common/D365Dialog';
import {
  MonitoringOperation,
  MonitoringOperationType,
  MonitoringRequestStatus,
  MonitoringAttachment,
} from '../../types/d365.types';
import { exportToCsv } from '../../utils/exportUtils';
import { d365Service } from '../../services/d365Service';

interface MonitoringDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operations: MonitoringOperation[];
  initialMode?: 'records' | 'disclosure' | 'test';
  onSuccess?: (message: string) => void;
}

export const MonitoringDialog: React.FC<MonitoringDialogProps> = ({
  isOpen,
  onClose,
  operations,
  initialMode = 'records',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'records' | 'disclosure' | 'test'>('records');
  const [filterType, setFilterType] = useState<'ALL' | 'FINANCIAL_DISCLOSURE' | 'DRUG_TEST'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | MonitoringRequestStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected record for viewing details
  const [selectedRecord, setSelectedRecord] = useState<MonitoringOperation | null>(null);

  // Active request being completed by employee
  const [completingRequest, setCompletingRequest] = useState<MonitoringOperation | null>(null);

  // Form states for Financial Disclosure
  const [disclosureType, setDisclosureType] = useState('دوري (كل 5 سنوات)');
  const [filingYear, setFilingYear] = useState('2026');
  const [disclosureEntity, setDisclosureEntity] = useState('إدارة الكسب غير المشروع - وزارة العدل');
  const [realEstateSummary, setRealEstateSummary] = useState('');
  const [movableAssetsSummary, setMovableAssetsSummary] = useState('');
  const [cashAndDepositsSummary, setCashAndDepositsSummary] = useState('');
  const [debtsAndLiabilitiesSummary, setDebtsAndLiabilitiesSummary] = useState('');
  const [disclosureDeclarationChecked, setDisclosureDeclarationChecked] = useState(false);
  const [disclosureAttachments, setDisclosureAttachments] = useState<MonitoringAttachment[]>([
    {
      id: 'ATT-INIT-1',
      fileName: 'كشف_حساب_البنك_الاهلي_2026.pdf',
      fileSize: '1.5 MB',
      uploadDate: '2026-09-21',
      category: 'كشف حساب بنكي',
    },
    {
      id: 'ATT-INIT-2',
      fileName: 'صورة_بطاقة_الرقم_القومي.pdf',
      fileSize: '650 KB',
      uploadDate: '2026-09-21',
      category: 'إثبات شخصية',
    },
  ]);
  const [disclosureError, setDisclosureError] = useState<string | null>(null);

  // Form states for Drug / Medical Test
  const [testType, setTestType] = useState('فحص دوري شامل للكشف عن المخدرات');
  const [testDate, setTestDate] = useState('2026-09-21');
  const [testEntity, setTestEntity] = useState('صندوق مكافحة وعلاج الإدمان - المعامل المركزية');
  const [reportNumber, setReportNumber] = useState('');
  const [testResult, setTestResult] = useState('سلبي (لائق طبياً وخالٍ من المواد المخدرة)');
  const [testNotes, setTestNotes] = useState('');
  const [testDeclarationChecked, setTestDeclarationChecked] = useState(false);
  const [testAttachments, setTestAttachments] = useState<MonitoringAttachment[]>([
    {
      id: 'ATT-INIT-3',
      fileName: 'تقرير_التحليل_المعملي_المعتمد.pdf',
      fileSize: '1.8 MB',
      uploadDate: '2026-09-21',
      category: 'تقرير طبي',
    },
  ]);
  const [testError, setTestError] = useState<string | null>(null);

  // States for completion modal
  const [completionAttachments, setCompletionAttachments] = useState<MonitoringAttachment[]>([]);
  const [completionField1, setCompletionField1] = useState('');
  const [completionField2, setCompletionField2] = useState('');
  const [completionField3, setCompletionField3] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionDeclaration, setCompletionDeclaration] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  // Synced initial tab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setSelectedRecord(null);
      setCompletingRequest(null);
      setDisclosureError(null);
      setTestError(null);
      setCompletionError(null);
    }
  }, [isOpen, initialMode]);

  // Handle open completion for a specific pending request
  const handleOpenCompletion = (req: MonitoringOperation) => {
    setCompletingRequest(req);
    setCompletionError(null);
    setCompletionDeclaration(false);

    // Prepopulate attachments
    if (req.attachments && req.attachments.length > 0) {
      setCompletionAttachments([...req.attachments]);
    } else {
      // Default sample attachments based on type
      if (req.operationType === 'FINANCIAL_DISCLOSURE') {
        setCompletionAttachments([
          {
            id: `ATT-${Date.now()}-1`,
            fileName: 'كشف_حسابات_بنكية_معتمد_2026.pdf',
            fileSize: '1.4 MB',
            uploadDate: new Date().toISOString().split('T')[0],
            category: 'حسابات بنكية',
          },
          {
            id: `ATT-${Date.now()}-2`,
            fileName: 'صورة_بطاقة_الرقم_القومي_سارية.pdf',
            fileSize: '750 KB',
            uploadDate: new Date().toISOString().split('T')[0],
            category: 'إثبات شخصية',
          },
        ]);
        setCompletionField1('شقة سكنية مملوكة بالعقار رقم 14 - قطعة أرض فضاء مسجلة');
        setCompletionField2('حساب جاري ووديعة ادخارية بالبنك الأهلي المصري');
        setCompletionField3('سيارة ملاكي موديل 2023 - مصوغات ذهبية');
      } else {
        setCompletionAttachments([
          {
            id: `ATT-${Date.now()}-3`,
            fileName: 'تقرير_المعامل_المركزية_لتحليل_السموم.pdf',
            fileSize: '2.2 MB',
            uploadDate: new Date().toISOString().split('T')[0],
            category: 'تقرير طبي معتمد',
          },
        ]);
        setCompletionField1(req.entity || 'صندوق مكافحة وعلاج الإدمان - المعامل المركزية');
        setCompletionField2(`DT-MED-${Math.floor(10000 + Math.random() * 90000)}`);
        setCompletionField3('سلبي (لائق طبياً وخالٍ من المواد المخدرة)');
      }
    }
  };

  const handleAddSampleAttachment = (name: string, category: string) => {
    const newAtt: MonitoringAttachment = {
      id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fileName: `${name.replace(/\s+/g, '_')}.pdf`,
      fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      category,
    };
    setCompletionAttachments((prev) => [newAtt, ...prev]);
  };

  const handleRemoveAttachment = (attId: string) => {
    setCompletionAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSubmitCompletedRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingRequest) return;

    if (completionAttachments.length === 0) {
      setCompletionError('يلزم إرفاق مستند أو تقرير واحد على الأقل لتقديم مرفقات الطلب.');
      return;
    }

    if (!completionDeclaration) {
      setCompletionError('يجب الموافقة على التعهد والإقرار بصحة البيانات والمرفقات المقدمة.');
      return;
    }

    setCompletionError(null);

    const submittedData =
      completingRequest.operationType === 'FINANCIAL_DISCLOSURE'
        ? {
            realEstateSummary: 'تم تقديم إقرار الذمة المالية والكشوفات المعتمدة بالمرفقات الرسمية',
            cashAndDepositsSummary: 'مرفق المستندات والوثائق البنكية',
            movableAssetsSummary: '',
            notes: completionNotes,
          }
        : {
            entity: completingRequest.entity,
            reportNumber: 'مرفق بالتقرير والتحليل الطبي المعتمد',
            medicalResult: 'قيد فحص واعتماد اللجنة الطبية',
            testNotes: completionNotes,
          };

    await d365Service.completeMonitoringRequest(
      completingRequest.id,
      submittedData,
      completionAttachments
    );

    onSuccess?.(
      `تم استكمال الطلب رقم ${completingRequest.referenceNumber} وتقديم المرفقات بنجاح وتغيير الحالة إلى "تم التقديم"`
    );
    setCompletingRequest(null);
    setActiveTab('records');
  };

  // Status transition simulation inside Details modal
  const handleTransitionStatus = async (
    requestId: string,
    nextStatus: MonitoringRequestStatus,
    note?: string
  ) => {
    const res = await d365Service.updateMonitoringRequestStatus(requestId, nextStatus, note);
    if (res.isSuccess && res.data) {
      setSelectedRecord({ ...res.data });
      onSuccess?.(`تم تحديث حالة الطلب إلى "${nextStatus}" بنجاح.`);
    }
  };

  // Filtered operations
  const filteredOperations = operations.filter((op) => {
    const matchesType =
      filterType === 'ALL' ||
      (filterType === 'FINANCIAL_DISCLOSURE' && op.operationType === 'FINANCIAL_DISCLOSURE') ||
      (filterType === 'DRUG_TEST' && op.operationType === 'DRUG_TEST');

    const matchesStatus = filterStatus === 'ALL' || op.status === filterStatus;

    const matchesSearch =
      searchQuery === '' ||
      op.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.entity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.details.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  const pendingCount = operations.filter((o) => o.status === 'استكمل المطلوب').length;
  const submittedCount = operations.filter((o) => o.status === 'تم التقديم').length;
  const inReviewCount = operations.filter((o) => o.status === 'جاري المراجعة').length;
  const completedCount = operations.filter((o) => o.status === 'مكتمل / مستوفي').length;

  const handleExport = () => {
    exportToCsv(
      'D365_Compliance_Monitoring_Requests',
      filteredOperations.map((op) => ({
        'رقم الطلب / المرجع': op.referenceNumber,
        'نوع الإجراء': op.category,
        'عنوان الطلب': op.actionTitle,
        'تاريخ التكليف': op.timestamp,
        'تاريخ الاستحقاق': op.dueDate || '-',
        'الجهة المختصة': op.entity,
        'حالة الطلب': op.status,
        'النتيجة / الإفادة': op.result || '-',
        'عدد المرفقات': op.attachmentsCount || (op.attachments ? op.attachments.length : 0),
        'تفاصيل الطلب': op.details,
      }))
    );
  };

  const handleDisclosureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realEstateSummary.trim() && !cashAndDepositsSummary.trim() && !movableAssetsSummary.trim()) {
      setDisclosureError('يرجى تعبئة بيان الأصول أو الحسابات أو الأملاك المنقولة على الأقل.');
      return;
    }
    if (!disclosureDeclarationChecked) {
      setDisclosureError('يجب الموافقة على إقرار وتعهد صحة البيانات القانونية والمرفقات.');
      return;
    }

    setDisclosureError(null);
    const res = await d365Service.submitFinancialDisclosure({
      disclosureType,
      filingYear,
      entity: disclosureEntity,
      realEstateSummary,
      cashAndDepositsSummary,
      movableAssetsSummary,
      debtsAndLiabilitiesSummary,
      attachments: disclosureAttachments,
      attachmentsCount: disclosureAttachments.length,
    });

    if (res.isSuccess && res.data) {
      onSuccess?.(
        `تم تقديم إقرار الذمة المالية بنجاح برقم: ${res.data.referenceNumber} وحالته "تم التقديم"`
      );
      setRealEstateSummary('');
      setMovableAssetsSummary('');
      setCashAndDepositsSummary('');
      setDebtsAndLiabilitiesSummary('');
      setDisclosureDeclarationChecked(false);
      setActiveTab('records');
    } else {
      setDisclosureError(res.error || 'فشل في حفظ إقرار الذمة المالية.');
    }
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNumber.trim()) {
      setTestError('يرجى إدخال رقم التقرير الطبي المعتمد.');
      return;
    }
    if (!testDeclarationChecked) {
      setTestError('يجب الإقرار بصحة التقرير والجهة الطبية المعتمدة والمرفق المقدم.');
      return;
    }

    setTestError(null);
    const res = await d365Service.submitDrugOrMedicalTest({
      testType,
      testDate,
      entity: testEntity,
      reportNumber,
      result: testResult,
      notes: testNotes,
      attachments: testAttachments,
      attachmentsCount: testAttachments.length,
    });

    if (res.isSuccess && res.data) {
      onSuccess?.(
        `تم تقديم نتيجة اختبار الكشف والمخدرات بنجاح برقم: ${res.data.referenceNumber} وحالته "تم التقديم"`
      );
      setReportNumber('');
      setTestNotes('');
      setTestDeclarationChecked(false);
      setActiveTab('records');
    } else {
      setTestError(res.error || 'فشل في تسجيل نتيجة الفحص الطبي.');
    }
  };

  // Status Badge UI helper
  const renderStatusBadge = (status: MonitoringRequestStatus) => {
    switch (status) {
      case 'استكمل المطلوب':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#FFF4CE] text-[#797673] border border-[#FFB900]">
            <AlertTriangle className="w-3 h-3 text-[#D83B01]" />
            <span>استكمل المطلوب</span>
          </span>
        );
      case 'تم التقديم':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-[#EFF6FC] text-[#0078D4] border border-[#C7E0F4]">
            <Send className="w-3 h-3 text-[#0078D4]" />
            <span>تم التقديم</span>
          </span>
        );
      case 'جاري المراجعة':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-[#F3F2F1] text-[#5C2D91] border border-[#D1D1D1]">
            <Clock className="w-3 h-3 text-[#5C2D91]" />
            <span>جاري المراجعة</span>
          </span>
        );
      case 'مكتمل / مستوفي':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#DFF6DD] text-[#107C41] border border-[#107C41]">
            <CheckCircle2 className="w-3 h-3 text-[#107C41]" />
            <span>مكتمل / مستوفي</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#EDEBE9] text-[#323130]">
            {status}
          </span>
        );
    }
  };

  return (
    <D365Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="طلبات الرقابة والامتثال (إقرارات الذمة المالية واختبارات المخدرات)"
      subtitle="سجل ومتابعة واستكمال طلبات إقرارات الذمة المالية واختبارات الكشف الدوري والمخدرات وتقديم المرفقات"
      maxWidth="4xl"
      secondaryActionLabel="إغلاق"
      onSecondaryAction={onClose}
      tertiaryActionLabel={activeTab === 'records' ? 'تصدير إلى Excel' : undefined}
      onTertiaryAction={activeTab === 'records' ? handleExport : undefined}
    >
      <div className="space-y-3">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#D1D1D1] bg-[#FAF9F8] px-2 pt-2 gap-1 text-xs">
          <button
            onClick={() => {
              setActiveTab('records');
              setCompletingRequest(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 border-b-2 border-[#0078D4] text-[#0078D4] bg-white font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>طلبات الرقابة والامتثال ({operations.length})</span>
            {pendingCount > 0 && (
              <span className="bg-[#D83B01] text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingCount} مطلوب استكماله
              </span>
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OPERATIONS / REQUESTS LIST                         */}
        {/* ========================================================= */}
        {activeTab === 'records' && !completingRequest && (
          <div className="space-y-3">
            {/* Status Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setFilterStatus(filterStatus === 'استكمل المطلوب' ? 'ALL' : 'استكمل المطلوب')}
                className={`p-2 border text-right transition-all flex items-center justify-between ${
                  filterStatus === 'استكمل المطلوب'
                    ? 'border-[#FFB900] bg-[#FFF4CE] shadow-xs'
                    : 'border-[#EDEBE9] bg-[#FFFBF0] hover:border-[#FFB900]'
                }`}
              >
                <div>
                  <span className="text-[11px] text-[#797673] block font-semibold">استكمل المطلوب</span>
                  <strong className="text-base text-[#D83B01] font-mono">{pendingCount}</strong>
                </div>
                <AlertTriangle className="w-4 h-4 text-[#D83B01]" />
              </button>

              <button
                onClick={() => setFilterStatus(filterStatus === 'تم التقديم' ? 'ALL' : 'تم التقديم')}
                className={`p-2 border text-right transition-all flex items-center justify-between ${
                  filterStatus === 'تم التقديم'
                    ? 'border-[#0078D4] bg-[#EFF6FC] shadow-xs'
                    : 'border-[#EDEBE9] bg-[#F9FCFF] hover:border-[#0078D4]'
                }`}
              >
                <div>
                  <span className="text-[11px] text-[#0078D4] block font-semibold">تم التقديم</span>
                  <strong className="text-base text-[#0078D4] font-mono">{submittedCount}</strong>
                </div>
                <Send className="w-4 h-4 text-[#0078D4]" />
              </button>

              <button
                onClick={() => setFilterStatus(filterStatus === 'جاري المراجعة' ? 'ALL' : 'جاري المراجعة')}
                className={`p-2 border text-right transition-all flex items-center justify-between ${
                  filterStatus === 'جاري المراجعة'
                    ? 'border-[#5C2D91] bg-[#F6F4F9] shadow-xs'
                    : 'border-[#EDEBE9] bg-[#FAF9FB] hover:border-[#5C2D91]'
                }`}
              >
                <div>
                  <span className="text-[11px] text-[#5C2D91] block font-semibold">جاري المراجعة</span>
                  <strong className="text-base text-[#5C2D91] font-mono">{inReviewCount}</strong>
                </div>
                <Clock className="w-4 h-4 text-[#5C2D91]" />
              </button>

              <button
                onClick={() => setFilterStatus(filterStatus === 'مكتمل / مستوفي' ? 'ALL' : 'مكتمل / مستوفي')}
                className={`p-2 border text-right transition-all flex items-center justify-between ${
                  filterStatus === 'مكتمل / مستوفي'
                    ? 'border-[#107C41] bg-[#DFF6DD] shadow-xs'
                    : 'border-[#EDEBE9] bg-[#F4FAF4] hover:border-[#107C41]'
                }`}
              >
                <div>
                  <span className="text-[11px] text-[#107C41] block font-semibold">مكتمل / مستوفي</span>
                  <strong className="text-base text-[#107C41] font-mono">{completedCount}</strong>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[#107C41]" />
              </button>
            </div>

            {/* Quick action bar & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[#F3F2F1] p-2 border border-[#D1D1D1]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#323130]">
                  طلبات الموظف (استكمال الإقرارات والاختبارات المطلوبة والمرفقات)
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8A8886] absolute right-2 top-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث برقم الطلب أو الجهة..."
                    className="h-7 pr-7 pl-2 text-[11px] bg-white border border-[#8A8886] focus:border-[#0078D4] outline-none w-44"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="h-7 px-2 text-[11px] bg-white border border-[#8A8886] focus:border-[#0078D4] outline-none"
                >
                  <option value="ALL">كافة الإجراءات</option>
                  <option value="FINANCIAL_DISCLOSURE">إقرارات الذمة المالية</option>
                  <option value="DRUG_TEST">اختبارات المخدرات</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="h-7 px-2 text-[11px] bg-white border border-[#8A8886] focus:border-[#0078D4] outline-none font-semibold text-[#0078D4]"
                >
                  <option value="ALL">كافة الحالات</option>
                  <option value="استكمل المطلوب">استكمل المطلوب</option>
                  <option value="تم التقديم">تم التقديم</option>
                  <option value="جاري المراجعة">جاري المراجعة</option>
                  <option value="مكتمل / مستوفي">مكتمل / مستوفي</option>
                </select>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white border border-[#D1D1D1] overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1] text-[#323130] font-semibold">
                    <th className="p-2.5 border-l border-[#D1D1D1]">رقم الطلب / المرجع</th>
                    <th className="p-2.5 border-l border-[#D1D1D1]">نوع الطلب والإجراء</th>
                    <th className="p-2.5 border-l border-[#D1D1D1]">الجهة المختصة</th>
                    <th className="p-2.5 border-l border-[#D1D1D1]">التكليف / الاستحقاق</th>
                    <th className="p-2.5 border-l border-[#D1D1D1]">المرفقات</th>
                    <th className="p-2.5 text-center border-l border-[#D1D1D1]">حالة الطلب</th>
                    <th className="p-2.5 text-center">الإجراء المطلوب</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOperations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#8A8886]">
                        لا توجد طلبات مطابقة للبحث أو التصفية المختارة.
                      </td>
                    </tr>
                  ) : (
                    filteredOperations.map((op) => {
                      const attsCount =
                        op.attachmentsCount || (op.attachments ? op.attachments.length : 0);
                      const isPendingCompletion = op.status === 'استكمل المطلوب';

                      return (
                        <tr
                          key={op.id}
                          className={`border-b border-[#EDEBE9] transition-colors ${
                            isPendingCompletion
                              ? 'bg-[#FFFDF6] hover:bg-[#FFF8E6]'
                              : 'hover:bg-[#FAF9F8]'
                          }`}
                        >
                          <td className="p-2.5 border-l border-[#EDEBE9] font-mono font-bold text-[#0078D4] whitespace-nowrap">
                            {op.referenceNumber}
                          </td>

                          <td className="p-2.5 border-l border-[#EDEBE9]">
                            <div className="flex items-center gap-1.5">
                              {op.operationType === 'FINANCIAL_DISCLOSURE' ? (
                                <FileCheck className="w-4 h-4 text-[#0078D4] shrink-0" />
                              ) : (
                                <Activity className="w-4 h-4 text-[#107C41] shrink-0" />
                              )}
                              <div>
                                <strong className="block text-[#323130]">{op.category}</strong>
                                <span className="text-[11px] text-[#605E5C] line-clamp-1">
                                  {op.actionTitle}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-2.5 border-l border-[#EDEBE9] text-[#323130]">
                            <span className="line-clamp-1">{op.entity}</span>
                          </td>

                          <td className="p-2.5 border-l border-[#EDEBE9] text-[#605E5C] whitespace-nowrap">
                            <div className="font-mono text-[11px]">{op.timestamp.split(' ')[0]}</div>
                            {op.dueDate && (
                              <span className="text-[10px] text-[#D83B01] font-semibold block">
                                المهلة: {op.dueDate}
                              </span>
                            )}
                          </td>

                          <td className="p-2.5 border-l border-[#EDEBE9] text-[#323130] whitespace-nowrap">
                            <div className="flex items-center gap-1 text-[11px]">
                              <Paperclip className="w-3.5 h-3.5 text-[#0078D4]" />
                              <span>{attsCount} ملفات</span>
                            </div>
                          </td>

                          <td className="p-2.5 text-center border-l border-[#EDEBE9] whitespace-nowrap">
                            {renderStatusBadge(op.status)}
                          </td>

                          <td className="p-2.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {isPendingCompletion ? (
                                <button
                                  onClick={() => handleOpenCompletion(op)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-[#0078D4] hover:bg-[#106EBE] text-white text-[11px] font-bold shadow-xs transition-colors"
                                  title="استكمال الطلب وتقديم المرفقات"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>استكمال الطلب</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedRecord(op)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F3F2F1] text-[#0078D4] border border-[#0078D4] text-[11px] font-semibold transition-colors"
                                  title="عرض تفاصيل الطلب والمرفقات"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>التفاصيل</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL / VIEW: COMPLETING A REQUEST (استكمال الطلب والمرفقات) */}
        {/* ========================================================= */}
        {completingRequest && (
          <form onSubmit={handleSubmitCompletedRequest} className="space-y-4">
            {/* Header Box */}
            <div className="p-3 bg-[#EFF6FC] border border-[#0078D4] flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#FFF4CE] text-[#797673] border border-[#FFB900] text-[11px] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-[#D83B01]" />
                    <span>الحالة الحالية: استكمل المطلوب</span>
                  </span>
                  <strong className="text-sm font-bold text-[#0078D4]">
                    استكمال بيانات ومرفقات الطلب ({completingRequest.referenceNumber})
                  </strong>
                </div>
                <p className="text-[#323130] leading-relaxed">
                  <strong>التكليف:</strong> {completingRequest.details}
                </p>
                <div className="flex items-center gap-4 text-[#605E5C] text-[11px] pt-1">
                  <span>
                    <strong>الجهة:</strong> {completingRequest.entity}
                  </span>
                  {completingRequest.dueDate && (
                    <span className="text-[#D83B01] font-bold">
                      <strong>تاريخ أقصى مهلة:</strong> {completingRequest.dueDate}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCompletingRequest(null)}
                aria-label="إغلاق نموذج استكمال الطلب"
                className="p-1 hover:bg-[#C7E0F4] rounded text-[#605E5C] focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {completionError && (
              <div className="p-2.5 bg-[#FDE7E9] border border-[#A80000] text-[#A80000] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{completionError}</span>
              </div>
            )}

            {/* Form Content: Attachments and Declaration */}
            <div className="bg-white border border-[#D1D1D1] p-4 space-y-4 text-xs">
              {/* ATTACHMENTS HUB */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EDEBE9] pb-2">
                  <div className="font-bold text-[#323130] text-xs flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-[#0078D4]" />
                    <span>تقديم مرفقات الطلب والمستندات الرسمية ({completionAttachments.length} مرفوعة)</span>
                  </div>
                </div>

                {/* Required checklist box */}
                {completingRequest.requiredAttachmentsList && (
                  <div className="p-2.5 bg-[#FAF9F8] border border-[#D1D1D1] text-[11px] space-y-1">
                    <span className="font-bold text-[#323130] block">المستندات المطلوبة للطلب:</span>
                    <ul className="list-disc list-inside text-[#605E5C] space-y-0.5">
                      {completingRequest.requiredAttachmentsList.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Dropzone & Quick add sample files */}
                <div className="border-2 border-dashed border-[#0078D4] bg-[#F9FCFF] p-3 text-center">
                  <Upload className="w-6 h-6 text-[#0078D4] mx-auto mb-1" />
                  <span className="text-[#323130] font-semibold block text-xs">
                    قم بسحب وإفلات ملفات المرفقات هنا أو استخدام الإضافة السريعة أدناه
                  </span>
                  <span className="text-[#8A8886] text-[11px]">يدعم PDF, PNG, JPG بحد أقصى 10 ميجابايت للملف</span>

                  <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
                    {completingRequest.operationType === 'FINANCIAL_DISCLOSURE' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAddSampleAttachment('كشف_حساب_بنكي_معتمد_2026', 'حسابات بنكية')}
                          className="px-2.5 py-1 bg-white hover:bg-[#F3F2F1] text-[#0078D4] border border-[#0078D4] text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ إرفاق كشف حساب بنكي</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSampleAttachment('عقد_ملكية_شقة_سكنية', 'أصول عقارية')}
                          className="px-2.5 py-1 bg-white hover:bg-[#F3F2F1] text-[#0078D4] border border-[#0078D4] text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ إرفاق عقد ملكية عقار</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSampleAttachment('صورة_بطاقة_الرقم_القومي', 'إثبات شخصية')}
                          className="px-2.5 py-1 bg-white hover:bg-[#F3F2F1] text-[#0078D4] border border-[#0078D4] text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ إرفاق صورة الرقم القومي</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAddSampleAttachment('تقرير_المعامل_المركزية_المعتمد', 'تقرير طبي')}
                          className="px-2.5 py-1 bg-white hover:bg-[#F3F2F1] text-[#107C41] border border-[#107C41] text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ إرفاق تقرير المعامل المركزية</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSampleAttachment('إفادة_سحب_العينة_المختومة', 'إفادة حضور')}
                          className="px-2.5 py-1 bg-white hover:bg-[#F3F2F1] text-[#107C41] border border-[#107C41] text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ إرفاق إفادة سحب العينة</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Uploaded attachments list */}
                {completionAttachments.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-[#605E5C] font-semibold block">
                      المرفقات الجاهزة للتقديم:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {completionAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2 bg-[#FAF9F8] border border-[#D1D1D1] text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-[#0078D4] shrink-0" />
                            <div className="overflow-hidden">
                              <span className="font-semibold text-[#323130] truncate block text-[11px]">
                                {att.fileName}
                              </span>
                              <span className="text-[10px] text-[#8A8886]">
                                {att.category} • {att.fileSize} • {att.uploadDate}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="text-[#A80000] hover:bg-[#FDE7E9] p-1 rounded transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-[#A80000] focus-visible:outline-none"
                            title="حذف المرفق"
                            aria-label={`حذف المرفق ${att.fileName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-2 text-[11px] text-[#A80000] bg-[#FFF4F4] border border-[#FDE7E9]">
                    لم يتم تقديم أي مرفقات حتى الآن. يرجى إرفاق المستندات المطلوبة لاستكمال الطلب.
                  </div>
                )}
              </div>

              {/* Optional Employee Notes */}
              <div className="pt-3 border-t border-[#EDEBE9]">
                <label className="block text-[#323130] mb-1 font-semibold text-xs">
                  ملاحظات أو إيضاحات إضافية من الموظف (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات إضافية بخصوص المستندات المرفقة أو الإفادات الرسمية المقدمة..."
                  className="w-full p-2 border border-[#8A8886] focus:border-[#0078D4] outline-none text-xs"
                />
              </div>

              {/* Step 3: Declaration */}
              <div className="pt-3 border-t border-[#EDEBE9]">
                <div className="p-3 bg-[#FFF4CE] border border-[#FFB900] flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="compl-decl"
                    checked={completionDeclaration}
                    onChange={(e) => setCompletionDeclaration(e.target.checked)}
                    className="mt-0.5 accent-[#0078D4]"
                  />
                  <label htmlFor="compl-decl" className="cursor-pointer text-[#323130] text-xs leading-relaxed">
                    <strong>إقرار وتعهد قانوني:</strong> أقر بأن جميع البيانات المالية والمرفقات
                    المقدمة صحيحة وكاملة ومطابقة للواقع، وأتحمل كامل المسؤولية القانونية والإدارية
                    المقررة بلائحة الموارد البشرية وقوانين الكسب غير المشروع ومكافحة الإدمان.
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#EDEBE9]">
                <button
                  type="button"
                  onClick={() => setCompletingRequest(null)}
                  className="px-4 py-2 bg-white hover:bg-[#EDEBE9] border border-[#8A8886] text-[#323130] font-medium"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white font-bold flex items-center gap-1.5 shadow-sm text-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>تقديم الطلب والمرفقات (تغيير الحالة إلى: تم التقديم)</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 2: FINANCIAL DISCLOSURE SUBMISSION FORM               */}
        {/* ========================================================= */}
        {activeTab === 'disclosure' && !completingRequest && (
          <form onSubmit={handleDisclosureSubmit} className="space-y-4">
            <div className="p-3 bg-[#EFF6FC] border border-[#C7E0F4] text-xs text-[#0078D4] flex items-start gap-2">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>إقرار الذمة المالية الإلزامي:</strong> طبقاً لقانون الكسب غير المشروع
                والرقابة الإدارية، يلتزم الموظف بتقديم وتحديث إقرار الذمة المالية متضمناً كافة الأموال
                العقارية والمنقولة والودائع البنكية والديون الخاصة به وبالأولاد القصر.
              </div>
            </div>

            {disclosureError && (
              <div className="p-2.5 bg-[#FDE7E9] border border-[#A80000] text-[#A80000] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{disclosureError}</span>
              </div>
            )}

            <div className="bg-white border border-[#D1D1D1] p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#605E5C] mb-1 font-semibold">
                    نوع إقرار الذمة المالية *
                  </label>
                  <select
                    value={disclosureType}
                    onChange={(e) => setDisclosureType(e.target.value)}
                    className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none"
                  >
                    <option value="دوري (كل 5 سنوات)">إقرار دوري (كل 5 سنوات)</option>
                    <option value="إقرار عند بدء التعيين">إقرار عند بدء التعيين</option>
                    <option value="إقرار نهاية الخدمة">إقرار نهاية الخدمة</option>
                    <option value="إقرار تكميلي طارئ">إقرار تكميلي طارئ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#605E5C] mb-1 font-semibold">سنة تقديم الإقرار *</label>
                  <input
                    type="number"
                    value={filingYear}
                    onChange={(e) => setFilingYear(e.target.value)}
                    min={2020}
                    max={2030}
                    className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#605E5C] mb-1 font-semibold">الجهة الرقابية المختصة *</label>
                  <input
                    type="text"
                    value={disclosureEntity}
                    onChange={(e) => setDisclosureEntity(e.target.value)}
                    className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none"
                  />
                </div>
              </div>

              {/* Assets sections */}
              <div className="space-y-3 pt-2 border-t border-[#EDEBE9]">
                <div>
                  <label className="block text-[#323130] mb-1 font-bold">
                    1. بيان العقارات والأراضي والأملاك غير المنقولة
                  </label>
                  <textarea
                    rows={2}
                    value={realEstateSummary}
                    onChange={(e) => setRealEstateSummary(e.target.value)}
                    placeholder="بيان الشقق السكنية والأراضي والعقارات المملوكة..."
                    className="w-full p-2 border border-[#8A8886] focus:border-[#0078D4] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#323130] mb-1 font-bold">
                    2. الأموال النقدية والودائع والحسابات البنكية
                  </label>
                  <textarea
                    rows={2}
                    value={cashAndDepositsSummary}
                    onChange={(e) => setCashAndDepositsSummary(e.target.value)}
                    placeholder="الأرصدة بالحسابات الجارية وحسابات التوفير والشهادات البنكية..."
                    className="w-full p-2 border border-[#8A8886] focus:border-[#0078D4] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#323130] mb-1 font-bold">
                    3. الأموال المنقولة والمركبات والمصوغات والأسهم
                  </label>
                  <textarea
                    rows={2}
                    value={movableAssetsSummary}
                    onChange={(e) => setMovableAssetsSummary(e.target.value)}
                    placeholder="السيارات المسجلة والأسهم والحصص في الشركات والمصوغات الثمينة..."
                    className="w-full p-2 border border-[#8A8886] focus:border-[#0078D4] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#323130] mb-1 font-bold">
                    4. الديون والالتزامات المالية للغير
                  </label>
                  <textarea
                    rows={2}
                    value={debtsAndLiabilitiesSummary}
                    onChange={(e) => setDebtsAndLiabilitiesSummary(e.target.value)}
                    placeholder="القروض البنكية القائمة، الأقساط أو الالتزامات المالية الواجبة السداد..."
                    className="w-full p-2 border border-[#8A8886] focus:border-[#0078D4] outline-none"
                  />
                </div>
              </div>

              {/* Attachments Section */}
              <div className="pt-2 border-t border-[#EDEBE9] space-y-2">
                <label className="block text-[#323130] font-bold">
                  تقديم مرفقات الطلب (كشوف الحسابات وصور العقود):
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {disclosureAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F2F1] border border-[#D1D1D1] text-[11px]"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-[#0078D4]" />
                      <span>{att.fileName}</span>
                      <span className="text-[#8A8886]">({att.fileSize})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="p-3 bg-[#FFF4CE] border border-[#797673] flex items-start gap-2">
                <input
                  type="checkbox"
                  id="disc-decl"
                  checked={disclosureDeclarationChecked}
                  onChange={(e) => setDisclosureDeclarationChecked(e.target.checked)}
                  className="mt-0.5 accent-[#0078D4]"
                />
                <label htmlFor="disc-decl" className="cursor-pointer text-[#323130] leading-relaxed">
                  أقر بأن كافة البيانات والمرفقات الموضحة أعلاه صحيحة وكاملة وتمثل ذمتي المالية الفعلية
                  وذمة أولادي القصر حتى تاريخه، وأتحمل كامل المسؤولية القانونية المقررة طبقاً لقانون الكسب
                  غير المشروع ولائحته التنفيذية.
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('records')}
                  className="px-4 py-2 bg-white hover:bg-[#EDEBE9] border border-[#8A8886] text-[#323130] font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>تقديم الإقرار والمرفقات (الحالة: تم التقديم)</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 3: DRUG TEST SUBMISSION FORM                          */}
        {/* ========================================================= */}
        {activeTab === 'test' && !completingRequest && (
          <form onSubmit={handleTestSubmit} className="space-y-4">
            <div className="p-3 bg-[#EFF6FC] border border-[#C7E0F4] text-xs text-[#0078D4] flex items-start gap-2">
              <Activity className="w-4 h-4 shrink-0 mt-0.5 text-[#107C41]" />
              <div>
                <strong>فحص الكشف عن المخدرات والسموم الإلزامي:</strong> طبقاً للقانون المنظم لشغل
                الوظائف العامة والاستمرار فيها، يلتزم الموظف بتقديم نتيجة الفحص الدوري الشامل المعتمد
                من صندوق مكافحة الإدمان أو المعامل المركزية لوزارة الصحة.
              </div>
            </div>

            {testError && (
              <div className="p-2.5 bg-[#FDE7E9] border border-[#A80000] text-[#A80000] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{testError}</span>
              </div>
            )}

            <div className="bg-white border border-[#D1D1D1] p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#605E5C] mb-1 font-semibold">نوع الفحص الطبي *</label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none"
                  >
                    <option value="فحص دوري شامل للكشف عن المخدرات">
                      فحص دوري شامل للكشف عن المخدرات
                    </option>
                    <option value="فحص دوري سنوي للوظائف والسموم">فحص دوري سنوي للوظائف والسموم</option>
                    <option value="فحص التحليل المفاجئ المعتمد">فحص التحليل المفاجئ المعتمد</option>
                    <option value="فحص اللياقة الطبية للترقية أو الندب">
                      فحص اللياقة الطبية للترقية أو الندب
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#605E5C] mb-1 font-semibold">تاريخ إجراء الفحص *</label>
                  <div className="flex items-center gap-2 bg-white px-2 border border-[#8A8886] h-8">
                    <Calendar className="w-4 h-4 text-[#0078D4]" />
                    <input
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="w-full outline-none font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#605E5C] mb-1 font-semibold">الجهة الطبية المعتمدة *</label>
                  <input
                    type="text"
                    value={testEntity}
                    onChange={(e) => setTestEntity(e.target.value)}
                    className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#605E5C] mb-1 font-semibold">رقم التقرير الطبي / الباركود *</label>
                  <input
                    type="text"
                    value={reportNumber}
                    onChange={(e) => setReportNumber(e.target.value)}
                    placeholder="مثال: DT-2026-98124"
                    className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#605E5C] mb-1 font-semibold">النتيجة الرسمية للاختبار *</label>
                <select
                  value={testResult}
                  onChange={(e) => setTestResult(e.target.value)}
                  className="w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none font-bold text-[#107C41]"
                >
                  <option value="سلبي (لائق طبياً وخالٍ من المواد المخدرة)">
                    سلبي (لائق طبياً وخالٍ من المواد المخدرة)
                  </option>
                  <option value="سلبي (سليم ولا توجد موانع صحية)">
                    سلبي (سليم ولا توجد موانع صحية)
                  </option>
                  <option value="إيجابي لعلاج مرخص بموجب روشتة طبية معتمدة">
                    إيجابي لعلاج مرخص بموجب روشتة طبية معتمدة
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[#605E5C] mb-1 font-semibold">ملاحظات وتوصيات اللجنة الطبية</label>
                <textarea
                  rows={2}
                  value={testNotes}
                  onChange={(e) => setTestNotes(e.target.value)}
                  placeholder="أي ملاحظات فنية أو تاريخ انتهاء سريان التقرير الطبي..."
                  className="w-full p-2 border border-[#8A8886] focus:border-[#0078D4] outline-none"
                />
              </div>

              {/* Upload report file */}
              <div>
                <label className="block text-[#323130] mb-1 font-bold">تقديم مرفق التقرير الطبي المعتمد</label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {testAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F2F1] border border-[#D1D1D1] text-[11px]"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-[#107C41]" />
                      <span>{att.fileName}</span>
                      <span className="text-[#8A8886]">({att.fileSize})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Declaration */}
              <div className="p-3 bg-[#FFF4CE] border border-[#797673] flex items-start gap-2">
                <input
                  type="checkbox"
                  id="test-decl"
                  checked={testDeclarationChecked}
                  onChange={(e) => setTestDeclarationChecked(e.target.checked)}
                  className="mt-0.5 accent-[#0078D4]"
                />
                <label htmlFor="test-decl" className="cursor-pointer text-[#323130] leading-relaxed">
                  أقر بأن تقرير الفحص الطبي المرفق صادر من جهة طبية معتمدة رسمياً ومختوم، وأتحمل كامل
                  المسؤولية عن صحة المستند ومطابقته لسجلات صندوق مكافحة الإدمان ووزارة الصحة.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('records')}
                  className="px-4 py-2 bg-white hover:bg-[#EDEBE9] border border-[#8A8886] text-[#323130] font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#107C41] hover:bg-[#0B5A2F] text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>تقديم التقرير والمرفقات (الحالة: تم التقديم)</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW DETAILS & WORKFLOW MODAL FOR SINGLE RECORD           */}
        {/* ========================================================= */}
        {selectedRecord && (
          <div className="p-3 bg-[#F9F9F9] border border-[#0078D4] space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#D1D1D1]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0078D4]" />
                <strong className="text-sm text-[#0078D4]">
                  تفاصيل طلب الرقابة ({selectedRecord.referenceNumber})
                </strong>
                {renderStatusBadge(selectedRecord.status)}
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                aria-label="إغلاق نافذة تفاصيل الطلب"
                className="p-1 hover:bg-[#EDEBE9] rounded focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
              >
                <X className="w-4 h-4 text-[#605E5C]" aria-hidden="true" />
              </button>
            </div>

            {/* Workflow Progress Stepper: 4 States */}
            <div className="bg-white p-3 border border-[#EDEBE9]">
              <span className="text-[11px] font-bold text-[#605E5C] block mb-2">
                سير تدقيق ومراحل الطلب:
              </span>
              <div className="grid grid-cols-4 gap-1 text-center">
                {/* Step 1 */}
                <div
                  className={`p-1.5 border ${
                    selectedRecord.status === 'استكمل المطلوب'
                      ? 'bg-[#FFF4CE] border-[#FFB900] text-[#D83B01] font-bold'
                      : 'bg-[#DFF6DD] border-[#107C41] text-[#107C41]'
                  }`}
                >
                  <div className="text-[10px]">1. استكمل المطلوب</div>
                  <span className="text-[9px] block">تكليف الموظف</span>
                </div>

                {/* Step 2 */}
                <div
                  className={`p-1.5 border ${
                    selectedRecord.status === 'تم التقديم'
                      ? 'bg-[#EFF6FC] border-[#0078D4] text-[#0078D4] font-bold'
                      : selectedRecord.status === 'جاري المراجعة' || selectedRecord.status === 'مكتمل / مستوفي'
                      ? 'bg-[#DFF6DD] border-[#107C41] text-[#107C41]'
                      : 'bg-[#F3F2F1] border-[#D1D1D1] text-[#8A8886]'
                  }`}
                >
                  <div className="text-[10px]">2. تم التقديم</div>
                  <span className="text-[9px] block">رفع المرفقات</span>
                </div>

                {/* Step 3 */}
                <div
                  className={`p-1.5 border ${
                    selectedRecord.status === 'جاري المراجعة'
                      ? 'bg-[#F6F4F9] border-[#5C2D91] text-[#5C2D91] font-bold'
                      : selectedRecord.status === 'مكتمل / مستوفي'
                      ? 'bg-[#DFF6DD] border-[#107C41] text-[#107C41]'
                      : 'bg-[#F3F2F1] border-[#D1D1D1] text-[#8A8886]'
                  }`}
                >
                  <div className="text-[10px]">3. جاري المراجعة</div>
                  <span className="text-[9px] block">التدقيق الرقابي</span>
                </div>

                {/* Step 4 */}
                <div
                  className={`p-1.5 border ${
                    selectedRecord.status === 'مكتمل / مستوفي'
                      ? 'bg-[#DFF6DD] border-[#107C41] text-[#107C41] font-bold'
                      : 'bg-[#F3F2F1] border-[#D1D1D1] text-[#8A8886]'
                  }`}
                >
                  <div className="text-[10px]">4. مكتمل / مستوفي</div>
                  <span className="text-[9px] block">الاعتماد النهائي</span>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <span className="text-[#605E5C] block">نوع الإجراء:</span>
                <strong className="text-[#323130]">{selectedRecord.category}</strong>
              </div>
              <div>
                <span className="text-[#605E5C] block">تاريخ التسجيل:</span>
                <span className="font-mono text-[#323130]">{selectedRecord.timestamp}</span>
              </div>
              <div>
                <span className="text-[#605E5C] block">الجهة الرقابية:</span>
                <strong className="text-[#323130]">{selectedRecord.entity}</strong>
              </div>
              <div>
                <span className="text-[#605E5C] block">النتيجة / الإفادة:</span>
                <span className="text-[#107C41] font-bold">{selectedRecord.result || 'معتمد'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#EDEBE9]">
              <span className="text-[#605E5C] block font-semibold">تفاصيل البيان الرقابي:</span>
              <p className="text-[#323130] bg-white p-2 border border-[#D1D1D1] mt-1 leading-relaxed">
                {selectedRecord.details}
              </p>
            </div>

            {/* Submitted Attachments */}
            <div className="pt-2 border-t border-[#EDEBE9]">
              <span className="text-[#605E5C] block font-semibold mb-1">
                مرفقات الطلب المعتمدة ({selectedRecord.attachments?.length || selectedRecord.attachmentsCount || 0}):
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedRecord.attachments && selectedRecord.attachments.length > 0 ? (
                  selectedRecord.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 p-1.5 bg-white border border-[#D1D1D1] text-[11px]"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-[#0078D4]" />
                      <span className="font-semibold text-[#323130]">{att.fileName}</span>
                      <span className="text-[#8A8886]">({att.fileSize})</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[#8A8886] text-[11px]">لا توجد مرفقات مسجلة بعد.</span>
                )}
              </div>
            </div>

            {/* Workflow Transition Tools (For Interactive Testing of all 4 states) */}
            <div className="pt-3 border-t border-[#EDEBE9] bg-[#FAF9F8] p-2 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-[#605E5C]">
                <strong>محاكاة تدقيق الطلب (Dynamics Workflow):</strong>
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedRecord.status === 'استكمل المطلوب' && (
                  <button
                    onClick={() => {
                      const req = selectedRecord;
                      setSelectedRecord(null);
                      handleOpenCompletion(req);
                    }}
                    className="px-2.5 py-1 bg-[#0078D4] text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>استكمال الطلب وتقديم المرفقات</span>
                  </button>
                )}

                {selectedRecord.status === 'تم التقديم' && (
                  <button
                    onClick={() =>
                      handleTransitionStatus(
                        selectedRecord.id,
                        'جاري المراجعة',
                        'بدء أعمال التدقيق والمراجعة من قبل لجنة الامتثال'
                      )
                    }
                    className="px-2.5 py-1 bg-[#5C2D91] text-white text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>نقل إلى: جاري المراجعة &larr;</span>
                  </button>
                )}

                {selectedRecord.status === 'جاري المراجعة' && (
                  <button
                    onClick={() =>
                      handleTransitionStatus(
                        selectedRecord.id,
                        'مكتمل / مستوفي',
                        'تم استيفاء وفحص كافة المستندات والمرفقات واعتماد الطلب نهائياً'
                      )
                    }
                    className="px-2.5 py-1 bg-[#107C41] text-white text-[11px] font-semibold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>اعتماد و إنهاء الطلب: مكتمل / مستوفي &larr;</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-3 py-1 bg-white hover:bg-[#EDEBE9] border border-[#8A8886] text-[#323130] text-[11px]"
                >
                  إغلاق التفاصيل
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </D365Dialog>
  );
};
