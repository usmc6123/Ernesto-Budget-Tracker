import { BudgetLimit } from '../types';
import { BudgetItem } from './BudgetItem';

interface BudgetGridProps {
  limits: BudgetLimit[];
  spentMap: { [category: string]: number };
}

export function BudgetGrid({ limits, spentMap }: BudgetGridProps) {
  // Sort and filter variable vs fixed limits
  const variableLimits = limits.filter((l) => l.type === 'variable');
  const fixedLimits = limits.filter((l) => l.type === 'fixed');

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-8 py-6 space-y-12" id="budget-cards-grid">
      {/* Variable Budget Card Pile */}
      <div>
        <div className="flex items-center gap-4 text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[var(--accent)] mb-6 font-bold">
          <span>Variable Budget</span>
          <div className="flex-grow h-[1px] bg-[var(--line)] opacity-80" />
        </div>
        <div id="variable-grid-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {variableLimits.map((b) => (
            <BudgetItem
              key={b.id}
              category={b.category}
              spent={spentMap[b.category] || 0}
              limit={b.limit}
              color={b.color}
            />
          ))}
        </div>
      </div>

      {/* Fixed Obligations Card Pile */}
      <div>
        <div className="flex items-center gap-4 text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[var(--accent)] mb-6 font-bold">
          <span>Fixed Obligations</span>
          <div className="flex-grow h-[1px] bg-[var(--line)] opacity-80" />
        </div>
        <div id="fixed-grid-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fixedLimits.map((b) => (
            <BudgetItem
              key={b.id}
              category={b.category}
              spent={spentMap[b.category] || 0}
              limit={b.limit}
              color={b.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default BudgetGrid;
