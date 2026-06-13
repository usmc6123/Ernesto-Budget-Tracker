import React, { useState, useEffect } from 'react';
import { Settings, BudgetLimit } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { X, Save, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  limits: BudgetLimit[];
  onSaveSettings: (settings: Partial<Settings>) => Promise<void>;
  onSaveLimit: (id: string, limit: number) => Promise<void>;
}

export function SettingsDrawer({
  isOpen,
  onClose,
  settings,
  limits,
  onSaveSettings,
  onSaveLimit,
}: SettingsDrawerProps) {
  // Local state for system-wide adjustments
  const [budgetCeiling, setBudgetCeiling] = useState(String(settings.budgetCeiling));
  const [savingsTarget, setSavingsTarget] = useState(String(settings.savingsTarget));
  const [defaultIncome, setDefaultIncome] = useState(String(settings.defaultIncome));
  const [theme, setTheme] = useState(settings.theme);

  // Local state for category limits overrides
  const [localLimits, setLocalLimits] = useState<{ [id: string]: string }>({});
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  useEffect(() => {
    setBudgetCeiling(String(settings.budgetCeiling));
    setSavingsTarget(String(settings.savingsTarget));
    setDefaultIncome(String(settings.defaultIncome));
    setTheme(settings.theme);
  }, [settings, isOpen]);

  useEffect(() => {
    const limitsMap: { [id: string]: string } = {};
    limits.forEach((limit) => {
      limitsMap[limit.id] = String(limit.limit);
    });
    setLocalLimits(limitsMap);
  }, [limits, isOpen]);

  const handleSaveGlobalConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings({
      budgetCeiling: parseFloat(budgetCeiling) || 2615,
      savingsTarget: parseFloat(savingsTarget) || 2000,
      defaultIncome: parseFloat(defaultIncome) || 0,
      theme,
    });
  };

  const handleLimitOverride = async (id: string) => {
    const newVal = parseFloat(localLimits[id]);
    if (isNaN(newVal) || newVal < 0) {
      alert('Must be a positive number');
      return;
    }
    setSavingCategory(id);
    try {
      await onSaveLimit(id, newVal);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCategory(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="settings-drawer-overlay" className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        id="settings-overlay-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Body Panel */}
      <div
        id="settings-drawer-body"
        className="relative w-full max-w-md h-full bg-[var(--bg)] border-l border-[var(--line)] shadow-2xl flex flex-col z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--line)] bg-[var(--bg2)]" id="settings-drawer-header">
          <div>
            <h2 className="font-serif text-xl font-light tracking-wide text-[var(--bone)]">
              Ledger Configuration
            </h2>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--accent)] font-semibold mt-1">
              Settings & Overrides
            </p>
          </div>
          <button
            onClick={onClose}
            id="close-settings-drawer-btn"
            className="p-2.5 border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--bone)] text-[var(--text2)] rounded-xl transition-colors cursor-pointer bg-[var(--bg3)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable controls panel */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-none" id="settings-scroll-inputs">
          {/* Section 1: Core Parameters */}
          <section className="space-y-4" id="settings-core-parameters">
            <div className="text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[var(--accent)] border-b border-[var(--line)] pb-3 font-bold">
              Core Ledger Constraints
            </div>

            <form onSubmit={handleSaveGlobalConfigs} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text2)] font-bold">
                    Budget Ceiling ($)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={budgetCeiling}
                    onChange={(e) => setBudgetCeiling(e.target.value)}
                    className="bg-[var(--bg3)] border border-[var(--line)] text-[var(--text)] rounded-xl px-4 py-3 text-sm focus:border-[var(--accent)] outline-none tabular-nums shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text2)] font-bold">
                    Savings Target ($)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={savingsTarget}
                    onChange={(e) => setSavingsTarget(e.target.value)}
                    className="bg-[var(--bg3)] border border-[var(--line)] text-[var(--text)] rounded-xl px-4 py-3 text-sm focus:border-[var(--accent)] outline-none tabular-nums shadow-inner"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text2)] font-bold">
                  Default Monthly Income ($)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={defaultIncome}
                  onChange={(e) => setDefaultIncome(e.target.value)}
                  className="w-full bg-[var(--bg3)] border border-[var(--line)] text-[var(--text)] rounded-xl px-4 py-3 text-sm focus:border-[var(--accent)] outline-none tabular-nums shadow-inner"
                />
              </div>

              <button
                type="submit"
                id="save-settings-configs-btn"
                className="w-full bg-[var(--accent)] border border-[var(--accent)] rounded-xl py-3.5 text-xs font-mono uppercase tracking-widest text-[var(--bg)] font-bold hover:bg-transparent hover:text-[var(--accent)] transition-all cursor-pointer flex justify-center items-center gap-2 shadow-md active:scale-95"
              >
                <Save size={13} />
                Save Core Constraints
              </button>
            </form>
          </section>

          {/* Section 2: Visual Themes */}
          <section className="space-y-3" id="settings-theme-selection">
            <div className="text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[var(--accent)] border-b border-[var(--line)] pb-3 font-bold">
              Visual Core Skin
            </div>
            <ThemeSelector currentTheme={theme} onSelect={(id) => setTheme(id)} />
          </section>

          {/* Section 3: Category Limit Overrides */}
          <section className="space-y-4" id="settings-limits-overrides">
            <div className="text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[var(--accent)] border-b border-[var(--line)] pb-3 font-bold">
              Category Limits Overrides
            </div>

            <div className="space-y-3.5">
              {limits.map((lim) => (
                <div
                  key={lim.id}
                  id={`override-row-${lim.id}`}
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-[var(--line)] bg-[var(--bg2)] shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: lim.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] sm:text-xs font-sans font-bold text-[var(--text)] truncate">
                        {lim.category}
                      </div>
                      <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text3)] font-semibold">
                        {lim.type}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={localLimits[lim.id] || ''}
                      onChange={(e) =>
                        setLocalLimits({ ...localLimits, [lim.id]: e.target.value })
                      }
                      className="w-24 bg-[var(--bg3)] border border-[var(--line)] text-[var(--text)] rounded-xl px-3 py-2 text-right font-mono text-sm outline-none focus:border-[var(--accent)] shadow-inner"
                    />

                    <button
                      id={`save-override-btn-${lim.id}`}
                      disabled={savingCategory === lim.id}
                      onClick={() => handleLimitOverride(lim.id)}
                      className="p-2.5 border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--bone)] rounded-xl bg-[var(--bg3)] cursor-pointer text-[var(--text2)] transition-colors"
                      title="Save Override"
                    >
                      <Save size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: About */}
          <section className="p-5 border border-[var(--line)] bg-[var(--bg3)] rounded-2xl space-y-2.5 text-center shadow-md" id="settings-ledger-about">
            <div className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-[var(--accent)] font-bold">
              E. Reyes · Ledger Engine
            </div>
            <p className="text-[10px] sm:text-[11px] font-mono text-[var(--text3)] tracking-wide leading-relaxed">
              BUDGET 2026 is privately signed and compiled. System operates under full server authentication verifying each request transaction atomically.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SettingsDrawer;
