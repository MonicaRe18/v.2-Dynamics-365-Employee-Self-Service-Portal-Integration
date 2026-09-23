import React from 'react';
import { Calendar } from 'lucide-react';

interface D365DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  helperText?: string;
}

export const D365DateField: React.FC<D365DateFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  min,
  max,
  helperText,
}) => {
  const generatedId = React.useId();

  return (
    <div className="mb-3 text-right">
      <label htmlFor={generatedId} className="block text-xs font-semibold text-[#323130] mb-1">
        {label} {required && <span className="text-[#A80000]">*</span>}
      </label>
      <div className="relative">
        <input
          id={generatedId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          min={min}
          max={max}
          className="w-full h-8 px-2.5 bg-white text-[#323130] text-xs border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none disabled:bg-[#F3F2F1] disabled:cursor-not-allowed transition-colors font-mono"
        />
      </div>
      {helperText && <p className="text-[11px] text-[#605E5C] mt-0.5">{helperText}</p>}
    </div>
  );
};
