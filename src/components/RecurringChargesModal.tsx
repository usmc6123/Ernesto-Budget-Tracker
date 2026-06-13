import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface RecurringChargesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringExpenses: any[];
  onAddExpense: (expense: {
    category: string;
    description: string;
    amount: number;
    isRecurring: boolean;
  }) => Promise<void>;
  triggerToast: (msg: string) => void;
}

export function RecurringChargesModal({
  isOpen,
  onClose,
  recurringExpenses,
  onAddExpense,
  triggerToast,
}: RecurringChargesModalProps) {
  const [checkedMap, setCheckedMap] = useState<{ [id: string]: boolean }>({});
  const [saving, setSaving] = useState(false);

  // Initialize checks as checked by default
  useEffect(() => {
    if (isOpen && recurringExpenses.length > 0) {
      const initialMap: { [id: string]: boolean } = {};
      recurringExpenses.forEach((re) => {
        initialMap[re.id] = true;
      });
      setCheckedMap(initialMap);
    }
  }, [isOpen, recurringExpenses]);

  if (!isOpen || recurringExpenses.length === 0) return null;

  const toggleCheck = (id: string) => {
    setCheckedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectedCount = Object.values(checkedMap).filter(Boolean).length;

  const handleAddRecurring = async () => {
    setSaving(true);
    try {
      const targetItems = recurringExpenses.filter((re) => checkedMap[re.id]);
      
      if (targetItems.length === 0) {
        triggerToast('No templates selected');
        onClose();
        return;
      }

      for (const item of targetItems) {
        await onAddExpense({
          category: item.category,
          description: item.description,
          amount: item.amount,
          isRecurring: true, // Marking with true gives them the ↺ RECURRING badge
        });
      }

      triggerToast(`${selectedCount} recurring templates auto-filled`);
      onClose();
    } catch (err: any) {
      triggerToast(err.message || 'Error auto-filling items');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="recurring-prompt-card"
        className="w-full max-w-md bg-[#080807] border border-[#ffb020]/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#2d281f] pb-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#a29e96] uppercase font-bold">Ledger Ledger Engine</span>
            <h4 className="font-mono text-xl font-bold text-[#ffe099] uppercase">RECURRING CHARGES</h4>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-[#2d281f] hover:border-[#ffb020]/40 text-[#a29e96] hover:text-[#ffe099] rounded-xl transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content detail */}
        <div className="space-y-2">
          <p className="font-mono text-xs text-[#fcfaf2] uppercase tracking-wider">
            {recurringExpenses.length} templates configured for this cycle.
          </p>
          <p className="font-mono text-[11px] text-[#8c867a] uppercase tracking-wide leading-relaxed">
            Choose the monthly items to instantiate below. Ticked entries will be auto-calculated into this period.
          </p>
        </div>

        {/* Templates list */}
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {recurringExpenses.map((re) => {
            const isChecked = !!checkedMap[re.id];
            return (
              <div
                key={re.id}
                id={`modal-recurring-item-${re.id}`}
                onClick={() => toggleCheck(re.id)}
                className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer select-none ${
                  isChecked
                    ? 'bg-[#1c1a15]/40 border-[#ffb020]/30'
                    : 'bg-[#100f0d] border-[#221e17] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                      isChecked
                        ? 'bg-[#ffb020] border-[#ffb020] text-black'
                        : 'border-[#2d281f]'
                    }`}
                  >
                    {isChecked && <Check size={11} strokeWidth={3} />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#fcfaf2] block truncate">
                      {re.description}
                    </span>
                    <span className="text-[9px] font-mono text-[#8c867a] uppercase tracking-wider block">
                      {re.category}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-[#ffe099] flex-shrink-0">
                  {formatCurrency(re.amount)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Indicator */}
        <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest text-center">
          {selectedCount} OF {recurringExpenses.length} ITEMS SELECTED
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={handleAddRecurring}
            className="w-full bg-[#ffb020] hover:bg-[#ffe099] border border-[#ffb020] text-black rounded-xl py-4 text-xs uppercase font-mono tracking-widest font-bold transition cursor-pointer active:scale-95 disabled:opacity-40 shadow-lg"
          >
            {saving ? 'Auto-filling items...' : `Add ${selectedCount} Recurring Charges`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#27231c] hover:bg-[#342f26] border border-[#483c27] text-[#ffe099] rounded-xl py-3 text-xs uppercase font-mono tracking-widest font-bold transition cursor-pointer active:scale-95 text-center"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
