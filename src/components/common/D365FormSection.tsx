import React from 'react';

interface D365FormSectionProps {
  title?: string;
  columns?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export const D365FormSection: React.FC<D365FormSectionProps> = ({
  title,
  columns = 2,
  children,
  className = '',
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
  }[columns];

  return (
    <div className={`mb-4 ${className}`}>
      {title && (
        <div className="text-xs font-bold text-[#323130] pb-1.5 mb-3 border-b border-[#EDEBE9] flex items-center gap-2">
          <div className="w-1.5 h-3 bg-[#0078D4]"></div>
          <span>{title}</span>
        </div>
      )}
      <div className={`grid ${gridClasses} gap-x-4 gap-y-1`}>{children}</div>
    </div>
  );
};
