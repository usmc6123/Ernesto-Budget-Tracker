import { Expense } from '../types';
import { formatCurrency, CAT_COLORS } from '../lib/utils';
import { Trash2, RefreshCw } from 'lucide-react';

interface EntriesListProps {
  expenses: Expense[];
  activeMonthName: string;
  onDeleteExpense: (id: string) => Promise<void>;
  isReadOnly: boolean;
}

export function EntriesList({
  expenses,
  activeMonthName,
  onDeleteExpense,
  isReadOnly,
}: EntriesListProps) {
  // Take up to 30 most recent entries
  const displayedExpenses = expenses.slice(0, 30);

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert('There are no entries to export for this month.');
      return;
    }

    // Prepare headers and map rows
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Recurring', 'Notes'];
    const rows = expenses.map((e) => [
      e.date,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount,
      e.isRecurring ? 'Yes' : 'No',
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `budget-2026-${activeMonthName.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto bg-[var(--bg2)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 shadow-md" id="ledger-entries-section">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[var(--accent)] font-bold flex items-center gap-2">
          <span>Recent Entries Log</span>
        </div>
        <button
          id="export-csv-btn"
          onClick={handleExportCSV}
          className="w-full sm:w-auto px-4 py-2 border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--bone)] text-[11px] sm:text-xs font-mono uppercase tracking-widest text-[var(--text2)] rounded-lg transition-colors bg-[var(--bg3)] cursor-pointer"
        >
          ↓ Export CSV Sheet
        </button>
      </div>

      <div className="flex flex-col divide-y divide-[var(--line)] overflow-hidden">
        {displayedExpenses.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono tracking-widest uppercase text-[var(--text3)]" id="empty-ledger-notice">
            No entries logged for this period
          </div>
        ) : (
          displayedExpenses.map((e) => {
            const isDeletable = !isReadOnly && !e.imported;
            const categoryColor = CAT_COLORS[e.category] || '#888888';

            return (
              <div
                key={e.id}
                id={`entry-${e.id}`}
                className="flex justify-between items-center py-4 first:pt-0 last:pb-0 hover:bg-[var(--bg3)]/30 px-2 rounded-lg transition-colors"
              >
                <div className="flex-grow min-w-0 pr-4">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-sans text-[13px] sm:text-sm font-semibold text-[var(--text)] truncate">
                      {e.description}
                    </span>
                    {e.isRecurring && (
                      <RefreshCw size={11} className="text-[var(--accent)] flex-shrink-0 animate-spin-slow" />
                    )}
                    {e.imported && (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text3)] border border-[var(--line)] px-1.5 py-0.5 rounded">
                        imported
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-[var(--text2)]">
                    <span>{e.date}</span>
                    <span className="text-[var(--muted)]">·</span>
                    <span
                      style={{ color: categoryColor }}
                      className="font-bold uppercase tracking-wider text-[11px]"
                    >
                      {e.category}
                    </span>
                    {e.note && (
                      <>
                        <span className="text-[var(--muted)]">·</span>
                        <span className="truncate italic text-[var(--text3)] max-w-xs">{e.note}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="font-mono text-sm sm:text-base font-bold tabular-nums text-[var(--over)]">
                    {formatCurrency(e.amount)}
                  </span>

                  {isDeletable ? (
                    <button
                      id={`delete-entry-btn-${e.id}`}
                      onClick={() => onDeleteExpense(e.id)}
                      className="p-2 text-[var(--text3)] hover:text-[var(--over)] hover:bg-[var(--bg4)] rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    // Balanced spacer to keep layout aligned
                    <div className="w-[32px]" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default EntriesList;
