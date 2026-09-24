import React, { useState } from 'react';
import {
  AlertTriangle,
  Server,
  RefreshCw,
  Key,
  Database,
  ExternalLink,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface D365ConfigurationAlertProps {
  isConfigured: boolean;
  missingFields: string[];
  errorMessage?: string | null;
  onRefresh: () => void;
  isChecking?: boolean;
}

export const D365ConfigurationAlert: React.FC<D365ConfigurationAlertProps> = ({
  isConfigured,
  missingFields,
  errorMessage,
  onRefresh,
  isChecking = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (isConfigured) {
    return null;
  }

  const sampleEnv = `# Microsoft Dynamics 365 Backend Configuration (.env)
D365Settings__BaseUrl="https://<your-org>.operations.dynamics.com"
D365Settings__TenantId="00000000-0000-0000-0000-000000000000"
D365Settings__ClientId="00000000-0000-0000-0000-000000000000"
D365Settings__ClientSecret="YourAzureAppRegistrationSecret"
D365Settings__LegalEntity="USMF"
D365Settings__UseDemoMode="false"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleEnv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      dir="rtl"
      className="bg-white border-2 border-[#A4262C] shadow-md my-3 mx-4 rounded-none overflow-hidden"
    >
      {/* Alert Header */}
      <div className="bg-[#FDF3F2] border-b border-[#F19999] px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#A4262C] text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#A4262C] text-sm sm:text-base">
                تكوين Microsoft Dynamics 365 غير متوفر (Configuration Missing)
              </span>
              <span className="bg-[#A4262C] text-white text-[11px] px-2 py-0.5 font-bold">
                الوضع التجريبي معطل (Demo Mode Disabled)
              </span>
            </div>
            <p className="text-xs text-[#605E5C] mt-0.5">
              {errorMessage ||
                'لم يتم تحديد بيانات الربط الفعلية مع بيئة Dynamics 365 في متغيرات بيئة الخادم الخلفي (ASP.NET Core). لن يتم عرض أية بيانات تجريبية وهمية.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isChecking}
            className="px-3 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'جارٍ الفحص...' : 'إعادة فحص الاتصال'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-[#EDEBE9] text-[#605E5C] transition-colors"
            title={isExpanded ? 'طي التفاصيل' : 'توسيع التفاصيل'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-[#FAF9F8] text-xs text-[#323130]">
          {/* Missing Keys Notice */}
          <div className="bg-white border border-[#EDEBE9] p-3">
            <div className="font-bold text-[#323130] flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-[#A4262C]" />
              <span>متغيرات البيئة المفقودة أو التي تحتوي على قيم نائبة (Missing Environment Variables):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {missingFields.map((field, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 bg-[#FFF4CE] text-[#797673] border border-[#FED9CC] px-2.5 py-1.5 font-mono text-[11px]"
                >
                  <span className="w-2 h-2 rounded-full bg-[#D83B01] shrink-0" />
                  <span className="font-semibold text-[#A4262C]">{field}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-[#EDEBE9] p-3">
              <div className="font-bold text-[#323130] flex items-center gap-1.5 mb-1.5">
                <Server className="w-4 h-4 text-[#0078D4]" />
                <span>المعمارية الأمنية (Backend-Only Authentication):</span>
              </div>
              <p className="text-[#605E5C] text-[11px] leading-relaxed">
                تطبيق React SPA يتصل حصرياً بالواجهة الخلفية <code className="bg-[#F3F2F1] px-1 py-0.5 font-mono text-[#0078D4]">/api/d365</code> (خادم ASP.NET Core 8 Web API). لا يتم تخزين أو تمرير أسرار Dynamics 365 (Tenant ID, Client Secret) في كود العميل لحماية سرية النظام.
              </p>
            </div>

            <div className="bg-white border border-[#EDEBE9] p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-bold text-[#323130] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#0078D4]" />
                  <span>نموذج إعداد متغيرات البيئة (.env):</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-[11px] text-[#0078D4] hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#107C41]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ النموذج'}</span>
                </button>
              </div>
              <pre className="bg-[#1E1E1E] text-[#D4D4D4] p-2 font-mono text-[10.5px] overflow-x-auto text-left dir-ltr">
                {sampleEnv}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
