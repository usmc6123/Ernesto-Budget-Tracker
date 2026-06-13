import { useEffect, useRef } from 'react';
import { MONTHS } from '../lib/utils';

interface MonthNavProps {
  currentMonth: number; // 0-11
  hasDataMap: { [monthKey: string]: boolean };
  onMonthChange: (monthIndex: number) => void;
}

export function MonthNav({ currentMonth, hasDataMap, onMonthChange }: MonthNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Automatically center active month tab on render
    const container = containerRef.current;
    if (container) {
      const activeBtn = container.children[currentMonth] as HTMLElement;
      if (activeBtn) {
        container.scrollTo({
          left: activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [currentMonth]);

  return (
    <div className="border-b border-[var(--line)] bg-[var(--bg)] select-none" id="month-navigation-wrap">
      <div
        ref={containerRef}
        id="month-navigation-bar"
        className="max-w-4xl mx-auto flex overflow-x-auto sm:overflow-x-visible px-4 sm:px-6 scrollbar-none gap-1 sm:gap-2 scroll-smooth justify-start sm:justify-between w-full"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {MONTHS.map((month, index) => {
          const monthKey = `2026-${String(index + 1).padStart(2, '0')}`;
          const active = index === currentMonth;
          const hasData = hasDataMap[monthKey] || false;

          return (
            <button
              key={month}
              id={`month-tab-${index}`}
              onClick={() => onMonthChange(index)}
              className={`flex-shrink-0 sm:flex-1 text-center font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-wider px-3 sm:px-1 py-4 sm:py-5 border-b-[3px] transition-all cursor-pointer ${
                active
                  ? 'text-[var(--text)] border-[var(--accent)] font-bold scale-105'
                  : hasData
                  ? 'text-[var(--text2)] border-transparent font-semibold hover:text-[var(--text)]'
                  : 'text-[var(--text3)] border-transparent hover:text-[var(--text2)]'
              }`}
            >
              <span className="sm:hidden">{month.slice(0, 3)}</span>
              <span className="hidden sm:inline">{month.slice(0, 3)}</span>
              {hasData && !active && (
                <span className="ml-1 text-[10px] sm:text-xs text-[var(--accent)] font-bold">•</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MonthNav;
