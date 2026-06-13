import { Settings } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface HeaderProps {
  onOpenSettings: () => void;
  saveStatus: 'synced' | 'saving' | 'offline';
  totalSpent?: number;
  budgetCeiling?: number;
  hideTicker?: boolean;
}

export function Header({
  onOpenSettings,
  saveStatus,
  totalSpent,
  budgetCeiling,
  hideTicker = false,
}: HeaderProps) {
  const getStatusColor = () => {
    switch (saveStatus) {
      case 'synced':
        return 'text-[var(--good)]';
      case 'saving':
        return 'text-[var(--accent)]';
      default:
        return 'text-[var(--over)]';
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'synced':
        return '● synced';
      case 'saving':
        return '● saving...';
      default:
        return '● offline';
    }
  };

  const calculateTickerColor = (spent: number, ceiling: number) => {
    if (ceiling <= 0) return 'text-[var(--text3)]';
    const pct = spent / ceiling;
    if (pct >= 1.0) return 'text-[#ef4444] font-extrabold';
    if (pct >= 0.8) return 'text-[#ffb020] animate-pulse';
    if (pct >= 0.6) return 'text-[#ffe099]';
    return 'text-[var(--text3)]';
  };

  const hasTickerValues = totalSpent !== undefined && budgetCeiling !== undefined;

  return (
    <header className="relative overflow-hidden border-b border-[var(--line)] px-6 sm:px-8 pt-16 pb-12 bg-[var(--bg)]" id="app-header">
      {/* Dynamic low-opacity accent border line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />

      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-5">
          {/* BT Monogram Logo */}
          <div className="flex-shrink-0 select-none bg-gradient-to-br from-[#ffe099] via-[#f59e0b] to-[#b45309] bg-clip-text text-transparent font-extrabold tracking-tighter text-5xl sm:text-6xl font-serif pr-4 border-r border-[var(--line)] leading-none" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            B<span className="text-[#ffe099] -ml-2 italic font-light">T</span>
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-mono tracking-[0.35em] uppercase text-[var(--text2)] mb-1 sm:mb-2 text-left">
              E. Reyes · Personal Ledger
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-light tracking-tight text-[var(--bone)] text-left">
              Budget <span className="font-semibold italic text-[var(--accent)]">Tracker</span>
            </h1>
            <div className="flex flex-col items-start gap-1.5 mt-2">
              <div className="flex items-center gap-4">
                <span className="text-[11px] sm:text-xs font-mono tracking-widest uppercase text-[var(--text2)]">
                  2026 · Full Year
                </span>
                <span className="text-xs text-[var(--line)]">|</span>
                <span className={`text-[11px] sm:text-xs font-mono tracking-widest uppercase font-bold transition-colors ${getStatusColor()}`} id="sync-status">
                  {getStatusText()}
                </span>
              </div>
              
              {/* Responsive live-updating spending ticker */}
              {!hideTicker && hasTickerValues && (
                <div 
                  id="header-spending-ticker"
                  className={`font-mono text-[9px] sm:text-[10px] tracking-widest uppercase font-bold text-left transition-all duration-300 mt-1 ${calculateTickerColor(totalSpent!, budgetCeiling!)}`}
                >
                  Spent {formatCurrency(totalSpent!)} of {formatCurrency(budgetCeiling!)} Ceiling —{' '}
                  {budgetCeiling! >= totalSpent! ? (
                    <span>{formatCurrency(budgetCeiling! - totalSpent!)} Remaining</span>
                  ) : (
                    <span>Over Limit by {formatCurrency(totalSpent! - budgetCeiling!)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          id="toggle-settings-btn"
          onClick={onOpenSettings}
          className="p-3.5 border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--bone)] rounded-lg transition-colors text-[var(--text)] bg-[var(--bg2)] cursor-pointer shadow-sm flex items-center justify-center"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}

export default Header;
