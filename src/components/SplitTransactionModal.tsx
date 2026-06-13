import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { BudgetLimit } from '../types';
import { formatCurrency } from '../lib/utils';

interface SplitRow {
  id: string;
  category: string;
  description: string;
  amount: string;
}

interface SplitTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  limits: BudgetLimit[];
  onAddExpense: (expense: {
    category: string;
    description: string;
    amount: number;
    isRecurring: boolean;
    isSplit: boolean;
  }) => Promise<void>;
  triggerToast: (msg: string) => void;
}

export function SplitTransactionModal({
  isOpen,
  onClose,
  limits,
  onAddExpense,
  triggerToast,
}: SplitTransactionModalProps) {
  const [totalAmount, setTotalAmount] = useState('');
  const [rows, setRows] = useState<SplitRow[]>([
    { id: '1', category: limits[0]?.category || 'Groceries', description: '', amount: '' },
    { id: '2', category: limits[0]?.category || 'Groceries', description: '', amount: '' },
  ]);
  const [saving, setSaving] = useState(false);

  // Sync rows' default categories when limits fetch succeeds
  useEffect(() => {
    if (limits.length > 0) {
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          category: r.category || limits[0].category,
        }))
      );
    }
  }, [limits]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: Math.random().toString(36).substring(2, 9),
        category: limits[0]?.category || 'Groceries',
        description: '',
        amount: '',
      },
    ]);
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) {
      triggerToast('Minimum 1 split row required');
      return;
    }
    setRows(rows.filter((r) => r.id !== id));
  };

  const handleRowChange = (id: string, field: keyof SplitRow, value: string) => {
    setRows(
      rows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const numericTotal = parseFloat(totalAmount) || 0;
  const allocatedTotal = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const diff = numericTotal - allocatedTotal;
  const isFullyAllocated = Math.abs(diff) < 0.01 && numericTotal > 0;

  const handleSaveAll = async () => {
    if (numericTotal <= 0) {
      alert('Please enter a valid total receipt amount.');
      return;
    }
    if (!isFullyAllocated) {
      alert(`Allocation mismatch! Remaining: ${formatCurrency(diff)}`);
      return;
    }

    // Verify each row has valid parseable values
    for (const r of rows) {
      const val = parseFloat(r.amount);
      if (isNaN(val) || val <= 0) {
        alert('All split rows must hold positive amounts.');
        return;
      }
    }

    setSaving(true);
    try {
      // Create entries in sequence
      for (const r of rows) {
        await onAddExpense({
          category: r.category,
          description: r.description.trim() || `Split: ${r.category}`,
          amount: parseFloat(r.amount),
          isRecurring: false,
          isSplit: true,
        });
      }
      triggerToast('Split transaction parsed');
      // Reset State
      setTotalAmount('');
      setRows([
        { id: '1', category: limits[0]?.category || 'Groceries', description: '', amount: '' },
        { id: '2', category: limits[0]?.category || 'Groceries', description: '', amount: '' },
      ]);
      onClose();
    } catch (err: any) {
      triggerToast(err.message || 'Error processing splits');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        id="split-transaction-card"
        className="w-full max-w-xl bg-[#080807] border border-[#ffb020]/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#2d281f] pb-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#a29e96] uppercase font-bold">MUTUAL DEBIT MANAGER</span>
            <h4 className="font-mono text-xl font-bold text-[#ffe099] uppercase">SPLIT TRANSACTION</h4>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-[#2d281f] hover:border-[#ffb020]/40 text-[#a29e96] hover:text-[#ffe099] rounded-xl transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input: Total receipt amount */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-[#a29e96] font-bold">
            Total Receipt Amount ($)
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xl font-mono text-zinc-600">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full bg-[#141310] border border-[#2d281f] text-[#fcfaf2] rounded-xl px-4 py-3 text-lg font-mono placeholder-zinc-700 outline-none focus:border-[#ffb020]"
            />
          </div>
        </div>

        {/* Dynamic splits list container */}
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          <label className="text-[11px] font-mono uppercase tracking-wider text-[#a29e96] font-bold block">
            Split Fractions Table
          </label>

          {rows.map((row, index) => (
            <div 
              key={row.id} 
              className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-[#100f0d] border border-[#221e17] rounded-2xl p-4 relative"
            >
              {/* Category */}
              <div className="w-full sm:w-1/3">
                <select
                  value={row.category}
                  onChange={(e) => handleRowChange(row.id, 'category', e.target.value)}
                  className="w-full bg-[#181612] border border-[#2d281f] text-[#ffe099] rounded-xl px-3 py-2.5 text-xs font-mono outline-none"
                >
                  {limits.map((l) => (
                    <option key={l.id} value={l.category} className="bg-[#141310]">
                      {l.category.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <input
                type="text"
                placeholder="description (optional)"
                value={row.description}
                onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                className="w-full sm:w-2/5 bg-[#181612] border border-[#2d281f] text-[#fcfaf2] rounded-xl px-3 py-2.5 text-xs font-mono outline-none placeholder-zinc-600"
              />

              {/* Amount */}
              <div className="flex items-center gap-2 w-full sm:w-1/4">
                <span className="text-xs font-mono text-zinc-600">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={row.amount}
                  onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                  className="w-full bg-[#181612] border border-[#2d281f] text-[#fcfaf2] rounded-xl px-3 py-2.5 text-xs font-mono text-right outline-none placeholder-zinc-600"
                />
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDeleteRow(row.id)}
                className="p-2 border border-transparent hover:border-[#ef4444]/20 text-zinc-600 hover:text-[#ef4444] rounded-lg transition"
                title="Remove Split Row"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddRow}
            className="w-full border border-dashed border-[#ffb020]/25 hover:border-[#ffb020]/50 py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-mono tracking-widest text-[#ffb020] uppercase cursor-pointer"
          >
            <Plus size={14} /> Add Split Row
          </button>
        </div>

        {/* Live status panel */}
        <div className="bg-[#100f0d] border border-[#221e17] rounded-2xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs font-mono uppercase tracking-wider">
          <div className="text-zinc-500 font-semibold">
            Allocated: <span className="text-[#ffb020] font-bold">${allocatedTotal.toFixed(2)}</span> of <span className="text-[#fcfaf2]">${numericTotal.toFixed(2)}</span>
          </div>

          <div id="allocation-state-badge">
            {isFullyAllocated ? (
              <span className="text-[#10b981] font-bold">✓ Fully Allocated</span>
            ) : diff > 0 ? (
              <span className="text-[#ef4444] font-bold">⚠ ${diff.toFixed(2)} Unallocated</span>
            ) : (
              <span className="text-[#ef4444] font-bold">⚠ Over budget by ${Math.abs(diff).toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-1/2 bg-[#27231c] hover:bg-[#342f26] border border-[#483c27] text-[#ffe099] rounded-xl py-3 text-xs uppercase font-mono tracking-widest font-bold transition active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !isFullyAllocated}
            onClick={handleSaveAll}
            className="w-full sm:w-1/2 bg-[#ffb020] hover:bg-[#ffe099] border border-[#ffb020] text-black rounded-xl py-3 text-xs uppercase font-mono tracking-widest font-bold transition active:scale-95 disabled:opacity-30"
          >
            {saving ? 'Saving splits...' : '✓ Save All Splits'}
          </button>
        </div>
      </div>
    </div>
  );
}
