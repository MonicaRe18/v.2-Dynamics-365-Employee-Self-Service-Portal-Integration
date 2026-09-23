import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface D365TabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export const D365Tabs: React.FC<D365TabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  className = '',
}) => {
  return (
    <div
      role="tablist"
      aria-label="أقسام النظام الرئيسية"
      className={`bg-white border-b border-[#D1D1D1] px-4 flex items-center gap-1 overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none ${
              isActive
                ? 'border-[#0078D4] text-[#0078D4] font-semibold bg-[#FAF9F8]'
                : 'border-transparent text-[#605E5C] hover:text-[#323130] hover:bg-[#F3F2F1]'
            }`}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-none font-bold ${
                  isActive ? 'bg-[#0078D4] text-white' : 'bg-[#EDEBE9] text-[#605E5C]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
