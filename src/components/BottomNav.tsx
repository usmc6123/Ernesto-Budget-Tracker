interface BottomNavProps {
  currentView: 'budget' | 'overview';
  onViewChange: (view: 'budget' | 'overview') => void;
}

export function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  return (
    <div
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--line)] bg-[var(--bg2)]/95 backdrop-blur-md px-6 pt-5 pb-8 shadow-2xl flex justify-around items-center"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}
    >
      <button
        id="nav-budget-btn"
        onClick={() => onViewChange('budget')}
        className={`flex flex-col items-center gap-1.5 font-mono text-[11px] sm:text-xs uppercase tracking-[0.25em] transition-all cursor-pointer ${
          currentView === 'budget'
            ? 'text-[var(--accent)] font-bold scale-110'
            : 'text-[var(--text3)] hover:text-[var(--text2)]'
        }`}
      >
        <span className="text-[22px] leading-none">◈</span>
        <span>budget</span>
      </button>

      <button
        id="nav-overview-btn"
        onClick={() => onViewChange('overview')}
        className={`flex flex-col items-center gap-1.5 font-mono text-[11px] sm:text-xs uppercase tracking-[0.25em] transition-all cursor-pointer ${
          currentView === 'overview'
            ? 'text-[var(--accent)] font-bold scale-110'
            : 'text-[var(--text3)] hover:text-[var(--text2)]'
        }`}
      >
        <span className="text-[22px] leading-none">◇</span>
        <span>overview</span>
      </button>
    </div>
  );
}

export default BottomNav;
