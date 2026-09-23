import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Layers,
  Server,
  Key,
  Database,
  ExternalLink
} from 'lucide-react';
import { D365Dialog } from '../common/D365Dialog';
import { d365Service } from '../../services/d365Service';

interface D365ApiInspectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const D365ApiInspectorDialog: React.FC<D365ApiInspectorDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<'HcmLeaveRequest' | 'HcmDisciplinaryGrievance' | 'HcmCourseEvaluation'>(
    'HcmLeaveRequest'
  );
  const [copied, setCopied] = useState(false);

  const sampleLeavePayload = d365Service.generateODataPayload('HcmLeaveRequest', {
    leaveTypeCode: 'ANNUAL',
    startDate: '2026-10-04',
    endDate: '2026-10-08',
    requestedDays: 5,
    delegatedEmployeeId: 'EMP-10773',
    socialInsuranceOption: true,
    healthInsuranceOption: true,
    notes: 'تم التنسيق لتسليم المهام للموظف البديل.',
  });

  const sampleGrievancePayload = d365Service.generateODataPayload('HcmDisciplinaryGrievance', {
    penaltyId: 'DISC-2025-014',
    grievanceDate: '2026-09-21',
    grievanceSubject: 'التظلم من قرار لفت النظر لثبوت العذر القهري',
    grievanceDetails: 'تفاصيل الدفوع القانونية والمستندات الداعمة لموقف الموظف...',
  });

  const sampleEvaluationPayload = d365Service.generateODataPayload('HcmCourseEvaluation', {
    courseId: 'CRS-D365-FO-ARCH',
    trainerKnowledge: 'ممتاز',
    trainerEngagement: 'ممتاز',
    courseContent: 'جيد جداً',
    overallProgramEvaluation: 'ممتاز',
    programDuration: 'جيد جداً',
  });

  const getCurrentPayload = () => {
    switch (selectedEntity) {
      case 'HcmLeaveRequest':
        return sampleLeavePayload;
      case 'HcmDisciplinaryGrievance':
        return sampleGrievancePayload;
      case 'HcmCourseEvaluation':
        return sampleEvaluationPayload;
    }
  };

  const getEndpointUrl = () => {
    const base = 'https://contoso.operations.dynamics.com/data';
    switch (selectedEntity) {
      case 'HcmLeaveRequest':
        return `${base}/LeaveAndAbsenceRequests`;
      case 'HcmDisciplinaryGrievance':
        return `${base}/DisciplinaryGrievances`;
      case 'HcmCourseEvaluation':
        return `${base}/CourseEvaluations`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(getCurrentPayload(), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <D365Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Microsoft Dynamics 365 Finance & Operations - OData v4 Integration Architecture"
      subtitle="المعمارية التقنية ونموذج الربط عبر واجهات برمجة التطبيقات (API & Data Entities)"
      maxWidth="4xl"
      secondaryActionLabel="إغلاق"
      onSecondaryAction={onClose}
    >
      <div className="space-y-4 text-xs">
        {/* Architecture Specs Banner */}
        <div className="bg-[#FAF9F8] border border-[#D1D1D1] p-3 text-[#323130]">
          <div className="font-bold text-xs text-[#0078D4] mb-1.5 flex items-center gap-1.5">
            <Server className="w-4 h-4" />
            <span>مواصفات الربط المعماري مع Microsoft Dynamics 365:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-[#605E5C] mt-2">
            <div className="p-2 bg-white border border-[#EDEBE9]">
              <strong className="text-[#323130] block">بروتوكول الواجهة:</strong>
              <span>OData v4 REST Protocol (JSON)</span>
            </div>
            <div className="p-2 bg-white border border-[#EDEBE9]">
              <strong className="text-[#323130] block">طريقة المصادقة (Auth):</strong>
              <span>Azure Active Directory (OAuth 2.0 Bearer Token)</span>
            </div>
            <div className="p-2 bg-white border border-[#EDEBE9]">
              <strong className="text-[#323130] block">نطاق الكيان (DataAreaId):</strong>
              <span className="font-mono text-[#0078D4] font-bold">usmf / Cross-Company Enabled</span>
            </div>
          </div>
        </div>

        {/* Entity Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-[#D1D1D1] pb-2">
          <button
            onClick={() => setSelectedEntity('HcmLeaveRequest')}
            className={`px-3 py-1.5 font-semibold text-xs transition-colors ${
              selectedEntity === 'HcmLeaveRequest'
                ? 'bg-[#0078D4] text-white shadow-xs'
                : 'bg-white hover:bg-[#F3F2F1] text-[#605E5C] border border-[#8A8886]'
            }`}
          >
            LeaveAndAbsenceRequests (طلب إجازة)
          </button>

          <button
            onClick={() => setSelectedEntity('HcmDisciplinaryGrievance')}
            className={`px-3 py-1.5 font-semibold text-xs transition-colors ${
              selectedEntity === 'HcmDisciplinaryGrievance'
                ? 'bg-[#0078D4] text-white shadow-xs'
                : 'bg-white hover:bg-[#F3F2F1] text-[#605E5C] border border-[#8A8886]'
            }`}
          >
            DisciplinaryGrievances (تظلم على جزاء)
          </button>

          <button
            onClick={() => setSelectedEntity('HcmCourseEvaluation')}
            className={`px-3 py-1.5 font-semibold text-xs transition-colors ${
              selectedEntity === 'HcmCourseEvaluation'
                ? 'bg-[#0078D4] text-white shadow-xs'
                : 'bg-white hover:bg-[#F3F2F1] text-[#605E5C] border border-[#8A8886]'
            }`}
          >
            CourseEvaluations (تقييم دورة تدريبية)
          </button>
        </div>

        {/* Endpoint URL Box */}
        <div className="bg-white border border-[#D1D1D1] p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] overflow-hidden">
            <span className="px-1.5 py-0.5 bg-[#0078D4] text-white font-mono font-bold">POST</span>
            <span className="font-mono text-[#323130] truncate dir-ltr">{getEndpointUrl()}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F3F2F1] border border-[#8A8886] text-xs text-[#0078D4] font-medium transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#107C41]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ JSON'}</span>
          </button>
        </div>

        {/* JSON Payload Viewer */}
        <div className="bg-[#1E1E1E] text-[#D4D4D4] p-3 font-mono text-[11px] overflow-x-auto max-h-72 dir-ltr text-left border border-[#333]">
          <pre>{JSON.stringify(getCurrentPayload(), null, 2)}</pre>
        </div>

        {/* D365 Field Mapping Table */}
        <div className="bg-white border border-[#D1D1D1] p-3">
          <div className="font-bold text-xs text-[#323130] mb-2">
            جدول مطابقة حقول البوابة مع كائنات مايكروسوفت ديناميكس 365 (Field Mapping):
          </div>
          <table className="w-full text-right border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1]">
                <th className="p-1.5 border-l border-[#EDEBE9]">حقل البوابة (Portal UI Field)</th>
                <th className="p-1.5 border-l border-[#EDEBE9]">حقل كائن ديناميكس (D365 Entity Property)</th>
                <th className="p-1.5 border-l border-[#EDEBE9]">نوع البيانات (EDT / Type)</th>
                <th className="p-1.5">جدول المصدر (D365 AxTable)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEBE9] text-[#605E5C]">
              <tr>
                <td className="p-1.5 font-semibold text-[#323130]">الرقم الوظيفي</td>
                <td className="p-1.5 font-mono text-[#0078D4]">PersonnelNumber</td>
                <td className="p-1.5 font-mono">HcmPersonnelNumberId</td>
                <td className="p-1.5 font-mono">HcmWorker</td>
              </tr>
              <tr>
                <td className="p-1.5 font-semibold text-[#323130]">نوع الإجازة</td>
                <td className="p-1.5 font-mono text-[#0078D4]">LeaveTypeId</td>
                <td className="p-1.5 font-mono">HcmLeaveTypeId</td>
                <td className="p-1.5 font-mono">HcmLeaveType</td>
              </tr>
              <tr>
                <td className="p-1.5 font-semibold text-[#323130]">تاريخ البدء والانتهاء</td>
                <td className="p-1.5 font-mono text-[#0078D4]">StartDate / EndDate</td>
                <td className="p-1.5 font-mono">TransDate</td>
                <td className="p-1.5 font-mono">HcmLeaveRequest</td>
              </tr>
              <tr>
                <td className="p-1.5 font-semibold text-[#323130]">الموظف البديل</td>
                <td className="p-1.5 font-mono text-[#0078D4]">DelegatedWorkerPersonnelNumber</td>
                <td className="p-1.5 font-mono">HcmPersonnelNumberId</td>
                <td className="p-1.5 font-mono">HcmWorker</td>
              </tr>
              <tr>
                <td className="p-1.5 font-semibold text-[#323130]">حالة سير العمل</td>
                <td className="p-1.5 font-mono text-[#0078D4]">WorkflowState</td>
                <td className="p-1.5 font-mono">Enum: HcmLeaveWorkflowState</td>
                <td className="p-1.5 font-mono">WorkflowTrackingStatusTable</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </D365Dialog>
  );
};
