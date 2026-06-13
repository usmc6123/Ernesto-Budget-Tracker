import React, { useState } from 'react';
import { YTDStats, BudgetLimit, Expense } from '../types';
import { formatCurrency, MONTHS, CAT_COLORS } from '../lib/utils';
import { TrendingUp, BarChart3, ChevronRight, Activity, PieChart as PieIcon, Award, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface OverviewViewProps {
  stats: YTDStats | null;
  limits: BudgetLimit[];
  expenses: Expense[];
  onSelectMonth: (monthIndex: number) => void;
  onViewChange: (view: 'budget' | 'overview') => void;
  selectedMonthIndex: number;
  onUpdateExpense?: (id: string, updates: Partial<Expense>) => Promise<void>;
}

export function OverviewView({
  stats,
  limits,
  expenses,
  onSelectMonth,
  onViewChange,
  selectedMonthIndex,
  onUpdateExpense,
}: OverviewViewProps) {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ x: number; y: number; val: number; label: string } | null>(null);
  const [expandedExpenses, setExpandedExpenses] = useState<{ [id: string]: boolean }>({});

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3 animate-pulse" id="stats-loading-view">
        <Activity size={24} className="text-[var(--accent)] animate-spin" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
          Aggregating ledger statistics...
        </span>
      </div>
    );
  }

  const { monthlySummaries, categorySpendsByMonth } = stats as any;

  // Active Category selection helper for Trend Line Graph
  const availableCategoriesForTrend = ['All', ...limits.map((l) => l.category)];

  // Compute graph data coordinates
  const activeMonthSummaries = monthlySummaries || [];
  
  // Extract values based on filtered category selection
  const trendDataPoints = activeMonthSummaries.map((ms: any, idx: number) => {
    const monthKey = ms.key;
    let spentVal = 0;
    
    if (activeCategoryFilter === 'All') {
      spentVal = ms.spent || 0;
    } else {
      const monthSpends = categorySpendsByMonth?.[monthKey] || {};
      spentVal = monthSpends[activeCategoryFilter] || 0;
    }
    
    return {
      label: ms.month.slice(0, 3),
      value: spentVal,
      monthIndex: idx,
    };
  });

  // Calculate high value for SVG graph heights normalization
  const maxTrendVal = Math.max(...trendDataPoints.map((d) => d.value), 100) * 1.15;

  const activeMonthSummaryKey = `2026-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
  const selectedMonthSpends = categorySpendsByMonth?.[activeMonthSummaryKey] || {};

  // Doughnut Pie Chart configuration parameters
  const pieData = limits
    .map((l) => {
      const spent = selectedMonthSpends[l.category] || 0;
      return {
        name: l.category,
        value: spent,
        color: l.color,
      };
    })
    .filter((pt) => pt.value > 0);

  const totalPieSpent = pieData.reduce((sum, item) => sum + item.value, 0);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalPieSpent > 0 ? ((data.value / totalPieSpent) * 100).toFixed(1) : '0';
      return (
        <div className="bg-[#0e0d0b] border border-[#ffb020]/35 p-3 rounded-lg font-mono text-[10px] uppercase tracking-wider text-left space-y-1 shadow-2xl">
          <div className="text-zinc-500 font-bold">{data.name}</div>
          <div className="text-[#ffe099] font-black">{formatCurrency(data.value)}</div>
          <div className="text-[#10b981]">{pct}% of total</div>
        </div>
      );
    }
    return null;
  };

  // Top 5 highest expenses for this active monthly cycle
  const topExpenses = [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const toggleExpenseExpand = (id: string) => {
    setExpandedExpenses((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleUpdatePriority = async (e: React.MouseEvent, item: Expense) => {
    e.stopPropagation();
    if (!onUpdateExpense) return;
    try {
      await onUpdateExpense(item.id, { flagged: !item.flagged });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="overview-viewport-container" className="space-y-8 animate-fade-in pb-16">
      
      {/* 4-Stat Metric Box Row */}
      <section className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 sm:px-8" id="stats-summary-boxes">
        <div className="bg-[var(--bg2)] border border-[var(--line)] p-6 rounded-2xl text-left hover:border-[var(--muted)] shadow-md transition-all duration-300" id="stat-ytd-income">
          <div className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-[var(--text2)] mb-2 font-bold">
            YTD Income
          </div>
          <div className="font-serif text-3xl sm:text-4xl font-light text-[var(--good)] tabular-nums" id="stat-val-income">
            {formatCurrency(stats.ytdIncome)}
          </div>
          <div className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider mt-2 font-medium">
            avg {formatCurrency(stats.ytdIncome / 12)}/mo
          </div>
        </div>

        <div className="bg-[var(--bg2)] border border-[var(--line)] p-6 rounded-2xl text-left hover:border-[var(--muted)] shadow-md transition-all duration-300" id="stat-ytd-net">
          <div className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-[var(--text2)] mb-2 font-bold">
            YTD Net
          </div>
          <div
            className="font-serif text-3xl sm:text-4xl font-light tabular-nums"
            style={{ color: stats.ytdNet >= 0 ? 'var(--good)' : 'var(--over)' }}
            id="stat-val-net"
          >
            {formatCurrency(stats.ytdNet)}
          </div>
          <div className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider mt-2 font-medium">
            avg {formatCurrency(stats.ytdNet / 12)}/mo
          </div>
        </div>

        <div className="bg-[var(--bg2)] border border-[var(--line)] p-6 rounded-2xl text-left hover:border-[var(--muted)] shadow-md transition-all duration-300" id="stat-ytd-real">
          <div className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-[var(--text2)] mb-2 font-bold">
            Real Spend
          </div>
          <div className="font-serif text-3xl sm:text-4xl font-light text-[var(--accent)] tabular-nums" id="stat-val-real">
            {formatCurrency(stats.realSpent)}
          </div>
          <div className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider mt-2 font-medium">
            avg {formatCurrency(stats.realSpent / 12)}/mo
          </div>
        </div>

        <div className="bg-[var(--bg2)] border border-[var(--line)] p-6 rounded-2xl text-left hover:border-[var(--muted)] shadow-md transition-all duration-300" id="stat-ytd-cards">
          <div className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-[var(--text2)] mb-2 font-bold">
            Card Spend
          </div>
          <div className="font-serif text-3xl sm:text-4xl font-light text-[var(--text)] opacity-40 tabular-nums" id="stat-val-cards">
            {formatCurrency(stats.cardPayments)}
          </div>
          <div className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider mt-2 font-medium">
            avg {formatCurrency(stats.cardPayments / 12)}/mo
          </div>
        </div>
      </section>

      {/* Dynamic Interactive SVG Trend Line Graph */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 space-y-5" id="stats-trend-chart-module">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-2.5">
            <TrendingUp size={16} className="text-[var(--accent)]" />
            <h3 className="font-serif text-lg sm:text-xl font-light text-[var(--bone)]">
              Ledger Spending Trend
            </h3>
          </div>
          
          <select
            id="trend-category-select-filter"
            value={activeCategoryFilter}
            onChange={(e) => {
              setActiveCategoryFilter(e.target.value);
              setHoveredDataPoint(null);
            }}
            className="bg-[var(--bg3)] border border-[var(--line)] text-[var(--text)] rounded-xl px-4 py-2.5 font-mono text-xs uppercase tracking-wider cursor-pointer outline-none appearance-none"
          >
            {availableCategoriesForTrend.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'TOTAL SPENT' : cat.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* The Custom Responsive SVG Graph Canvas */}
        <div className="relative bg-[var(--bg2)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 pt-10 pb-4 select-none shadow-md" id="svg-trend-canvas-wrap">
          {/* Legend indicator */}
          <div className="absolute top-4 right-6 flex items-center gap-2 text-[10px] font-mono text-[var(--text2)] uppercase font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <span>{activeCategoryFilter === 'All' ? 'Total Aggregated Spends' : activeCategoryFilter}</span>
          </div>

          <svg viewBox="0 0 520 180" className="w-full h-auto overflow-visible" id="trend-line-graph-canvas">
            {/* Horizontal guideline dividers coordinates */}
            <line x1="30" y1="20" x2="500" y2="20" stroke="var(--bg3)" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="30" y1="70" x2="500" y2="70" stroke="var(--bg3)" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="30" y1="120" x2="500" y2="120" stroke="var(--bg3)" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="30" y1="150" x2="500" y2="150" stroke="var(--line)" strokeWidth="1" />

            {/* Assemble path values */}
            {(() => {
              const paddingLeft = 35;
              const paddingRight = 15;
              const graphWidth = 500 - paddingLeft - paddingRight; // 450
              const count = trendDataPoints.length; // 12
              
              const points = trendDataPoints.map((pt: any, i: number) => {
                const x = paddingLeft + (i / (count - 1)) * graphWidth;
                const ratio = pt.value / maxTrendVal;
                // Scale within SVG vertical: Y limits between 150 (bottom) and 20 (top)
                const y = 150 - ratio * 130;
                return { x, y, val: pt.value, label: pt.label, idx: pt.monthIndex };
              });

              // Generate SVG path string with smooth cardinal coordinates curves or straight segments
              const pathD = points.reduce((acc, pt, i) => {
                return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
              }, '');

              return (
                <>
                  {/* Underlay Gradient fill fill-to-bottom area */}
                  {points.length > 0 && (
                    <path
                      d={`${pathD} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`}
                      fill="url(#trend-gradient-fill)"
                      className="opacity-15 transition-all duration-300"
                    />
                  )}

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="trend-gradient-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>

                  {/* Line stroke */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500 ease-out"
                  />

                  {/* Verticals, anchors highlight dots, and text grids */}
                  {points.map((pt, i) => {
                    const isHovered = hoveredDataPoint && hoveredDataPoint.label === pt.label;
                    const isSelectedMonth = pt.idx === selectedMonthIndex;

                    return (
                      <g key={i} className="cursor-pointer group">
                        {/* Interactive vertical hover indicator line */}
                        <line
                          x1={pt.x}
                          y1="20"
                          x2={pt.x}
                          y2="150"
                          stroke={isHovered ? 'var(--accent)' : 'transparent'}
                          strokeWidth="1"
                          strokeDasharray="2,2"
                          className="pointer-events-none"
                        />

                        {/* Solid Anchor outer hover ring */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelectedMonth ? "7" : "5"}
                          fill={isSelectedMonth ? "var(--accent)" : "var(--bg2)"}
                          stroke="var(--accent)"
                          strokeWidth={isSelectedMonth ? "1.5" : "1"}
                          onMouseEnter={() => setHoveredDataPoint({ x: pt.x, y: pt.y, val: pt.val, label: pt.label })}
                          className="transition-all duration-150 relative"
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="14"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredDataPoint({ x: pt.x, y: pt.y, val: pt.val, label: pt.label })}
                          onClick={() => {
                            onSelectMonth(pt.idx);
                          }}
                        />

                        {/* Bottom Label letters */}
                        <text
                          x={pt.x}
                          y="166"
                          textAnchor="middle"
                          fill={isSelectedMonth ? 'var(--bone)' : 'var(--text2)'}
                          className="font-mono text-[9.5px] font-semibold"
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>

          {/* Floating dynamic HTML tooltip container */}
          {hoveredDataPoint && (
            <div
              id="graph-floating-tooltip"
              className="absolute bg-[var(--bg3)] border border-[var(--line)] py-1.5 px-3 rounded shadow-md pointer-events-none z-10 font-mono text-[8.5px] uppercase tracking-wider flex flex-col items-center"
              style={{
                left: `${hoveredDataPoint.x - 35}px`,
                top: `${hoveredDataPoint.y - 45}px`,
              }}
            >
              <span className="text-[var(--text3)] text-[7px]">{hoveredDataPoint.label} 2026</span>
              <span className="text-[var(--bone)] font-semibold">{formatCurrency(hoveredDataPoint.val)}</span>
            </div>
          )}
        </div>
      </section>

      {/* Doughnut Pie Chart Section */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 space-y-5" id="reports-category-doughnut">
        <div className="flex justify-between items-center border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-2.5">
            <PieIcon size={16} className="text-[var(--accent)]" />
            <h3 className="font-serif text-lg sm:text-xl font-light text-[var(--bone)]">
              {MONTHS[selectedMonthIndex]} · Category Shares
            </h3>
          </div>

          {activeCategoryFilter !== 'All' && (
            <button
              onClick={() => setActiveCategoryFilter('All')}
              className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[var(--accent)] hover:underline uppercase py-1 px-2.5 border border-[#ffb020]/20 rounded-xl bg-[#ffb020]/5 cursor-pointer font-bold"
            >
              Show All Categories
            </button>
          )}
        </div>

        <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 shadow-md">
          {pieData.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-mono text-xs uppercase tracking-wider">
              No transactions registered for this month yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Doughnut Canvas Side */}
              <div className="md:col-span-5 h-[200px] flex items-center justify-center relative justify-self-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      onClick={(data) => {
                        if (data && data.name) {
                          setActiveCategoryFilter(data.name);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg2)" strokeWidth={2.5} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Total spending central ring absolute tag */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">SPENT</span>
                  <span className="text-sm font-mono font-black text-white">{formatCurrency(totalPieSpent)}</span>
                </div>
              </div>

              {/* Legend Column Side */}
              <div className="md:col-span-7 flex flex-col gap-2.5 justify-center max-h-[220px] overflow-y-auto pr-2">
                {pieData.map((item) => {
                  const isSelected = activeCategoryFilter === item.name;
                  const pct = totalPieSpent > 0 ? ((item.value / totalPieSpent) * 100).toFixed(0) : '0';
                  
                  return (
                    <div
                      key={item.name}
                      onClick={() => setActiveCategoryFilter(item.name)}
                      className={`flex items-center justify-between gap-3 text-[10px] font-mono uppercase font-bold cursor-pointer hover:text-white transition py-2 px-3 border rounded-xl ${
                        isSelected 
                          ? 'border-[#ffb020] bg-[#ffb020]/5 text-white shadow-[0_0_10px_rgba(255,176,32,0.02)]' 
                          : 'border-[#221e17] bg-[#100f0d]/40 text-zinc-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate text-white">{item.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-[#ffe099]">{formatCurrency(item.value)}</span>
                        <span className="text-zinc-500 italic text-[9px] min-w-[24px] text-right font-semibold">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Comparative Budget vs Actual Bar Chart for Selected Month */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 space-y-5" id="selected-month-budget-vs-actual">
        <div className="flex items-center gap-2.5 border-b border-[var(--line)] pb-4">
          <BarChart3 size={16} className="text-[var(--accent)]" />
          <h3 className="font-serif text-lg sm:text-xl font-light text-[var(--bone)]">
            {MONTHS[selectedMonthIndex]} · Budget vs. Actual
          </h3>
        </div>

        <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 space-y-5 shadow-md" id="budget-bar-comparison-list">
          {(() => {
            const displayedLimits = activeCategoryFilter === 'All' 
              ? limits 
              : limits.filter(l => l.category === activeCategoryFilter);

            if (displayedLimits.length === 0) {
              return (
                <p className="text-xs font-mono text-center text-zinc-500 py-6">
                  {activeCategoryFilter === 'All' ? 'Category limits map is empty.' : 'No data for this category.'}
                </p>
              );
            }

            return displayedLimits.map((l) => {
              const spent = selectedMonthSpends[l.category] || 0;
              const limit = l.limit;
              const isOver = spent > limit;
              const spentPct = limit > 0 ? Math.min((spent / limit) * 105, 100) : 0;

              return (
                <div key={l.id} id={`bar-item-${l.id}`} className="space-y-2">
                  <div className="flex justify-between items-center font-mono text-[11px] sm:text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                      <span className="text-[var(--bone)] font-bold uppercase truncate">{l.category}</span>
                    </div>

                    <div className="flex items-baseline gap-2 flex-shrink-0">
                      <span className="text-sm sm:text-base font-bold tabular-nums" style={{ color: isOver ? 'var(--over)' : 'var(--text)' }}>
                        {formatCurrency(spent)}
                      </span>
                      <span className="text-[10px] text-[var(--text3)]">/</span>
                      <span className="text-[11px] text-[var(--text2)] tabular-nums">{formatCurrency(limit)} limit</span>
                    </div>
                  </div>

                  {/* Stacked visually comparison dual lines indicator */}
                  <div className="w-full h-3 bg-[var(--bg3)] border border-[var(--line)] rounded-full overflow-hidden relative shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${spentPct}%`,
                        backgroundColor: isOver ? 'var(--over)' : l.color,
                      }}
                    />
                    {isOver && (
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <span className="text-[8px] font-mono font-bold text-black select-none bg-[var(--over)] px-1 rounded-sm">
                          OVER
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </section>

      {/* Section: Biggest Monthly Expenses (Interactive Top 5 highest) */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 space-y-5" id="reports-biggest-expenses">
        <div className="flex justify-between items-center border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-2.5">
            <Award size={16} className="text-[var(--accent)] text-[#ffb020]" />
            <h3 className="font-serif text-lg sm:text-xl font-light text-[var(--bone)] uppercase tracking-wide">
              BIGGEST MONTHLY EXPENSES
            </h3>
          </div>
        </div>

        <div className="flex flex-col border border-[var(--line)] rounded-2xl overflow-hidden bg-[var(--bg2)] divide-y divide-[var(--line)] shadow-md">
          {topExpenses.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono tracking-widest uppercase text-zinc-600">
              No entries logged for this period
            </div>
          ) : (
            topExpenses.map((exp) => {
              const isExpanded = !!expandedExpenses[exp.id];
              const categoryColor = CAT_COLORS[exp.category] || '#8c867a';
              return (
                <div 
                  key={exp.id} 
                  id={`biggest-expense-row-${exp.id}`}
                  className={`flex flex-col px-6 py-5 cursor-pointer hover:bg-[var(--bg3)]/30 transition-all ${
                    exp.flagged ? 'bg-[#ffb020]/5 border-l-2 border-[#ffb020]' : ''
                  }`}
                  onClick={() => toggleExpenseExpand(exp.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="min-w-0 pr-3 flex-grow text-left">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-sans text-[14px] sm:text-base font-bold text-white truncate">
                          {exp.description}
                        </span>
                        {exp.flagged && (
                          <span className="text-[8px] font-mono tracking-widest uppercase bg-[#ffb020] text-black font-black px-1.5 py-0.5 rounded shadow-sm">
                            Priority
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-zinc-500 mt-1">
                        <span>{exp.date}</span>
                        <span>·</span>
                        <span style={{ color: categoryColor }} className="font-bold">{exp.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="font-mono text-sm sm:text-base font-black text-rose-500">
                        {formatCurrency(exp.amount)}
                      </span>
                      <div className="text-zinc-500">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                  </div>

                  {/* Top expense collapsed details section */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#221e17] text-left font-mono text-[10.5px] uppercase tracking-wider space-y-3.5 bg-[#100f0d]/40 p-4 rounded-xl border border-[#221e17]">
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-600 font-bold block">Private Note</span>
                        <span className="italic text-[#fcfaf2] lowercase leading-relaxed text-[11px] block mt-0.5">
                          {exp.note ? exp.note : 'no private note recorded'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[9px] border-t border-[#1a1814] pt-2.5">
                        <div>
                          <span className="text-zinc-600 font-bold block">Recorded Cycle Date</span>
                          <span className="text-[var(--text2)] block mt-0.5">{exp.date}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 font-bold block">Transaction Database Identifier</span>
                          <span className="text-[9px] text-[var(--text3)] text-zinc-600 font-mono block mt-0.5 select-all">
                            ID: {exp.id}
                          </span>
                        </div>
                      </div>

                      {onUpdateExpense && (
                        <div className="border-t border-[#1a1814] pt-3.5 flex justify-end">
                          <button
                            type="button"
                            onClick={(evt) => handleUpdatePriority(evt, exp)}
                            className={`px-3 py-1.5 rounded-lg border text-[9px] uppercase tracking-widest font-black font-mono transition flex items-center gap-1.5 cursor-pointer ${
                              exp.flagged
                                ? 'bg-[#ffb020]/20 border-[#ffb020]/40 text-[#ffb020] hover:bg-[#ffb020]/30'
                                : 'bg-[#181612] border-[#221e17] text-zinc-500 hover:text-white hover:border-zinc-700'
                            }`}
                          >
                            <Star size={10} fill={exp.flagged ? 'currentColor' : 'none'} />
                            {exp.flagged ? 'Unflag High Priority' : 'Flag High Priority'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Month by Month summary table */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 space-y-5" id="table-monthly-summaries">
        <div className="text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[var(--accent)] border-b border-[var(--line)] pb-4 font-bold">
          Month by Month Ledger Summary
        </div>

        <div className="flex flex-col border border-[var(--line)] rounded-2xl overflow-hidden bg-[var(--bg2)] divide-y divide-[var(--line)] shadow-md" id="summary-table-body">
          {activeMonthSummaries.map((ms: any, idx: number) => {
            const isSelected = idx === selectedMonthIndex;
            const isLoss = ms.net < 0;

            return (
              <div
                key={ms.key}
                id={`table-row-${ms.key}`}
                onClick={() => {
                  onSelectMonth(idx);
                  onViewChange('budget');
                }}
                className={`flex justify-between items-center px-6 py-5 cursor-pointer hover:bg-[var(--bg3)] transition-all ${
                  isSelected ? 'bg-[var(--bg3)]/60' : ''
                }`}
              >
                <div className="min-w-0 pr-3 flex items-center gap-3">
                  <div className="font-sans text-sm sm:text-base font-bold text-[var(--text)] text-left truncate">
                    {ms.month}
                  </div>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
                  )}
                </div>

                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="flex gap-4 sm:gap-6 text-right font-mono">
                    <div className="flex flex-col items-end min-w-[60px] sm:min-w-[80px]">
                      <span className="text-[var(--good)] font-semibold text-[12px] sm:text-xs tabular-nums">{formatCurrency(ms.income)}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[var(--text3)] font-bold mt-1">income</span>
                    </div>

                    <div className="flex flex-col items-end min-w-[60px] sm:min-w-[80px]">
                      <span className="text-[var(--over)] font-semibold text-[12px] sm:text-xs tabular-nums">{formatCurrency(ms.spent)}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[var(--text3)] font-bold mt-1">spent</span>
                    </div>

                    <div className="flex flex-col items-end min-w-[70px] sm:min-w-[90px]">
                      <span
                        className="font-bold text-[12px] sm:text-xs tabular-nums text-base"
                        style={{ color: isLoss ? 'var(--over)' : 'var(--good)' }}
                      >
                        {formatCurrency(ms.net)}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-[var(--text3)] font-bold mt-1">net saved</span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-[var(--text3)]" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default OverviewView;
