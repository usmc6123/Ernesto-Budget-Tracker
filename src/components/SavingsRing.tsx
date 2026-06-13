import { formatCurrency, MONTHS } from '../lib/utils';

interface SavingsRingProps {
  currentMonthIndex: number;
  income: number;
  totalSpent: number;
  cardPayments: number;
  savingsTarget: number;
}

export function SavingsRing({
  currentMonthIndex,
  income,
  totalSpent,
  cardPayments,
  savingsTarget,
}: SavingsRingProps) {
  const realSpent = totalSpent - cardPayments;
  const net = income - totalSpent;
  const hasDeficit = net < 0;

  // Calculate percentage of progress toward target
  // Ensure we don't divide by zero and clamp minimum at 0, max 100 for visual circle ring fill
  const progressPct = net > 0 ? Math.min((net / savingsTarget) * 100, 100) : 0;

  // SVG parameters
  const radius = 58;
  const circumference = 2 * Math.PI * radius; // ~364.42
  const strokeOffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto bg-[var(--bg2)] border border-[var(--line)] rounded-2xl p-8 sm:p-10 shadow-lg flex flex-col sm:flex-row items-center gap-8 sm:gap-12" id="savings-ring-section">
      {/* SVG Donut Ring Chart */}
      <div className="relative flex-shrink-0 w-[150px] h-[150px]" id="savings-pie-chart">
        <svg width="150" height="150" className="rotate-[-90deg]">
          {/* Base track circle */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="var(--bg3)"
            strokeWidth="9"
          />
          {/* Dynamic filled progress arc */}
          <circle
            id="ring-progress-arc"
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke={hasDeficit ? 'var(--over)' : 'var(--accent)'}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Floating Center Metrics */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center">
          <span
            className="font-serif text-[28px] sm:text-3xl font-bold tracking-tight leading-none"
            style={{ color: hasDeficit ? 'var(--over)' : 'var(--bone)' }}
            id="savings-net-amount"
          >
            {Math.abs(net) < 1000 ? formatCurrency(Math.abs(net)) : `$${Math.round(Math.abs(net))}`}
          </span>
          <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--accent)] mt-2 font-semibold">
            {hasDeficit ? 'deficit' : 'saved'}
          </span>
        </div>
      </div>

      {/* Numerical Sheet Breakdown */}
      <div className="flex-grow w-full min-w-0">
        <div className="font-serif italic text-lg text-[var(--bone)] tracking-wide mb-4 text-center sm:text-left" id="monthly-goal-header">
          ~ {MONTHS[currentMonthIndex]} Ledger ~
        </div>

        <div className="flex flex-col gap-3 font-mono text-[13px] md:text-[14px]">
          <div className="flex justify-between items-center border-b border-[var(--bg3)] pb-2 pt-1 transition-all">
            <span className="text-[var(--text2)] uppercase tracking-wider text-[11px] sm:text-xs">Income</span>
            <span className="text-[var(--good)] font-semibold tabular-nums text-sm sm:text-base" id="metric-income-amount">
              {formatCurrency(income)}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-[var(--bg3)] pb-2 pt-1 transition-all">
            <span className="text-[var(--text2)] uppercase tracking-wider text-[11px] sm:text-xs">Real Spent</span>
            <span className="text-[var(--over)] font-semibold tabular-nums text-sm sm:text-base" id="metric-spent-amount">
              {formatCurrency(realSpent)}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-[var(--bg3)] pb-2 pt-1 transition-all">
            <span className="text-[var(--text2)] uppercase tracking-wider text-[11px] sm:text-xs">Card Payments</span>
            <span className="text-[var(--text3)] font-semibold tabular-nums text-sm sm:text-base" id="metric-cards-amount">
              {formatCurrency(cardPayments)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[var(--text)] uppercase tracking-wider text-[11px] sm:text-xs font-bold">Net Result</span>
            <span
              className="font-bold tabular-nums text-base sm:text-lg"
              style={{ color: hasDeficit ? 'var(--over)' : 'var(--good)' }}
              id="metric-net-amount"
            >
              {formatCurrency(net)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SavingsRing;
