import { formatCurrency, MONTHS } from '../lib/utils';
import { YTDStats } from '../types';

interface SavingsRingProps {
  currentMonthIndex: number;
  income: number;
  totalSpent: number;
  cardPayments: number;
  savingsTarget: number;
  stats: YTDStats | null;
}

export function SavingsRing({
  currentMonthIndex,
  income,
  totalSpent,
  cardPayments,
  savingsTarget,
  stats,
}: SavingsRingProps) {
  const net = income - totalSpent;
  const hasDeficit = net < 0;

  const realSpent = totalSpent - cardPayments;

  // Mini Chart: FEB to DEC
  // Gather summaries for bar charts
  const monthlySummaries = stats?.monthlySummaries || [];

  return (
    <div 
      className="w-full bg-gradient-to-b from-[#1c1b18] via-[#12110f] to-[#0d0c0b] border border-[#302b23] rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.05)] text-left space-y-6" 
      id="savings-ring-section"
    >
      {/* Main Grid: 3D Ring on Left, Breakdown List on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" id="main-grid-savings">
        
        {/* Left Column: 3D Metallic Ring Dial */}
        <div className="md:col-span-5 flex justify-center items-center" id="savings-ring-visual-col">
          <div className="relative w-40 h-40 rounded-full flex items-center justify-center bg-gradient-to-br from-[#3e3b33] via-[#1e1c18] to-[#0c0b0a] p-1 shadow-[0_10px_25px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.1),_0_0_15px_rgba(245,158,11,0.1)] border border-[#483c27]">
            
            {/* Glossy overlay sheen */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-transparent via-[#ffffff03] to-[#ffffff0a] pointer-events-none" />
            
            {/* Active Dial Inner Shadow Element */}
            <div className="absolute inset-3 rounded-full bg-gradient-to-b from-[#111110] to-[#25231e] shadow-[inset_0_4px_10px_rgba(0,0,0,0.9)] flex flex-col justify-center items-center text-center">
              <span
                className="font-serif text-[28px] sm:text-3.5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[#ffe099] via-[#f59e0b] to-[#b45309] drop-shadow-md select-none leading-none"
                id="savings-net-amount"
              >
                {Math.abs(net) < 10000 
                  ? formatCurrency(Math.abs(net)) 
                  : `$${Math.round(Math.abs(net)).toLocaleString()}`
                }
              </span>
              <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-[#f59e0b] opacity-80 mt-1.5 font-bold">
                {hasDeficit ? 'deficit' : 'saved'}
              </span>
            </div>

            {/* Glowing gold circular contour ring */}
            <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="72"
                fill="none"
                stroke="rgba(245, 158, 11, 0.08)"
                strokeWidth="4"
              />
              <circle
                id="ring-progress-arc"
                cx="80"
                cy="80"
                r="72"
                fill="none"
                stroke="url(#gold-metallic-glow)"
                strokeWidth="6"
                strokeDasharray="452"
                // Fill ring if positive saved, or red alert if deficit
                strokeDashoffset={net > 0 ? (452 - Math.min((net / (savingsTarget || 1)) * 452, 452)) : 452}
                strokeLinecap="round"
                className="transition-all duration-750 ease-out"
              />
              <defs>
                <linearGradient id="gold-metallic-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#ffe099" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Right Column: Key Breakdown Stats (Income, Real Spent, Card Payments, Net Result) */}
        <div className="md:col-span-7 space-y-4" id="savings-breakdown-col">
          <div className="font-serif italic text-lg text-[var(--bone)] tracking-wide mb-4 text-center md:text-left" id="monthly-goal-header">
            ~ {MONTHS[currentMonthIndex]} Ledger ~
          </div>

          <div className="flex justify-between items-center border-b border-[#2d281f] pb-3">
            <span className="text-xs uppercase tracking-[0.2em] text-[#a29e96] font-bold">INCOME</span>
            <span className="text-[#34d399] font-bold tabular-nums text-base sm:text-lg" id="metric-income-amount">
              {formatCurrency(income)}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-[#2d281f] pb-3">
            <span className="text-xs uppercase tracking-[0.2em] text-[#a29e96] font-bold">SAVINGS</span>
            <span className="text-[#ef4444] font-bold tabular-nums text-base sm:text-lg" id="metric-spent-amount">
              {formatCurrency(realSpent)}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-[#2d281f] pb-3">
            <span className="text-xs uppercase tracking-[0.2em] text-[#a29e96] font-bold">DEBT PAYMENTS</span>
            <span className="text-[#88837a] font-bold tabular-nums text-base sm:text-lg" id="metric-cards-amount">
              {formatCurrency(cardPayments)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-sm uppercase tracking-[0.2em] text-[#fcfaf2] font-semibold">NET RESULT</span>
            <span className={`font-black tabular-nums text-lg sm:text-xl md:text-2xl`} style={{ color: hasDeficit ? '#ef4444' : '#34d399' }} id="metric-net-amount">
              {formatCurrency(net)}
            </span>
          </div>
        </div>
      </div>

      {/* Mini Monthly Bar Chart on Bottom */}
      <div className="border-t border-[#2d281f] pt-5" id="mini-monthly-bar-chart">
        <div className="flex justify-between items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {MONTHS.map((m, idx) => {
            // Find month stats if loaded
            const mKey = `2026-${String(idx + 1).padStart(2, '0')}`;
            const summary = monthlySummaries.find((s: any) => s.key === mKey);
            const mNet = summary ? summary.net : 0;
            const mHasData = summary ? (summary.spent > 0 || summary.income > 0) : false;
            const isOver = mNet < 0;
            const isActive = idx === currentMonthIndex;

            // Height scaling factor for small visualization
            const maxVal = 3000;
            const absoluteNetVal = Math.abs(mNet);
            const heightPct = mHasData ? Math.min(Math.max((absoluteNetVal / maxVal) * 25, 4), 28) : 2;

            return (
              <div 
                key={m} 
                className={`flex-1 min-w-[30px] flex flex-col items-center justify-end gap-2.5 py-1 ${isActive ? 'rounded-lg bg-[#27231c] border border-[#f59e0b]/40 px-1 shadow-[0_0_10px_rgba(245,158,11,0.08)]' : ''}`}
                title={`${m}: ${formatCurrency(mNet)}`}
              >
                {/* Visual bar column inside container */}
                <div className="h-8 flex items-end justify-center w-full">
                  <div 
                    className={`w-2.5 rounded-t-sm transition-all duration-500 ease-out ${
                      !mHasData 
                        ? 'bg-[#1c1b18] h-[3px]' 
                        : isOver 
                        ? 'bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.3)]' 
                        : 'bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                    }`}
                    style={{ height: `${heightPct}px` }}
                  />
                </div>
                
                {/* Plain Text Label letter */}
                <span className={`text-[8.5px] font-mono tracking-tighter uppercase font-medium ${isActive ? 'text-[#f59e0b] font-bold' : 'text-[#88837a]'}`}>
                  {m.slice(0, 3)}
                </span>
                
                {/* Active bullet dot if selected */}
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#f59e0b]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SavingsRing;
