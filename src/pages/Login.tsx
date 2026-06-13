import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
  apiLogin: (password: string) => Promise<any>;
}

export function Login({ onLoginSuccess, apiLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin(password);
      if (res && res.token) {
        onLoginSuccess(res.token);
      } else {
        setError('Incorrect ledger password sequence');
      }
    } catch (err: any) {
      setError(err.message || 'Verification rejected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#080807] flex flex-col justify-center items-center px-6 relative overflow-hidden"
      id="login-page-container"
    >
      {/* Decorative top accent glow */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-25" />

      <div className="w-full max-w-xs space-y-8 animate-fade-in text-center z-10" id="login-box">
        {/* Typographical lockup */}
        <div className="space-y-3">
          <div className="text-[10px] font-mono tracking-[0.4em] uppercase text-[var(--muted)]">
            SYSTEM AUTHENTICATION
          </div>
          <h1 className="font-serif text-[42px] font-light leading-none tracking-tight text-[var(--text)] uppercase">
            Budget <span className="italic block text-[var(--bone)]">2026</span>
          </h1>
          <p className="text-[9px] font-mono tracking-[0.25em] uppercase text-[var(--muted)] mt-1">
            E. Reyes · Personal Ledger
          </p>
        </div>

        {/* Minimal single field form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              placeholder="ENTER LEDGER PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-[var(--bg2)] border border-[var(--line)] rounded px-4 py-4 text-center font-mono text-xs tracking-widest text-[var(--text)] uppercase placeholder-[var(--muted)] focus:border-[var(--bone)] outline-none transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 justify-center text-[9px] font-mono uppercase tracking-wider text-[var(--over)]" id="login-error-toast">
              <ShieldAlert size={12} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            id="login-submit-btn"
            className="w-full bg-[var(--bg2)] hover:bg-[var(--line)] border border-[var(--line)] hover:border-[var(--muted)] text-[var(--bone)] font-mono text-[9px] uppercase tracking-[0.25em] py-4 rounded cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'VERIFYING...' : 'UNLOCK LEDGER'}
          </button>
        </form>

        {/* Dynamic credential warning for live debug builds */}
        <div className="pt-12 text-center" id="credentials-helper">
          <span className="text-[8px] font-mono tracking-widest uppercase text-[var(--text3)]">
            DEV KEY SEQUENCE · <span className="text-[var(--text2)] font-semibold border-b border-[var(--line)] pb-0.5 select-all">password123</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;
