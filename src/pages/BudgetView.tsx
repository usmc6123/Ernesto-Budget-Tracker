import { Settings as SettingsType, BudgetLimit, Expense, Income, YTDStats } from '../types';
import { SavingsRing } from '../components/SavingsRing';
import { AddExpenseForm } from '../components/AddExpenseForm';
import { AddIncomeForm } from '../components/AddIncomeForm';
import { BudgetGrid } from '../components/BudgetGrid';
import { EntriesList } from '../components/EntriesList';
import { FeaturedCategoryGrid } from '../components/FeaturedCategoryGrid';
import { ShieldAlert, Info } from 'lucide-react';
import { formatCurrency, isHistoricalMonth } from '../lib/utils';

interface BudgetViewProps {
  currentMonthIndex: number;
  settings: SettingsType;
  limits: BudgetLimit[];
  expenses: Expense[];
  incomes: Income[];
  stats: YTDStats | null;
  onAddExpense: (expense: {
    category: string;
    description: string;
    amount: number;
    isRecurring: boolean;
    date?: string;
  }) => Promise<void>;
  onAddIncome: (income: {
    description: string;
    amount: number;
  }) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onOpenReceiptScanner?: () => void;
}

export function BudgetView({
  currentMonthIndex,
  settings,
  limits,
  expenses,
  incomes,
  stats,
  onAddExpense,
  onAddIncome,
  onDeleteExpense,
  onOpenReceiptScanner,
}: BudgetViewProps) {
  const isReadOnly = isHistoricalMonth(currentMonthIndex);

  // Accumulate spent amounts per category for the current month
  const spentMap: { [category: string]: number } = {};
  expenses.forEach((e) => {
    spentMap[e.category] = (spentMap[e.category] || 0) + e.amount;
  });

  const totalSpent = Object.values(spentMap).reduce((sum, v) => sum + v, 0);
  const cardPaymentsSpent = spentMap['Card Payments'] || 0;

  // Total income for active month: settings-defined default monthly income + extra auxiliary incomes
  const manualIncomeTotal = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalIncome = settings.defaultIncome + manualIncomeTotal;

  // Alerts checks
  const isOverBudgetCeiling = totalSpent > settings.budgetCeiling;

  return (
    <div id="budget-viewport-container" className="animate-fade-in pb-32 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Alert Notice Banner: Over-limit ceiling warning (hidden for past months) */}
      {!isReadOnly && isOverBudgetCeiling && (
        <div
          id="budget-ceiling-warning-alert"
          className="mb-8 p-5 border border-[var(--over)] bg-[var(--over)]/10 rounded-2xl flex items-start gap-3.5 text-[11px] sm:text-xs font-mono uppercase tracking-widest text-[var(--over)] leading-relaxed shadow-lg"
        >
          <ShieldAlert size={18} className="text-[var(--over)] flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <span className="font-bold">ALERT:</span> Spends aggregate ({formatCurrency(totalSpent)}) has exceeded the hard limit ceiling ({formatCurrency(settings.budgetCeiling)}). Core savings goal is at risk.
          </div>
        </div>
      )}

      {/* Historical Data Locked Banner */}
      {isReadOnly && (
        <div
          id="historical-locked-banner"
          className="mb-8 p-5 border border-[var(--line)] bg-[var(--bg2)] rounded-2xl flex items-center gap-3.5 text-[11px] sm:text-xs font-mono uppercase tracking-wider text-[var(--text2)] shadow-md"
        >
          <Info size={18} className="text-[var(--accent)] flex-shrink-0" />
          <span>✦ Historical Ledger Cycle Locked — Read Only Mode Active</span>
        </div>
      )}

      {/* Desktop Split Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Summary Card, Forms, Remaining Limits, Transaction Logs */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* Goal Ring Card Breakdown Section */}
          <SavingsRing
            currentMonthIndex={currentMonthIndex}
            income={totalIncome}
            totalSpent={totalSpent}
            cardPayments={cardPaymentsSpent}
            savingsTarget={settings.savingsTarget}
            stats={stats}
          />

          {/* Helper Placeholder Line */}
          <div className="text-[11px] font-mono tracking-widest text-[#8c867a] text-center border-y border-[#2d281f] py-2 uppercase">
            -- Additional features can include data entry form details --
          </div>

          {/* Transaction Log Input Panels (Hidden for past historical cycles) */}
          {!isReadOnly && (
            <div className="space-y-8" id="ledger-add-section">
              <AddExpenseForm limits={limits} onAddExpense={onAddExpense} onOpenReceiptScanner={onOpenReceiptScanner} />
              <AddIncomeForm onAddIncome={onAddIncome} />
            </div>
          )}

          {/* Remaining Limits / All limits breakdown list */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg tracking-wider text-[#ffe099] font-medium uppercase border-b border-[#2d281f] pb-3 text-left">
              Detailed Limits Table
            </h3>
            <BudgetGrid limits={limits} spentMap={spentMap} />
          </div>

          <div className="text-[11px] font-mono tracking-widest text-[#8c867a] text-center uppercase py-2">
            -- Information can be added here or not at all --
          </div>

          {/* Recent Ledger Transaction Entries */}
          <EntriesList
            expenses={expenses}
            activeMonthName={getMonthlyName(currentMonthIndex)}
            onDeleteExpense={onDeleteExpense}
            isReadOnly={isReadOnly}
          />
        </div>

        {/* Right Column: Featured Category Summaries 2x2 grid */}
        <div className="lg:col-span-5 sticky top-8">
          <FeaturedCategoryGrid
            limits={limits}
            expenses={expenses}
            spentMap={spentMap}
          />
        </div>

      </div>
    </div>
  );
}

function getMonthlyName(monthIndex: number): string {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return names[monthIndex] || 'Month';
}

export default BudgetView;
