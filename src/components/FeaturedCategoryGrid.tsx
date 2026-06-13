import { BudgetLimit, Expense } from '../types';
import { formatCurrency } from '../lib/utils';
import { ShoppingCart, Home, Utensils, Car } from 'lucide-react';

interface FeaturedCategoryGridProps {
  limits: BudgetLimit[];
  expenses: Expense[];
  spentMap: { [category: string]: number };
}

export function FeaturedCategoryGrid({
  limits,
  expenses,
  spentMap,
}: FeaturedCategoryGridProps) {
  // Define mapping of 4 categories
  const featured = [
    {
      label: 'GROCERIES',
      dbCategory: 'Groceries',
      fallbackLimit: 450,
      icon: <ShoppingCart size={18} className="text-[#f59e0b]" />,
    },
    {
      label: 'HOME & DINING',
      dbCategory: 'Housing',
      fallbackLimit: 908,
      icon: <Home size={18} className="text-[#f59e0b]" />,
    },
    {
      label: 'DINING OUT',
      dbCategory: 'Dining Out',
      fallbackLimit: 150,
      icon: <Utensils size={18} className="text-[#f59e0b]" />,
    },
    {
      label: 'CAR',
      dbCategory: 'Auto',
      fallbackLimit: 650,
      icon: <Car size={18} className="text-[#f59e0b]" />,
    },
  ];

  return (
    <div className="space-y-4" id="category-summaries-module">
      <h3 className="font-serif text-lg tracking-wider text-[#ffe099] font-medium uppercase border-b border-[#2d281f] pb-3 text-left">
        Category Summaries
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="category-2x2-grid">
        {featured.map((cat) => {
          const limitObj = limits.find((l) => l.category === cat.dbCategory);
          const limitVal = limitObj ? limitObj.limit : cat.fallbackLimit;
          const spentVal = spentMap[cat.dbCategory] || 0;
          
          const isOver = spentVal > limitVal;
          const percentage = limitVal > 0 ? Math.min((spentVal / limitVal) * 100, 100) : 0;
          const remaining = limitVal - spentVal;
          
          // Transaction count
          const count = expenses.filter((e) => e.category === cat.dbCategory).length;

          return (
            <div
              key={cat.label}
              id={`featured-card-${cat.label.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}
              className="bg-gradient-to-b from-[#181715] to-[#0e0d0c] border border-[#2d281f] h-[160px] flex flex-col justify-between rounded-2xl p-5 hover:border-[#483c27] shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-300"
            >
              {/* Card Header: Icon & Amber Category Label */}
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono tracking-[0.2em] font-extrabold text-[#f59e0b]">
                  {cat.label}
                </span>
                <div className="p-2 rounded-lg bg-[#25231f] border border-[#3e3524]">
                  {cat.icon}
                </div>
              </div>

              {/* Card Center: Spent amount bold */}
              <div>
                <div 
                  className={`font-mono text-2xl font-black tracking-tight`}
                  style={{ color: isOver ? '#ef4444' : '#fcfaf2' }}
                >
                  {formatCurrency(spentVal)}
                </div>
              </div>

              {/* Progress and status row */}
              <div className="space-y-2">
                <div className="w-full h-[5px] bg-[#1a1917] border border-[#2b2720] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: isOver ? '#ef4444' : '#f59e0b',
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-[#8c867a]">
                  <span>
                    {count} {count === 1 ? 'transaction' : 'transactions'}
                  </span>
                  <span className={isOver ? 'text-[#ef4444] font-semibold' : ''}>
                    {isOver ? `over by ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} left`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FeaturedCategoryGrid;
