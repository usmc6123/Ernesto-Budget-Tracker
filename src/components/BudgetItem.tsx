import { formatCurrency } from '../lib/utils';

interface BudgetItemProps {
  key?: string;
  category: string;
  spent: number;
  limit: number;
  color: string;
  isFirst?: boolean;
  isLast?: boolean;
}

export function BudgetItem({
  category,
  spent,
  limit,
  color,
  isFirst = false,
  isLast = false,
}: BudgetItemProps) {
  const isOver = spent >= limit;
  const rawPercentage = limit > 0 ? (spent / limit) * 100 : 0;
  const percentage = Math.min(rawPercentage, 100);
  const remaining = limit - spent;
  const isAmber = rawPercentage >= 80 && rawPercentage < 100;

  // Progress bar color matching rules
  let barColor = color;
  if (isOver) {
    barColor = '#ef4444'; // Red 100%+
  } else if (isAmber) {
    barColor = '#ffb020'; // Amber 80-99%
  } else {
    barColor = '#10b981'; // Green under 80%
  }

  return (
    <div
      id={`budget-card-${category.replace(/\s+/g, '-').toLowerCase()}`}
      className={`relative bg-[var(--bg2)] border rounded-2xl p-6 overflow-hidden hover:border-[var(--muted)] hover:shadow-md transition-all duration-300 ${
        isAmber 
          ? 'border-[#ffb020]/40 shadow-[0_0_15px_rgba(255,176,32,0.12)] bg-[#100f0d]' 
          : 'border-[var(--line)]'
      }`}
    >
      {/* Background shadow progress element */}
      <div 
        className="absolute inset-y-0 left-0 opacity-[0.04] pointer-events-none transition-all duration-500 ease-out" 
        style={{ width: `${percentage}%`, backgroundColor: barColor }}
      />
      
      <div className="flex justify-between items-start gap-4 mb-3 relative z-10">
        <span 
          className="font-mono text-[13px] sm:text-sm uppercase tracking-wider font-bold"
          style={{ color: isOver ? 'var(--over)' : (isAmber ? '#ffb020' : color) }}
        >
          {category}
        </span>
        <div className="flex flex-col items-end font-mono">
          <span className="text-[10px] sm:text-[11px] font-bold tabular-nums text-zinc-500 mb-0.5">
            {Math.round(rawPercentage)}%
          </span>
          <span className="text-lg sm:text-xl font-bold tabular-nums tracking-tight leading-none mb-1" style={{ color: isOver ? 'var(--over)' : (isAmber ? '#ffb020' : 'var(--text)') }}>
            {formatCurrency(spent)}
          </span>
          <span className="text-[11px] text-[var(--text2)] tracking-widest uppercase">
            of {formatCurrency(limit)} limit
          </span>
        </div>
      </div>

      {/* Progress horizontal indicator */}
      <div className="w-full h-[6px] bg-[var(--bg3)] border border-[var(--line)] rounded-full overflow-hidden relative mb-4">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: barColor 
          }}
        />
      </div>

      <div className="flex justify-between items-center relative z-10">
        <span className={`font-mono text-[11px] sm:text-xs uppercase tracking-wider font-semibold ${isOver ? 'text-[var(--over)]' : (isAmber ? 'text-[#ffb020]' : 'text-[var(--text2)]')}`}>
          {isOver ? `⚠ over by ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} remaining`}
        </span>
      </div>
    </div>
  );
}

export default BudgetItem;
