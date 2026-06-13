import React, { useState } from 'react';
import { Expense } from '../types';
import { formatCurrency, CAT_COLORS } from '../lib/utils';
import { Trash2, RefreshCw, Layers, Search, ChevronDown, ChevronUp, Star } from 'lucide-react';

interface EntriesListProps {
  expenses: Expense[];
  activeMonthName: string;
  onDeleteExpense: (id: string) => Promise<void>;
  onUpdateExpense?: (id: string, updates: Partial<Expense>) => Promise<void>;
  isReadOnly: boolean;
}

export function EntriesList({
  expenses,
  activeMonthName,
  onDeleteExpense,
  onUpdateExpense,
  isReadOnly,
}: EntriesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<{ [id: string]: boolean }>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleFlag = async (e: React.MouseEvent, item: Expense) => {
    e.stopPropagation(); // Avoid triggering row collapse
    if (isReadOnly || !onUpdateExpense) return;
    try {
      await onUpdateExpense(item.id, { flagged: !item.flagged });
    } catch (err) {
      console.error('Failed to change flag state:', err);
    }
  };

  // Safe escape function for search regex
  const escapeRegExp = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Real-time search filtering matching description, category, date, note
  const filteredExpenses = expenses.filter((e) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      e.description.toLowerCase().includes(query) ||
      e.category.toLowerCase().includes(query) ||
      e.date.toLowerCase().includes(query) ||
      (e.note || '').toLowerCase().includes(query)
    );
  });

  // Take up to 30 most recent entries matching filter query
  const displayedExpenses = filteredExpenses.slice(0, 30);

  // Highlighting of matched terms function
  const highlightText = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-transparent text-[#ffb020] font-extrabold underline decoration-1">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('There are no entries to export.');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Recurring', 'Split', 'Flagged', 'Notes'];
    const rows = filteredExpenses.map((e) => [
      e.date,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount,
      e.isRecurring ? 'Yes' : 'No',
      e.isSplit ? 'Yes' : 'No',
      e.flagged ? 'Yes' : 'No',
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ledger-export-${activeMonthName.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto bg-[var(--bg2)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 shadow-md" id="ledger-entries-section">
      {/* Header controls layout */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[var(--accent)] font-bold flex items-center gap-2">
          <span>Recent Entries Log</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Collapsible search bar */}
          {!isSearchExpanded && searchQuery === '' ? (
            <button
              onClick={() => setIsSearchExpanded(true)}
              id="expand-search-btn"
              className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[var(--accent)] hover:underline uppercase self-end cursor-pointer text-right flex items-center gap-1.5 py-2 px-3 border border-[#2d281f] hover:border-[#ffb020]/25 rounded-xl bg-[#100f0d]"
            >
              <Search size={12} /> Search Entries
            </button>
          ) : (
            <div className="relative w-full sm:w-64 animate-fade-in" id="search-input-container">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)] pointer-events-none">
                <Search size={13} />
              </span>
              <input
                type="text"
                placeholder="search names, dates, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-[var(--bg3)] border border-[var(--line)] text-[var(--text)] rounded-xl text-[10px] sm:text-xs font-mono uppercase outline-none focus:border-[#ffb020] placeholder-zinc-700 shadow-inner"
                autoFocus
                onBlur={() => {
                  if (searchQuery === '') setIsSearchExpanded(false);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchExpanded(false);
                  }}
                  id="clear-search-btn"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[var(--accent)] text-sm cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          )}

          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="w-full sm:w-auto px-4 py-2 border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--bone)] text-[11px] sm:text-xs font-mono uppercase tracking-widest text-[var(--text2)] rounded-lg transition-colors bg-[var(--bg3)] cursor-pointer text-center"
          >
            ↓ CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-[var(--line)] overflow-hidden">
        {displayedExpenses.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono tracking-widest uppercase text-zinc-600" id="empty-ledger-notice">
            {searchQuery ? 'No entries matching search' : 'No entries logged for this period'}
          </div>
        ) : (
          displayedExpenses.map((e) => {
            const isDeletable = !isReadOnly && !e.imported;
            const categoryColor = CAT_COLORS[e.category] || '#888888';
            const isExpanded = !!expandedRows[e.id];

            return (
              <div
                key={e.id}
                id={`entry-${e.id}`}
                className={`flex flex-col py-4 first:pt-0 last:pb-0 hover:bg-[#100f0d]/30 px-2 rounded-lg transition-all border-l-2 ${
                  e.flagged 
                    ? 'border-[#ffb020] bg-[#1a160e]/20 shadow-[0_2px_10px_rgba(255,176,32,0.02)]' 
                    : 'border-transparent'
                }`}
              >
                {/* Main clickable transaction info section */}
                <div 
                  onClick={() => toggleRow(e.id)}
                  className="flex justify-between items-center cursor-pointer select-none"
                >
                  <div className="flex-grow min-w-0 pr-4">
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <span className="font-sans text-[13px] sm:text-sm font-bold text-[var(--text)] truncate">
                        {highlightText(e.description, searchQuery)}
                      </span>
                      
                      {/* Badge templates */}
                      {e.flagged && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-black bg-[#ffb020] px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 shadow-sm">
                          <Star size={8} fill="currentColor" /> Priority
                        </span>
                      )}
                      {e.isRecurring && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#ffb020] border border-[#ffb020]/20 px-1.5 py-0.5 rounded bg-[#ffb020]/5 flex items-center gap-0.5">
                          <RefreshCw size={8} /> Recurring
                        </span>
                      )}
                      {e.isSplit && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#ffe099] border border-[#ffe099]/20 px-1.5 py-0.5 rounded bg-[#ffe099]/5 flex items-center gap-0.5 font-bold">
                          <Layers size={8} /> Split
                        </span>
                      )}
                      {e.imported && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text3)] border border-[var(--line)] px-1.5 py-0.5 rounded">
                          imported
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-[var(--text2)]">
                      <span>{highlightText(e.date, searchQuery)}</span>
                      <span className="text-[var(--muted)]">·</span>
                      <span
                        style={{ color: categoryColor }}
                        className="font-bold uppercase tracking-wider text-[11px]"
                      >
                        {highlightText(e.category, searchQuery)}
                      </span>
                      {e.note && !isExpanded && (
                        <>
                          <span className="text-[var(--muted)]">·</span>
                          <span className="truncate italic text-[var(--text3)] max-w-xs">{highlightText(e.note, searchQuery)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Price tag */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-sm sm:text-base font-black tabular-nums text-[var(--over)]">
                      {formatCurrency(e.amount)}
                    </span>
                    
                    <div className="text-[var(--text3)] hover:text-white transition">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </div>
                </div>

                {/* Sub row: collapsed notes and flag modifiers */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3.5 border-t border-[#221e17] text-left font-mono text-[10px] uppercase tracking-wider space-y-3 animate-fade-in bg-[#100f0d]/40 p-3 rounded-xl border border-[#221e17]">
                    
                    {/* Notes Detail */}
                    <div className="flex flex-col gap-1">
                      <div className="text-zinc-600 font-bold">Ledger Notes:</div>
                      <div className="text-[#fcfaf2] italic text-[11px] font-medium leading-relaxed font-mono">
                        {e.note ? highlightText(e.note, searchQuery) : 'No description note entered'}
                      </div>
                    </div>

                    {/* Meta creation items */}
                    <div className="grid grid-cols-2 gap-3 text-[9px] border-t border-[#1a1814] pt-2.5">
                      <div>
                        <span className="text-zinc-600 font-bold block">Calculation Date</span>
                        <span className="text-[var(--text2)] mt-0.5 block">{e.date}</span>
                      </div>
                      <div>
                        <span className="text-zinc-600 font-bold block">Timestamp Ingress</span>
                        <span className="text-[9px] text-[var(--text3)] font-mono mt-0.5 block">
                          {new Date(e.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions button strip */}
                    <div className="flex justify-between items-center border-t border-[#1a1814] pt-3 mt-1 gap-2">
                      <div className="flex gap-2">
                        {onUpdateExpense && !isReadOnly && (
                          <button
                            type="button"
                            onClick={(evt) => handleToggleFlag(evt, e)}
                            className={`px-3 py-1.5 rounded-lg border text-[9px] uppercase tracking-widest font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
                              e.flagged
                                ? 'bg-[#ffb020]/20 border-[#ffb020]/40 text-[#ffb020] hover:bg-[#ffb020]/30'
                                : 'bg-[#181612] border-[#221e17] text-zinc-500 hover:text-white hover:border-zinc-700'
                            }`}
                          >
                            <Star size={10} fill={e.flagged ? 'currentColor' : 'none'} />
                            {e.flagged ? 'Unflag' : 'Flag Priority'}
                          </button>
                        )}
                      </div>

                      {isDeletable && (
                        <button
                          id={`delete-entry-btn-${e.id}`}
                          onClick={() => onDeleteExpense(e.id)}
                          className="px-2.5 py-1.5 border border-transparent hover:border-[#ef4444]/20 text-zinc-500 hover:text-[#ef4444] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={11} /> Delete Entry
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default EntriesList;
