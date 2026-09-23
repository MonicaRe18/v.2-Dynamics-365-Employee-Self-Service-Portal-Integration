import React from 'react';
import { LucideIcon } from 'lucide-react';

interface D365TileProps {
  title: string;
  count: number | string;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'warning' | 'success' | 'neutral' | 'info';
  onClick?: () => void;
  badge?: string;
}

export const D365Tile: React.FC<D365TileProps> = ({
  title,
  count,
  unit,
  subtitle,
  icon: Icon,
  variant = 'primary',
  onClick,
  badge,
}) => {
  const getAccentBorder = () => {
    switch (variant) {
      case 'warning':
        return 'border-t-[3px] border-t-[#D83B01]';
      case 'success':
        return 'border-t-[3px] border-t-[#107C41]';
      case 'info':
        return 'border-t-[3px] border-t-[#0078D4]';
      case 'neutral':
        return 'border-t-[3px] border-t-[#8A8886]';
      default:
        return 'border-t-[3px] border-t-[#0078D4]';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'warning':
        return 'text-[#D83B01] bg-[#FDF3F2]';
      case 'success':
        return 'text-[#107C41] bg-[#DFF6DD]';
      case 'info':
        return 'text-[#0078D4] bg-[#EFF6FC]';
      default:
        return 'text-[#0078D4] bg-[#EFF6FC]';
    }
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${title}: ${count} ${unit || ''}` : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`bg-white border-x border-b border-[#D1D1D1] ${getAccentBorder()} p-3.5 transition-all ${
        onClick
          ? 'cursor-pointer hover:border-[#0078D4] hover:bg-[#FAF9F8] hover:shadow-xs active:bg-[#F3F2F1] focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none'
          : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-semibold text-[#605E5C] mb-1.5 flex items-center gap-1.5">
            <span>{title}</span>
            {badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EDEBE9] text-[#0078D4]">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-sans text-[#201F1E] tracking-tight">{count}</span>
            {unit && <span className="text-xs font-medium text-[#605E5C]">{unit}</span>}
          </div>
          {subtitle && (
            <div className="text-[11px] text-[#605E5C] mt-1 truncate">{subtitle}</div>
          )}
        </div>

        {Icon && (
          <div className={`p-2 ${getIconColor()} rounded-none shrink-0`} aria-hidden="true">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};
