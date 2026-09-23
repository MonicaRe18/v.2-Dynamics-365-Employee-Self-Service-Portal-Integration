import React, { useEffect } from 'react';
import { X, Layers } from 'lucide-react';

interface D365DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  tertiaryActionLabel?: string;
  onTertiaryAction?: () => void;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const D365Dialog: React.FC<D365DialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled = false,
  secondaryActionLabel = 'إلغاء',
  onSecondaryAction,
  tertiaryActionLabel,
  onTertiaryAction,
  maxWidth = '2xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 animate-in fade-in duration-150"
    >
      <div
        className={`w-full ${maxWidthClasses} bg-white border border-[#D1D1D1] shadow-2xl flex flex-col max-h-[90vh] text-right`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* D365 Dialog Header */}
        <div className="bg-[#002050] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#00173a]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#0078D4]" aria-hidden="true"></div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
              {subtitle && <p className="text-[11px] text-[#C8C6C4] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#003366] text-[#C8C6C4] hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            title="إغلاق (Esc)"
            aria-label="إغلاق النافذة"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Dialog Body (Scrollable) */}
        <div className="p-4 overflow-y-auto flex-1 text-xs text-[#323130] bg-[#FAF9F8]">
          {children}
        </div>

        {/* D365 Dialog Footer */}
        <div className="bg-[#F3F2F1] border-t border-[#D1D1D1] px-4 py-2.5 flex items-center justify-between gap-2">
          <div>
            {tertiaryActionLabel && onTertiaryAction && (
              <button
                type="button"
                onClick={onTertiaryAction}
                className="px-3 py-1.5 bg-white hover:bg-[#EDEBE9] border border-[#8A8886] text-xs text-[#323130] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
              >
                {tertiaryActionLabel}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {primaryActionLabel && onPrimaryAction && (
              <button
                type="button"
                onClick={onPrimaryAction}
                disabled={primaryActionDisabled}
                className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] active:bg-[#005A9E] disabled:bg-[#C8C6C4] disabled:text-[#605E5C] text-xs font-semibold text-white transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
              >
                {primaryActionLabel}
              </button>
            )}

            <button
              type="button"
              onClick={onSecondaryAction || onClose}
              className="px-4 py-1.5 bg-white hover:bg-[#EDEBE9] border border-[#8A8886] text-xs text-[#323130] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
            >
              {secondaryActionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
