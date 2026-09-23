import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  CheckSquare,
  Square
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface D365DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowSelect?: (item: T) => void;
  selectedIds?: string[];
  emptyMessage?: string;
  searchPlaceholder?: string;
  filterProperty?: (item: T, query: string) => boolean;
  actions?: (row: T) => React.ReactNode;
  title?: string;
}

export function D365DataGrid<T>({
  columns,
  data,
  keyExtractor,
  onRowSelect,
  selectedIds = [],
  emptyMessage = 'لا توجد سجلات مطابقة في النظام.',
  searchPlaceholder = 'تصفية وبحث في السجلات...',
  filterProperty,
  actions,
  title,
}: D365DataGridProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    if (filterProperty) {
      return data.filter((item) => filterProperty(item, searchQuery.toLowerCase()));
    }
    return data.filter((item: any) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery, filterProperty]);

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortAsc ? -1 : 1;
      return sortAsc ? 1 : -1;
    });
  }, [filteredData, sortKey, sortAsc]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white border border-[#D1D1D1] text-xs">
      {/* Grid Toolbar */}
      <div className="bg-[#FAF9F8] border-b border-[#D1D1D1] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        {title && <span className="font-semibold text-xs text-[#323130]">{title}</span>}

        <div className="flex items-center gap-2 mr-auto">
          <div className="relative w-64">
            <input
              type="text"
              aria-label={searchPlaceholder || 'بحث في السجلات'}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-7 pl-7 pr-2.5 text-xs bg-white text-[#323130] placeholder-[#605E5C] border border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[#605E5C]" aria-hidden="true" />
          </div>

          <div className="text-[11px] text-[#605E5C] font-mono px-2 py-1 bg-white border border-[#D1D1D1]">
            السجلات: {sortedData.length}
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[#F3F2F1] border-b border-[#D1D1D1] text-[#323130]">
              <th className="w-8 px-2 py-2 text-center border-l border-[#EDEBE9]">
                <span className="text-[10px] text-[#605E5C]">#</span>
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  onKeyDown={(e) => {
                    if (col.sortable !== false && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSort(col.key);
                    }
                  }}
                  tabIndex={col.sortable !== false ? 0 : undefined}
                  role={col.sortable !== false ? 'button' : undefined}
                  aria-label={col.sortable !== false ? `ترتيب حسب ${col.header}` : undefined}
                  className={`px-3 py-2 font-semibold text-[11px] text-[#323130] border-l border-[#EDEBE9] focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none ${
                    col.sortable !== false ? 'cursor-pointer hover:bg-[#EDEBE9]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span className="text-[#605E5C]">
                        {sortKey === col.key ? (
                          sortAsc ? <ChevronUp className="w-3 h-3 text-[#0078D4]" /> : <ChevronDown className="w-3 h-3 text-[#0078D4]" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="w-24 px-3 py-2 font-semibold text-[11px] text-[#323130] text-center">
                  الإجراءات
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDEBE9]">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 2 : 1)}
                  className="py-10 text-center text-[#605E5C] bg-[#FAF9F8]"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Filter className="w-6 h-6 text-[#605E5C]" />
                    <span className="text-xs">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => {
                const rowKey = keyExtractor(row);
                const isSelected = selectedIds.includes(rowKey);
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowSelect?.(row)}
                    className={`transition-colors border-b border-[#EDEBE9] ${
                      isSelected ? 'bg-[#EFF6FC]' : idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F8]'
                    } hover:bg-[#F3F2F1] cursor-pointer`}
                  >
                    <td className="w-8 px-2 py-2 text-center text-[11px] text-[#8A8886] border-l border-[#EDEBE9]">
                      {idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-3 py-2 text-xs text-[#323130] border-l border-[#EDEBE9] truncate max-w-xs"
                      >
                        {col.render ? col.render(row, idx) : (row as any)[col.key]}
                      </td>
                    ))}
                    {actions && (
                      <td
                        className="px-3 py-2 text-xs text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Grid Footer Bar */}
      <div className="bg-[#FAF9F8] border-t border-[#D1D1D1] px-3 py-1.5 flex items-center justify-between text-[11px] text-[#605E5C]">
        <span>
          عرض {sortedData.length} من أصل {data.length} سجل
        </span>
        <span className="font-mono text-[#8A8886]">
          Microsoft Dynamics 365 Data Grid v10.0.38
        </span>
      </div>
    </div>
  );
}
