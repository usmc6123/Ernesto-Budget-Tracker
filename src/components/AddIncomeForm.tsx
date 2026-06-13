import React, { useState, useRef } from 'react';

interface AddIncomeFormProps {
  onAddIncome: (income: {
    description: string;
    amount: number;
  }) => Promise<void>;
  disabled?: boolean;
}

export function AddIncomeForm({ onAddIncome, disabled = false }: AddIncomeFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled || submitting) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid income amount.');
      return;
    }

    setSubmitting(true);
    try {
      await onAddIncome({
        description: description.trim() || 'Income Add-on',
        amount: numAmount,
      });
      setDescription('');
      setAmount('');
    } catch (err) {
      console.error('Failed to add income:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDescKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      amountRef.current?.focus();
    }
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (disabled) return null;

  return (
    <div className="max-w-4xl mx-auto bg-[var(--bg2)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 shadow-md" id="add-income-module">
      <div className="flex items-center gap-4 text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[var(--accent)] mb-6 font-bold">
        <span>Add Income Entry</span>
        <div className="flex-grow h-[1px] bg-[var(--line)] opacity-80" />
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3" id="income-form-row-1">
          <input
            id="income-description-input"
            type="text"
            placeholder="description (e.g. consulting, dividend)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleDescKeyDown}
            className="flex-grow bg-[var(--bg3)] border border-[var(--line)] text-[var(--text)] rounded-xl px-4 py-3.5 text-sm sm:text-base focus:border-[var(--accent)] placeholder-[var(--muted)] outline-none shadow-inner"
            autoComplete="off"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-[var(--muted)]">$</span>
            <input
              ref={amountRef}
              id="income-amount-input"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleAmountKeyDown}
              className="w-full sm:w-32 bg-[var(--bg3)] border border-[var(--line)] text-[var(--text)] rounded-xl px-4 py-3.5 text-sm sm:text-base focus:border-[var(--accent)] placeholder-[var(--muted)] outline-none text-right font-mono font-semibold tabular-nums shadow-inner"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex justify-end mt-2" id="income-form-row-2">
          <button
            type="submit"
            id="submit-income-form-btn"
            disabled={submitting}
            className="w-full sm:w-auto bg-[var(--good)] border border-[var(--good)] rounded-xl px-6 py-3.5 text-xs font-mono uppercase tracking-widest text-[var(--bg)] font-bold hover:bg-transparent hover:text-[var(--good)] cursor-pointer transition-all active:scale-95 disabled:opacity-50 shadow-md"
          >
            {submitting ? 'Adding...' : '+ Add Income'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddIncomeForm;
