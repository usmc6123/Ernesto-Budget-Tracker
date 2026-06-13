import React, { useState, useRef } from 'react';
import { BudgetLimit } from '../types';

interface AddExpenseFormProps {
  limits: BudgetLimit[];
  onAddExpense: (expense: {
    category: string;
    description: string;
    amount: number;
    isRecurring: boolean;
  }) => Promise<void>;
  disabled?: boolean;
}

export function AddExpenseForm({ limits, onAddExpense, disabled = false }: AddExpenseFormProps) {
  const [category, setCategory] = useState(limits[0]?.category || 'Groceries');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled || submitting) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    setSubmitting(true);
    try {
      await onAddExpense({
        category,
        description: description.trim() || category,
        amount: numAmount,
        isRecurring,
      });
      // Clear fields upon success
      setDescription('');
      setAmount('');
      setIsRecurring(false);
    } catch (err) {
      console.error('Failed to create expense:', err);
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
    <div className="max-w-4xl mx-auto bg-[var(--bg2)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 shadow-md" id="add-expense-module">
      <div className="flex items-center gap-4 text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[var(--accent)] mb-6 font-bold">
        <span>Add Expense Entry</span>
        <div className="flex-grow h-[1px] bg-[var(--line)] opacity-80" />
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div id="expense-form-row-1">
          <select
            id="expense-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[var(--bg3)] border border-[var(--line)] text-[var(--text)] rounded-xl px-4 py-3.5 text-sm sm:text-base focus:border-[var(--accent)] outline-none cursor-pointer appearance-none shadow-inner"
          >
            {limits.map((l) => (
              <option key={l.id} value={l.category} className="bg-[var(--bg2)] text-[var(--text)]">
                {l.category} ({l.type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3" id="expense-form-row-2">
          <input
            id="expense-description-input"
            type="text"
            placeholder="description (e.g. apple store)"
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
              id="expense-amount-input"
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

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-2" id="expense-form-row-3">
          <label className="flex items-center gap-3 font-mono text-[11px] sm:text-xs text-[var(--text2)] uppercase tracking-wider select-none cursor-pointer">
            <input
              type="checkbox"
              id="expense-recurring-toggle"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="accent-[var(--bone)] w-4.5 h-4.5 cursor-pointer rounded"
            />
            <span>Recurring Charge</span>
          </label>

          <button
            type="submit"
            id="submit-expense-form-btn"
            disabled={submitting}
            className="w-full sm:w-auto bg-[var(--accent)] border border-[var(--accent)] rounded-xl px-6 py-3.5 text-xs font-mono uppercase tracking-widest text-[var(--bg)] font-bold hover:bg-transparent hover:text-[var(--accent)] cursor-pointer transition-all active:scale-95 disabled:opacity-50 shadow-md"
          >
            {submitting ? 'Adding...' : '+ Add Expense'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddExpenseForm;
