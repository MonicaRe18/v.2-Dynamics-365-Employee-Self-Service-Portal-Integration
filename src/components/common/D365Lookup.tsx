import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, User } from 'lucide-react';

export interface LookupOption {
  id: string;
  code: string;
  label: string;
  secondary?: string;
  extra?: string;
}

interface D365LookupProps {
  label: string;
  options: LookupOption[];
  value: string;
  onChange: (value: string, selectedOption?: LookupOption) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export const D365Lookup: React.FC<D365LookupProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'اختر من القائمة...',
  required = false,
  disabled = false,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerId = React.useId();

  const selectedOption = options.find((opt) => opt.id === value || opt.code === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.code.toLowerCase().includes(search.toLowerCase()) ||
      (opt.secondary && opt.secondary.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative mb-3 text-right" ref={containerRef}>
      <label htmlFor={triggerId} className="block text-xs font-semibold text-[#323130] mb-1">
        {label} {required && <span className="text-[#A80000]">*</span>}
      </label>

      {/* Lookup Trigger Input */}
      <div
        id={triggerId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape' && isOpen) {
            e.preventDefault();
            setIsOpen(false);
          }
        }}
        className={`flex items-center justify-between h-8 px-2.5 bg-white border ${
          isOpen ? 'border-[#0078D4] ring-1 ring-[#0078D4]' : 'border-[#8A8886]'
        } text-xs text-[#323130] cursor-pointer hover:border-[#323130] transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none ${
          disabled ? 'bg-[#F3F2F1] cursor-not-allowed opacity-60' : ''
        }`}
      >
        <span className="truncate">
          {selectedOption ? (
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-[#0078D4] text-[11px] font-bold">[{selectedOption.code}]</span>
              <span>{selectedOption.label}</span>
            </span>
          ) : (
            <span className="text-[#605E5C]">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#605E5C]" aria-hidden="true" />
      </div>

      {helperText && <p className="text-[11px] text-[#605E5C] mt-0.5">{helperText}</p>}

      {/* D365 Lookup Dropdown Modal / Flyout */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute right-0 left-0 mt-1 bg-white border border-[#D1D1D1] shadow-xl z-50 text-right animate-in fade-in duration-100"
        >
          {/* Search box inside lookup */}
          <div className="p-2 bg-[#F3F2F1] border-b border-[#D1D1D1]">
            <div className="relative">
              <input
                type="text"
                autoFocus
                aria-label="بحث في الخيارات"
                placeholder="بحث بالرمز أو الاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-7 pr-7 pl-2 text-xs bg-white text-[#323130] placeholder-[#605E5C] border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] outline-none"
              />
              <Search className="w-3.5 h-3.5 absolute right-2 top-2 text-[#605E5C]" aria-hidden="true" />
            </div>
          </div>

          {/* Options Table */}
          <div className="max-h-56 overflow-y-auto divide-y divide-[#EDEBE9]">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-[#605E5C]">لا توجد نتائج مطابقة</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value || opt.code === value;
                return (
                  <div
                    key={opt.id}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => {
                      onChange(opt.id, opt);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onChange(opt.id, opt);
                        setIsOpen(false);
                        setSearch('');
                      }
                    }}
                    className={`p-2 flex items-center justify-between text-xs hover:bg-[#F3F2F1] cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none ${
                      isSelected ? 'bg-[#EFF6FC] font-semibold text-[#0078D4]' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] px-1 bg-[#EDEBE9] text-[#323130] font-bold">
                          {opt.code}
                        </span>
                        <span className="text-[#323130]">{opt.label}</span>
                      </div>
                      {opt.secondary && <div className="text-[10px] text-[#605E5C] mt-0.5">{opt.secondary}</div>}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#0078D4]" aria-hidden="true" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
