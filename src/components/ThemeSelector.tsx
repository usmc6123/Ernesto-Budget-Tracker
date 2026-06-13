import { useEffect, useState, useRef } from 'react';

export interface ThemeConfig {
  id: string;
  name: string;
  properties: { [key: string]: string };
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'MONOCHROME',
    name: 'Monochrome (Default)',
    properties: {
      '--bg': '#080807',
      '--bg2': '#0f0f0d',
      '--bg3': '#181815',
      '--bg4': '#202020',
      '--line': '#2a2a27',
      '--muted': '#4a4a45',
      '--text': '#e8e5de',
      '--text2': '#9a9690',
      '--text3': '#666660',
      '--bone': '#d4cfc4',
      '--accent': '#c8bfaa',
      '--warm': '#b8b0a0',
      '--over': '#e87a7a',
      '--good': '#7ac8a9',
    },
  },
  {
    id: 'MIDNIGHT',
    name: 'Midnight Teal',
    properties: {
      '--bg': '#0a0c16',
      '--bg2': '#12162a',
      '--bg3': '#1a203f',
      '--bg4': '#232c52',
      '--line': '#2d3868',
      '--muted': '#45558d',
      '--text': '#e2e8f0',
      '--text2': '#94a3b8',
      '--text3': '#475569',
      '--bone': '#93c5fd',
      '--accent': '#38bdf8',
      '--warm': '#0ea5e9',
      '--over': '#f87171',
      '--good': '#34d399',
    },
  },
  {
    id: 'BLOOD_IRON',
    name: 'Blood Iron',
    properties: {
      '--bg': '#120606',
      '--bg2': '#1d0c0c',
      '--bg3': '#2c1414',
      '--bg4': '#3d1c1c',
      '--line': '#4f2424',
      '--muted': '#7a3e3e',
      '--text': '#f5e6e6',
      '--text2': '#c49999',
      '--text3': '#8a5e5e',
      '--bone': '#fca5a5',
      '--accent': '#ef4444',
      '--warm': '#dc2626',
      '--over': '#f87171',
      '--good': '#10b981',
    },
  },
  {
    id: 'GOLD_STANDARD',
    name: 'Gold Standard',
    properties: {
      '--bg': '#0d0c08',
      '--bg2': '#17150f',
      '--bg3': '#242017',
      '--bg4': '#322d20',
      '--line': '#423c2a',
      '--muted': '#6b5f45',
      '--text': '#f7f4eb',
      '--text2': '#c7bc9d',
      '--text3': '#8c8064',
      '--bone': '#fde047',
      '--accent': '#fbbf24',
      '--warm': '#d97706',
      '--over': '#ef4444',
      '--good': '#10b981',
    },
  },
  {
    id: 'MATRIX',
    name: 'Matrix Digital',
    properties: {
      '--bg': '#040804',
      '--bg2': '#091209',
      '--bg3': '#112211',
      '--bg4': '#193319',
      '--line': '#224422',
      '--muted': '#3b7a3b',
      '--text': '#e6f5e6',
      '--text2': '#82c382',
      '--text3': '#4f944f',
      '--bone': '#4ade80',
      '--accent': '#22c55e',
      '--warm': '#16a34a',
      '--over': '#f87171',
      '--good': '#22c55e',
    },
  },
  {
    id: 'NEON_PUMP',
    name: 'Neon Pump',
    properties: {
      '--bg': '#0f0914',
      '--bg2': '#1b1225',
      '--bg3': '#2a1d3a',
      '--bg4': '#3c2954',
      '--line': '#513a70',
      '--muted': '#7c5ba6',
      '--text': '#f3ebf7',
      '--text2': '#c399e0',
      '--text3': '#8c66ab',
      '--bone': '#f472b6',
      '--accent': '#c084fc',
      '--warm': '#a855f7',
      '--over': '#f87171',
      '--good': '#10b981',
    },
  },
  {
    id: 'ARCTIC',
    name: 'Arctic Ice',
    properties: {
      '--bg': '#091016',
      '--bg2': '#111d27',
      '--bg3': '#1b2b3b',
      '--bg4': '#253c52',
      '--line': '#344f6a',
      '--muted': '#4f7194',
      '--text': '#eaf4fc',
      '--text2': '#9ec2e6',
      '--text3': '#648bb2',
      '--bone': '#38bdf8',
      '--accent': '#a5f3fc',
      '--warm': '#0ea5e9',
      '--over': '#f87171',
      '--good': '#34d399',
    },
  },
  {
    id: 'CARBON_FIRE',
    name: 'Carbon Fire',
    properties: {
      '--bg': '#0c0a09',
      '--bg2': '#171412',
      '--bg3': '#26201b',
      '--bg4': '#352d26',
      '--line': '#483c33',
      '--muted': '#735f51',
      '--text': '#f4f2f0',
      '--text2': '#c4b4a7',
      '--text3': '#8f7b6d',
      '--bone': '#f97316',
      '--accent': '#fb923c',
      '--warm': '#ea580c',
      '--over': '#f87171',
      '--good': '#10b981',
    },
  },
  {
    id: 'CHALK',
    name: 'Chalk White (Light)',
    properties: {
      '--bg': '#f5f4ef',
      '--bg2': '#edeae2',
      '--bg3': '#e0dbd0',
      '--bg4': '#ccc5b3',
      '--line': '#b3a893',
      '--muted': '#80745e',
      '--text': '#1a1a17',
      '--text2': '#4d483d',
      '--text3': '#807765',
      '--bone': '#1a1a17',
      '--accent': '#2b2b27',
      '--warm': '#4d483d',
      '--over': '#b91c1c',
      '--good': '#059669',
    },
  },
];

export function applyTheme(themeId: string) {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.properties).forEach(([propName, value]) => {
    root.style.setProperty(propName, value);
  });
  localStorage.setItem('reyes_budget_theme', themeId);
}

interface ThemeSelectorProps {
  currentTheme: string;
  onSelect: (themeId: string) => void;
}

export function ThemeSelector({ currentTheme, onSelect }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load setup
    const stored = localStorage.getItem('reyes_budget_theme') || 'MONOCHROME';
    applyTheme(stored);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeTheme = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  return (
    <div className="relative mt-2" id="theme-selector-container" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="theme-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[var(--bg3)] border border-[var(--line)] hover:border-[var(--accent)] text-[var(--text)] rounded-xl px-4 py-3.5 text-sm flex items-center justify-between transition-all cursor-pointer shadow-inner font-mono"
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1 flex-shrink-0">
            <span
              className="w-3 h-3 rounded-full border border-[var(--line)]"
              style={{ backgroundColor: activeTheme.properties['--bg'] }}
            />
            <span
              className="w-3 h-3 rounded-full border border-[var(--line)]"
              style={{ backgroundColor: activeTheme.properties['--bg2'] }}
            />
            <span
              className="w-3 h-3 rounded-full border border-[var(--line)] border-transparent"
              style={{ backgroundColor: activeTheme.properties['--bone'] }}
            />
            <span
              className="w-3 h-3 rounded-full border border-[var(--line)] border-transparent"
              style={{ backgroundColor: activeTheme.properties['--accent'] }}
            />
          </div>
          <span className="font-semibold text-xs sm:text-sm tracking-wide text-[var(--bone)]">
            {activeTheme.name}
          </span>
        </div>
        <span className={`text-[10px] text-[var(--text3)] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--accent)]' : ''}`}>
          ▼
        </span>
      </button>

      {/* Dropdown Options Box */}
      {isOpen && (
        <div
          id="theme-dropdown-options"
          className="absolute left-0 right-0 z-50 mt-2 bg-[var(--bg2)] border border-[var(--line)] rounded-2xl shadow-xl overflow-hidden divide-y divide-[var(--line)] max-h-64 overflow-y-auto scrollbar-none animate-fade-in"
        >
          {THEMES.map((theme) => {
            const isSelected = theme.id === currentTheme;
            return (
              <button
                key={theme.id}
                id={`theme-option-${theme.id}`}
                type="button"
                onClick={() => {
                  applyTheme(theme.id);
                  onSelect(theme.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-5 py-4 text-left flex items-center justify-between transition-all cursor-pointer font-mono",
                  isSelected
                    ? "bg-[var(--bg3)] hover:bg-[var(--bg3)] text-[var(--accent)]"
                    : "hover:bg-[var(--bg3)]/50 text-[var(--text2)] hover:text-[var(--text)]"
                )}
              >
                <span className={`text-xs sm:text-sm tracking-wide ${isSelected ? 'font-bold text-[var(--accent)]' : 'font-medium'}`}>
                  {theme.name}
                </span>
                
                <div className="flex gap-1 flex-shrink-0 ml-4">
                  <span
                    className="w-3 h-3 rounded-full border border-[var(--line)]"
                    style={{ backgroundColor: theme.properties['--bg'] }}
                  />
                  <span
                    className="w-3 h-3 rounded-full border border-[var(--line)]"
                    style={{ backgroundColor: theme.properties['--bg2'] }}
                  />
                  <span
                    className="w-3 h-3 rounded-full border border-[var(--line)] border-transparent"
                    style={{ backgroundColor: theme.properties['--bone'] }}
                  />
                  <span
                    className="w-3 h-3 rounded-full border border-[var(--line)] border-transparent"
                    style={{ backgroundColor: theme.properties['--accent'] }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
export default ThemeSelector;
