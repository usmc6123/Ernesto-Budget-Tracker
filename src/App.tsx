import { useState, useEffect } from 'react';
import { api, getToken, removeToken, isAuthenticated } from './lib/api';
import { getMonthKey, MONTHS } from './lib/utils';
import { applyTheme } from './components/ThemeSelector';
import { Settings, BudgetLimit, Expense, Income, YTDStats } from './types';

// Pages
import { Login } from './pages/Login';
import { BudgetView } from './pages/BudgetView';
import { OverviewView } from './pages/OverviewView';

// Components
import { Header } from './components/Header';
import { MonthNav } from './components/MonthNav';
import { BottomNav } from './components/BottomNav';
import { SettingsDrawer } from './components/SettingsDrawer';

import { LogOut } from 'lucide-react';

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [currentView, setCurrentView] = useState<'budget' | 'overview'>('budget');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth()); // 0-11
  const [saveStatus, setSaveStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Core Finance State
  const [settings, setSettings] = useState<Settings>({
    id: 'user-settings',
    theme: 'MONOCHROME',
    budgetCeiling: 2615,
    savingsTarget: 2000,
    defaultIncome: 0,
  });
  const [limits, setLimits] = useState<BudgetLimit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [stats, setStats] = useState<YTDStats | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTimeoutId, setToastTimeoutId] = useState<any>(null);

  // Active month data marker map
  const [hasDataMap, setHasDataMap] = useState<{ [monthKey: string]: boolean }>({});

  const triggerToast = (msg: string) => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToastMessage(msg);
    const id = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
    setToastTimeoutId(id);
  };

  const fetchLedgerData = async (monthIndex: number) => {
    if (!getToken()) return;
    setSaveStatus('saving');
    const monthKey = getMonthKey(monthIndex);
    
    try {
      // Execute fetches in parallel to optimize response speed
      const [userSettings, fetchedLimits, monthExpenses, monthIncomes, aggregatedStats] = await Promise.all([
        api.getSettings(),
        api.getBudgetLimits(),
        api.getExpenses(monthKey),
        api.getIncome(monthKey),
        api.getStats(),
      ]);

      setSettings(userSettings);
      setLimits(fetchedLimits);
      setExpenses(monthExpenses);
      setIncomes(monthIncomes);
      setStats(aggregatedStats);

      // Store dynamic theme globally
      applyTheme(userSettings.theme);

      // Form month data markers mapping based on aggregate stats response
      const markerMap: { [key: string]: boolean } = {};
      if (aggregatedStats && aggregatedStats.monthlySummaries) {
        aggregatedStats.monthlySummaries.forEach((sum: any) => {
          // If month has manual data or was compiled with expenses
          markerMap[sum.key] = sum.spent > 0 || sum.income > userSettings.defaultIncome;
        });
      }
      setHasDataMap(markerMap);

      setSaveStatus('synced');
    } catch (err: any) {
      console.error('Ledger synchronizing failed:', err);
      setSaveStatus('offline');
      triggerToast('Lege database disconnected');
    }
  };

  useEffect(() => {
    if (authed) {
      fetchLedgerData(currentMonthIndex);
    }
  }, [authed, currentMonthIndex]);

  // Auth expiration catch rules
  useEffect(() => {
    const handleAuthExpired = () => {
      removeToken();
      setAuthed(false);
      triggerToast('Sequence expired. Re-authenticate');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  const handleLoginSuccess = (token: string) => {
    setAuthed(true);
    triggerToast('Access Approved');
  };

  const handleLogout = () => {
    removeToken();
    setAuthed(false);
    triggerToast('Session Dismissed');
  };

  // Finance Transactions Handlers
  const handleAddExpense = async (expense: {
    category: string;
    description: string;
    amount: number;
    isRecurring: boolean;
  }) => {
    setSaveStatus('saving');
    try {
      const monthKey = getMonthKey(currentMonthIndex);
      // Auto formatting simple date to displaying month, e.g. "Jun 13"
      const now = new Date();
      const displayDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      await api.createExpense({
        monthKey,
        date: displayDate,
        ...expense,
      });

      triggerToast('Expense registered');
      await fetchLedgerData(currentMonthIndex);
    } catch (err: any) {
      setSaveStatus('offline');
      triggerToast(err.message || 'Error logging entry');
    }
  };

  const handleAddIncome = async (income: { description: string; amount: number }) => {
    setSaveStatus('saving');
    try {
      const monthKey = getMonthKey(currentMonthIndex);
      const now = new Date();
      const displayDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      await api.createIncome({
        monthKey,
        date: displayDate,
        ...income,
      });

      triggerToast('Auxiliary income registered');
      await fetchLedgerData(currentMonthIndex);
    } catch (err: any) {
      setSaveStatus('offline');
      triggerToast(err.message || 'Error recording income');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setSaveStatus('saving');
    try {
      await api.deleteExpense(id);
      triggerToast('Expense removed');
      await fetchLedgerData(currentMonthIndex);
    } catch (err: any) {
      setSaveStatus('offline');
      triggerToast(err.message || 'Deletion blocked');
    }
  };

  const handleUpdateSettings = async (updatedConfigs: Partial<Settings>) => {
    setSaveStatus('saving');
    try {
      const updatedResponse = await api.updateSettings(updatedConfigs);
      setSettings(updatedResponse);
      applyTheme(updatedResponse.theme);
      triggerToast('Constraints recompiled');
      await fetchLedgerData(currentMonthIndex);
    } catch (err: any) {
      setSaveStatus('offline');
      triggerToast('Failed saving constraints');
    }
  };

  const handleUpdateLimit = async (categoryLimitId: string, limitAmount: number) => {
    setSaveStatus('saving');
    try {
      await api.updateBudgetLimit(categoryLimitId, limitAmount);
      triggerToast(`${categoryLimitId} ceiling re-overridden`);
      await fetchLedgerData(currentMonthIndex);
    } catch (err: any) {
      setSaveStatus('offline');
      triggerToast('Failed overriding ceiling');
    }
  };

  if (!authed) {
    return <Login onLoginSuccess={handleLoginSuccess} apiLogin={api.login} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] font-mono transition-all duration-300 relative select-none">
      
      {/* Upper Navigation Row */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} saveStatus={saveStatus} />
      
      <MonthNav
        currentMonth={currentMonthIndex}
        hasDataMap={hasDataMap}
        onMonthChange={setCurrentMonthIndex}
      />

      {/* Main viewport panels */}
      <main className="flex-1 overflow-x-hidden pt-4 pb-28">
        {currentView === 'budget' ? (
          <BudgetView
            currentMonthIndex={currentMonthIndex}
            settings={settings}
            limits={limits}
            expenses={expenses}
            incomes={incomes}
            stats={stats}
            onAddExpense={handleAddExpense}
            onAddIncome={handleAddIncome}
            onDeleteExpense={handleDeleteExpense}
          />
        ) : (
          <OverviewView
            stats={stats}
            limits={limits}
            onSelectMonth={setCurrentMonthIndex}
            onViewChange={setCurrentView}
            selectedMonthIndex={currentMonthIndex}
          />
        )}
      </main>

      {/* Controls drawers & overlays */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        limits={limits}
        onSaveSettings={handleUpdateSettings}
        onSaveLimit={handleUpdateLimit}
      />

      {/* Underlay Floating Action: LogOut buttons */}
      <div className="fixed bottom-[94px] right-[20px] z-30" id="logout-button-trigger">
        <button
          id="system-logout-btn"
          onClick={handleLogout}
          className="p-3 bg-[var(--bg2)] border border-[var(--line)] text-[var(--text3)] hover:text-[var(--over)] rounded-full hover:border-[var(--over)] shadow-md transition-all active:scale-95 cursor-pointer flex justify-center items-center"
          title="Disconnect Ledger"
        >
          <LogOut size={14} />
        </button>
      </div>

      {/* Notification Toast Pills */}
      {toastMessage && (
        <div
          id="toast-notification-pill"
          className="fixed bottom-[104px] left-1/2 -translate-x-1/2 z-50 bg-[var(--bg3)] border border-[var(--line)] py-2.5 px-6 rounded-full text-[9px] text-[var(--bone)] font-mono uppercase tracking-widest pointer-events-none select-none shadow-xl animate-bounce-short"
        >
          {toastMessage}
        </div>
      )}

      {/* Profile Modal Overlay */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsProfileOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-gradient-to-b from-[#1c1b18] to-[#0d0c0b] border border-[#302b23] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
            id="profile-modal-card"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#a29e96] uppercase font-bold">LEDGER OWNER</span>
                <h4 className="font-serif text-3xl font-bold text-[#ffe099] mt-1">E. Reyes</h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#1c1b18] border border-[#f59e0b]/40 flex items-center justify-center font-serif text-[#ffe099] font-bold text-lg shadow-inner select-none">
                ER
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs text-left border-y border-[#2d281f] py-4">
              <div className="flex justify-between">
                <span className="text-[#8c867a] uppercase tracking-wider">Account ID</span>
                <span className="text-[#fcfaf2] font-semibold text-[11px] sm:text-xs font-mono">usmc6123@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8c867a] uppercase tracking-wider">Scope Cycle</span>
                <span className="text-[#fcfaf2] font-semibold text-[11px] sm:text-xs font-mono">2026 Fiscal Ledger</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8c867a] uppercase tracking-wider">System Link</span>
                <span className="text-[#10b981] font-bold text-[11px] sm:text-xs font-mono">● ONLINE / LINKED</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="w-full bg-[#27231c] hover:bg-[#3e3524] border border-[#483c27] text-[#ffe099] rounded-xl py-3 text-xs uppercase tracking-widest font-bold transition-all cursor-pointer active:scale-95"
              >
                Close Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  handleLogout();
                }}
                className="w-full bg-gradient-to-r from-[#ef4444]/20 to-[#ef4444]/15 hover:from-[#ef4444]/35 hover:to-[#ef4444]/25 border border-[#ef4444]/40 text-[#ef4444] rounded-xl py-3 text-xs uppercase tracking-widest font-bold transition-all cursor-pointer active:scale-95 animate-pulse"
              >
                Disconnect Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom swaps buttons bar */}
      <BottomNav 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setIsProfileOpen(false);
          setIsSettingsOpen(false);
        }} 
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          setIsProfileOpen(false);
        }}
        onOpenProfile={() => {
          setIsProfileOpen(true);
          setIsSettingsOpen(false);
        }}
        isSettingsOpen={isSettingsOpen}
        isProfileOpen={isProfileOpen}
      />
    </div>
  );
}
