import { Wallet, Settings, BarChart3, User } from 'lucide-react';

interface BottomNavProps {
  currentView: 'budget' | 'overview';
  onViewChange: (view: 'budget' | 'overview') => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  isSettingsOpen: boolean;
  isProfileOpen: boolean;
}

export function BottomNav({
  currentView,
  onViewChange,
  onOpenSettings,
  onOpenProfile,
  isSettingsOpen,
  isProfileOpen,
}: BottomNavProps) {
  const isBudgetActive = currentView === 'budget' && !isSettingsOpen && !isProfileOpen;
  const isReportsActive = currentView === 'overview' && !isSettingsOpen && !isProfileOpen;

  return (
    <div
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--line)] bg-[var(--bg2)]/95 backdrop-blur-md px-6 pt-5 pb-8 shadow-2xl flex justify-around items-center"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}
    >
      {/* BUDGET Tab */}
      <button
        id="nav-budget-btn"
        type="button"
        onClick={() => {
          onViewChange('budget');
        }}
        className={`flex flex-col items-center gap-1.5 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all cursor-pointer ${
          isBudgetActive
            ? 'text-[var(--accent)] font-bold scale-105'
            : 'text-[var(--text3)] hover:text-[var(--text2)]'
        }`}
      >
        <Wallet size={18} className={isBudgetActive ? 'text-[var(--accent)]' : 'text-[var(--text3)]'} />
        <span>BUDGET</span>
      </button>

      {/* SETTINGS Tab */}
      <button
        id="nav-settings-btn"
        type="button"
        onClick={onOpenSettings}
        className={`flex flex-col items-center gap-1.5 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all cursor-pointer ${
          isSettingsOpen
            ? 'text-[var(--accent)] font-bold scale-105'
            : 'text-[var(--text3)] hover:text-[var(--text2)]'
        }`}
      >
        <Settings size={18} className={isSettingsOpen ? 'text-[var(--accent)]' : 'text-[var(--text3)]'} />
        <span>Settings</span>
      </button>

      {/* REPORTS Tab */}
      <button
        id="nav-reports-btn"
        type="button"
        onClick={() => {
          onViewChange('overview');
        }}
        className={`flex flex-col items-center gap-1.5 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all cursor-pointer ${
          isReportsActive
            ? 'text-[var(--accent)] font-bold scale-105'
            : 'text-[var(--text3)] hover:text-[var(--text2)]'
        }`}
      >
        <BarChart3 size={18} className={isReportsActive ? 'text-[var(--accent)]' : 'text-[var(--text3)]'} />
        <span>Reports</span>
      </button>

      {/* PROFILE Tab */}
      <button
        id="nav-profile-btn"
        type="button"
        onClick={onOpenProfile}
        className={`flex flex-col items-center gap-1.5 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all cursor-pointer ${
          isProfileOpen
            ? 'text-[var(--accent)] font-bold scale-105'
            : 'text-[var(--text3)] hover:text-[var(--text2)]'
        }`}
      >
        <User size={18} className={isProfileOpen ? 'text-[var(--accent)]' : 'text-[var(--text3)]'} />
        <span>Profile</span>
      </button>
    </div>
  );
}

export default BottomNav;
