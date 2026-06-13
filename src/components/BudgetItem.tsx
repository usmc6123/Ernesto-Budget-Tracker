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
  const isOver = spent > limit;
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const remaining = limit - spent;
  
  return (
    <div
      id={`budget-card-${category.replace(/\s+/g, '-').toLowerCase()}`}
      className="relative bg-[var(--bg2)] border border-[var(--line)] rounded-2xl p-6 overflow-hidden hover:border-[var(--muted)] hover:shadow-md transition-all duration-300"
    >
      {/* Background shadow progress element */}
      <div 
        className="absolute inset-y-0 left-0 opacity-[0.04] pointer-events-none transition-all duration-500 ease-out" 
        style={{ width: `${percentage}%`, backgroundColor: isOver ? 'var(--over)' : color }}
      />
      
      <div className="flex justify-between items-start gap-4 mb-3 relative z-10">
        <span 
          className="font-mono text-[13px] sm:text-sm uppercase tracking-wider font-bold"
          style={{ color: color }}
        >
          {category}
        </span>
        <div className="flex flex-col items-end font-mono">
          <span className="text-lg sm:text-xl font-bold tabular-nums tracking-tight leading-none mb-1" style={{ color: isOver ? 'var(--over)' : 'var(--text)' }}>
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
            backgroundColor: isOver ? 'var(--over)' : color 
          }}
        />
      </div>

      <div className="flex justify-between items-center relative z-10">
        <span className={`font-mono text-[11px] sm:text-xs uppercase tracking-wider font-semibold ${isOver ? 'text-[var(--over)]' : 'text-[var(--text2)]'}`}>
          {isOver ? `⚠ over by ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} remaining`}
        </span>
      </div>
    </div>
  );
}

export default BudgetItem;
