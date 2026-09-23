import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface D365FastTabProps {
  title: string;
  summary?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export const D365FastTab: React.FC<D365FastTabProps> = ({
  title,
  summary,
  defaultExpanded = true,
  children,
  headerActions,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-white border border-[#D1D1D1] mb-3 ${className}`}>
      {/* FastTab Header Bar */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${title}، ${isExpanded ? 'موسع' : 'مطوي'}`}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="px-4 py-2.5 bg-white hover:bg-[#F3F2F1] cursor-pointer flex items-center justify-between transition-colors border-b border-transparent data-[expanded=true]:border-[#D1D1D1] focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
        data-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="p-1 text-[#605E5C] transition-colors flex items-center justify-center"
            aria-hidden="true"
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#0078D4]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#605E5C]" />
            )}
          </span>
          <span className="font-semibold text-xs text-[#323130] tracking-wide">{title}</span>
        </div>

        <div className="flex items-center gap-3">
          {summary && !isExpanded && (
            <span className="text-[11px] text-[#605E5C] bg-[#F5F5F5] px-2 py-0.5 border border-[#EDEBE9] truncate max-w-xs">
              {summary}
            </span>
          )}
          {headerActions && (
            <div
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {headerActions}
            </div>
          )}
        </div>
      </div>

      {/* FastTab Body */}
      {isExpanded && <div className="p-4 bg-white border-t border-[#EDEBE9] text-xs">{children}</div>}
    </div>
  );
};
