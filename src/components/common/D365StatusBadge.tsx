import React from 'react';

interface D365StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const D365StatusBadge: React.FC<D365StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
}) => {
  const getBadgeStyle = () => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'معتمد':
      case 'completed':
      case 'مكتمل':
      case 'attended':
      case 'تم الحضور':
      case 'نجاح':
        return 'bg-[#DFF6DD] text-[#107C41] border border-[#107C41]/40';

      case 'inreview':
      case 'submitted':
      case 'قيد الاعتماد':
      case 'قيد المراجعة':
      case 'قيد الدراسة':
      case 'قيد التظلم والمراجعة':
      case 'قيد المعالجة':
        return 'bg-[#EFF6FC] text-[#0078D4] border border-[#0078D4]/40';

      case 'draft':
      case 'مسودة':
      case 'pending':
      case 'معلق':
      case 'pendingevaluation':
        return 'bg-[#FFF4CE] text-[#5C4A00] border border-[#FDE300]/60';

      case 'rejected':
      case 'مرفوض':
      case 'canceled':
      case 'ملغى':
      case 'error':
        return 'bg-[#FDF3F2] text-[#A80000] border border-[#A80000]/40';

      case 'active':
      case 'نافذ':
      case 'على رأس العمل - نشط':
        return 'bg-[#EFF6FC] text-[#005A9E] border border-[#0078D4]/30 font-semibold';

      default:
        return 'bg-[#F3F2F1] text-[#605E5C] border border-[#D1D1D1]';
    }
  };

  const displayLabel = label || status;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-medium ${sizeClasses} ${getBadgeStyle()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      <span>{displayLabel}</span>
    </span>
  );
};
