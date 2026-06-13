import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface ScannedItem {
  id: string; // Client side random ID for react keys
  description: string;
  amount: number;
  category: string;
  date: string;
  checked: boolean;
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: {
    category: string;
    description: string;
    amount: number;
    isRecurring: boolean;
    date?: string;
  }) => Promise<void>;
  triggerToast: (msg: string) => void;
}

const VALID_CATEGORIES = [
  'Groceries',
  'Food & Dining',
  'Dining Out',
  'Gas',
  'Auto',
  'Housing',
  'Personal Care',
  'Clothing',
  'Health & Fitness',
  'Shopping',
  'Bills & Utilities',
  'Subscriptions',
  'Tech',
  'Entertainment',
  'Cigars & Leisure',
  'Gifts',
  'Parking',
  'Home & Decor',
  'Business',
  'Education',
  'Vacation',
  'Taxes',
  'Card Payments',
  'Other',
];

export function ReceiptScannerModal({
  isOpen,
  onClose,
  onAddExpense,
  triggerToast,
}: ReceiptScannerModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [base64Data, setBase64Data] = useState<string>('');
  const [errorHeader, setErrorHeader] = useState<string>('');
  const [warnMsg, setWarnMsg] = useState<string>('');
  const [rawResponseText, setRawResponseText] = useState<string>('');

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [hasResults, setHasResults] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Clean state when closed or opened
  useEffect(() => {
    if (!isOpen) {
      setImageFile(null);
      setImagePreview(null);
      setMimeType('');
      setBase64Data('');
      setErrorHeader('');
      setWarnMsg('');
      setRawResponseText('');
      setAnalyzing(false);
      setItems([]);
      setHasResults(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle file input processing
  const processFile = (file: File) => {
    setWarnMsg('');
    setErrorHeader('');

    // Check size (exceeds 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setWarnMsg('IMAGE TOO LARGE — PLEASE USE A SMALLER FILE');
      return;
    }

    setImageFile(file);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      
      // Extract clean raw base64 data without prefix
      let rawBase64 = result;
      if (result.includes(';base64,')) {
        rawBase64 = result.split(';base64,')[1];
      }
      setBase64Data(rawBase64);
    };
    reader.onerror = () => {
      setWarnMsg('Failed to load image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Trigger analysis api call
  const handleAnalyze = async () => {
    if (!base64Data || !mimeType) return;
    setAnalyzing(true);
    setErrorHeader('');

    try {
      const response = await api.analyzeReceipt(base64Data, mimeType);
      if (response && response.items && Array.isArray(response.items)) {
        // Map elements to local items with react keys and pre-checked=true
        const parsedItems: ScannedItem[] = response.items.map((item: any, idx: number) => {
          // Normalize matching category to our exact valid list
          let itemCat = item.category || 'Other';
          const matched = VALID_CATEGORIES.find(
            (c) => c.toLowerCase() === itemCat.toLowerCase()
          );
          if (matched) {
            itemCat = matched;
          } else {
            itemCat = 'Other';
          }

          return {
            id: `scanned-item-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            description: item.description || 'Unknown Item',
            amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0,
            category: itemCat,
            date: item.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            checked: true,
          };
        });

        if (parsedItems.length === 0) {
          setErrorHeader('COULD NOT READ RECEIPT — PLEASE TRY A CLEARER IMAGE');
        } else {
          setItems(parsedItems);
          setHasResults(true);
        }
      } else {
        setErrorHeader('ANALYSIS FAILED — ADD ITEMS MANUALLY');
      }
    } catch (err: any) {
      console.error('Error analyzing receipt:', err);
      if (err.rawText) {
        setRawResponseText(err.rawText);
      }
      
      const specificError = err.message || String(err);
      setErrorHeader(specificError);
    } finally {
      setAnalyzing(false);
    }
  };

  // Select / Deselect actions
  const handleSelectAll = () => {
    setItems(items.map((i) => ({ ...i, checked: true })));
  };

  const handleDeselectAll = () => {
    setItems(items.map((i) => ({ ...i, checked: false })));
  };

  // Handle edit changes
  const handleItemFieldChange = (itemId: string, field: keyof ScannedItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Add Selected Elements action
  const handleAddSelected = async () => {
    const selected = items.filter((i) => i.checked);
    if (selected.length === 0) {
      triggerToast('No items checked');
      return;
    }

    try {
      for (const item of selected) {
        await onAddExpense({
          category: item.category,
          description: item.description,
          amount: item.amount,
          isRecurring: false,
          date: item.date,
        });
      }
      triggerToast(`${selected.length} items added from receipt`);
      onClose();
    } catch (err) {
      console.error('Failed adding selected expenses:', err);
      triggerToast('Error saving scanned entries');
    }
  };

  const selectedCount = items.filter((i) => i.checked).length;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 overflow-y-auto animate-fade-in text-[var(--text)] select-none font-mono"
      style={{ minHeight: '100vh', position: 'fixed' }}
      id="receipt-scanner-overlay"
    >
      <style>{`
        @keyframes scanAnimation {
          0% { top: 0%; transform: translateY(0); }
          50% { top: 100%; transform: translateY(-100%); }
          100% { top: 0%; transform: translateY(0); }
        }
        .animate-scanning-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(to right, transparent, var(--accent, #f59e0b), transparent);
          box-shadow: 0 0 10px var(--accent, #f59e0b), 0 0 20px var(--accent, #f59e0b);
          animation: scanAnimation 2.5s ease-in-out infinite;
          z-index: 20;
        }
      `}</style>

      {/* Hidden file selectors */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleCameraChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={uploadInputRef}
        onChange={handleUploadChange}
        accept="image/*"
        className="hidden"
      />

      {/* Modal Container */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between py-2">
        {/* Header Row */}
        <div className="flex justify-between items-center border-b border-[#2d281f] pb-4 mb-6">
          <h2 className="font-mono text-lg sm:text-xl font-bold tracking-[0.25em] text-[var(--bone)]">
            RECEIPT SCANNER
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#25231f] border border-[#3e3524] text-[#a29e96] hover:text-[var(--bone)] transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col justify-center">
          {errorHeader ? (
            <div className="text-center py-10 space-y-6 max-w-2xl mx-auto animate-fade-in" id="receipt-error-state">
              <div className="text-red-500 font-extrabold tracking-widest text-[11px] sm:text-xs leading-relaxed uppercase border border-red-500/20 bg-red-500/5 p-6 rounded-2xl whitespace-pre-line">
                {errorHeader}
              </div>

              {rawResponseText && (
                <div className="text-left space-y-2 w-full animate-fade-in" id="raw-gemini-response-container">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#a29e96] font-bold">
                    [RAW RESPONSE RETRIEVED FROM GEMINI]
                  </div>
                  <pre className="w-full bg-[#141310] border border-[#2d281f] rounded-xl p-4 text-[11px] font-mono text-[#8c867a] select-text overflow-x-auto whitespace-pre-wrap max-h-60 leading-relaxed scrollbar-thin">
                    {rawResponseText}
                  </pre>
                </div>
              )}
              
              {/* Reset view */}
              <button
                onClick={() => {
                  setErrorHeader('');
                  setRawResponseText('');
                  setImagePreview(null);
                  setImageFile(null);
                }}
                className="mx-auto bg-[#25231f] hover:bg-[#342e24] border border-[#3e3524] text-[var(--bone)] rounded-xl px-6 py-3.5 text-xs font-mono uppercase tracking-widest font-bold cursor-pointer transition active:scale-95"
              >
                Try Another Image
              </button>
            </div>
          ) : !imagePreview && !hasResults ? (
            /* Upload selectors */
            <div className="space-y-6 py-4 animate-fade-in" id="receipt-selectors-state">
              {warnMsg && (
                <div className="text-red-500 font-bold text-xs tracking-wider text-center bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">
                  {warnMsg}
                </div>
              )}

              {/* Grid selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Take Photo */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-gradient-to-b from-[#181715] to-[#0e0d0c] border border-[#2d281f] hover:border-[#483c27] flex flex-col items-center justify-center rounded-2xl p-8 h-[180px] shadow-lg transition-all duration-300 group cursor-pointer"
                >
                  <div className="p-3 bg-[#25231f] border border-[#3e3524] rounded-xl text-[var(--accent)] mb-4 group-hover:scale-110 transition duration-300">
                    <Camera size={26} />
                  </div>
                  <span className="text-xs font-mono tracking-widest font-bold text-[var(--bone)] group-hover:text-[var(--accent)] transition duration-300 uppercase">
                    📷 Take Photo
                  </span>
                </button>

                {/* Upload Image */}
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="bg-gradient-to-b from-[#181715] to-[#0e0d0c] border border-[#2d281f] hover:border-[#483c27] flex flex-col items-center justify-center rounded-2xl p-8 h-[180px] shadow-lg transition-all duration-300 group cursor-pointer"
                >
                  <div className="p-3 bg-[#25231f] border border-[#3e3524] rounded-xl text-[var(--accent)] mb-4 group-hover:scale-110 transition duration-300">
                    <Upload size={26} />
                  </div>
                  <span className="text-xs font-mono tracking-widest font-bold text-[var(--bone)] group-hover:text-[var(--accent)] transition duration-300 uppercase">
                    🖼 Upload Image
                  </span>
                </button>
              </div>

              {/* Drag and Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${
                  isDragOver ? 'border-[var(--accent)] bg-[#25231f]/20' : 'border-[#3a3326] bg-[#141310]/50'
                }`}
              >
                <span className="text-xs font-mono text-[#8c867a] tracking-[0.25em] font-extrabold uppercase">
                  DROP RECEIPT HERE
                </span>
              </div>
            </div>
          ) : !hasResults ? (
            /* Selected File Preview Mode */
            <div className="space-y-6 flex flex-col items-center py-4 animate-fade-in" id="receipt-preview-state">
              <div className="relative border border-[#2d281f] rounded-2xl overflow-hidden max-h-[45vh] bg-[#0c0c0b] shadow-2xl flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Receipt Preview"
                  className="max-h-[45vh] max-w-full object-contain select-none"
                />

                {/* Animated scanning line layer */}
                {analyzing && <div className="animate-scanning-line" />}
              </div>

              {analyzing ? (
                <div className="flex flex-col items-center gap-3 py-2 animate-pulse" id="receipt-analyzing-indicator">
                  <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
                  <span className="text-xs sm:text-sm font-bold tracking-[0.3em] text-[var(--accent)] font-mono uppercase">
                    ANALYZING WITH AI...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-2">
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="flex-1 bg-[#23211d] hover:bg-[#322d23] border border-[#3d3322] text-[#8c867a] rounded-xl py-4 text-xs font-mono uppercase tracking-widest font-bold cursor-pointer transition active:scale-95"
                  >
                    Clear Image
                  </button>
                  <button
                    onClick={handleAnalyze}
                    className="flex-1 bg-[var(--accent)] border border-[var(--accent)] text-[var(--bg)] rounded-xl py-4 text-xs font-mono uppercase tracking-widest font-black hover:bg-transparent hover:text-[var(--accent)] cursor-pointer transition active:scale-95 shadow-md"
                  >
                    Analyze Receipt
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Results Presentation Mode */
            <div className="space-y-6 animate-fade-in" id="receipt-results-state">
              {/* Select All Toggle controls */}
              <div className="flex justify-between items-center border-b border-[#2d281f] pb-3 text-xs" id="results-toggle-row">
                <span className="text-[#8c867a] font-mono tracking-wider">
                  IDENTIFIED {items.length} {items.length === 1 ? 'ENTRY' : 'ENTRIES'}
                </span>
                <div className="flex gap-4 font-bold font-mono">
                  <button
                    onClick={handleSelectAll}
                    className="text-[var(--accent)] hover:underline cursor-pointer uppercase tracking-wider text-[11px]"
                  >
                    Select All
                  </button>
                  <span className="text-[#383428]">|</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-[#8c867a] hover:underline cursor-pointer uppercase tracking-wider text-[11px]"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 pad-scroll" id="scanned-items-list-container">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-gradient-to-r from-[#141310] to-[#0c0c0b] border ${
                      item.checked ? 'border-[#3d3322]' : 'border-[#2d281f] opacity-60'
                    } rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-md transition`}
                  >
                    {/* Checkbox and Desc Column */}
                    <div className="flex items-center gap-3.5 w-full md:w-auto flex-1">
                      <label className="relative flex items-center justify-center p-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => handleItemFieldChange(item.id, 'checked', e.target.checked)}
                          className="w-5 h-5 accent-[var(--bone)] cursor-pointer rounded bg-[#1c1b18] border border-[#2d281f]"
                        />
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemFieldChange(item.id, 'description', e.target.value)}
                        className="w-full bg-[#1c1b18] border border-[#2d281f] focus:border-[var(--accent)] text-[var(--bone)] rounded-lg px-3 py-2 text-xs font-sans outline-none font-semibold shadow-inner"
                        placeholder="Item name"
                      />
                    </div>

                    {/* Category Column */}
                    <div className="w-full md:w-44">
                      <select
                        value={item.category}
                        onChange={(e) => handleItemFieldChange(item.id, 'category', e.target.value)}
                        className="w-full bg-[#1c1b18] border border-[#2d281f] focus:border-[var(--accent)] text-[var(--text2)] rounded-lg px-2 py-2 text-xs outline-none cursor-pointer"
                      >
                        {VALID_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} className="bg-[#141310]">
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Numeric and Date fields */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="flex items-center gap-1.5 bg-[#181715] border border-[#2d281f] rounded-lg px-2 w-28 h-9 shadow-inner">
                        <span className="text-xs text-[#8c867a] font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount === 0 ? '' : item.amount}
                          onChange={(e) =>
                            handleItemFieldChange(item.id, 'amount', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-transparent text-[var(--text)] text-xs text-right font-mono font-bold outline-none border-none py-1"
                        />
                      </div>
                      
                      {/* Date Text Box */}
                      <input
                        type="text"
                        value={item.date}
                        onChange={(e) => handleItemFieldChange(item.id, 'date', e.target.value)}
                        className="w-24 bg-[#1c1b18] border border-[#2d281f] focus:border-[var(--accent)] text-xs text-center font-mono py-2 rounded-lg text-[#8c867a] outline-none shadow-inner"
                        placeholder="Date"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setItems([]);
                    setHasResults(false);
                  }}
                  className="w-full sm:w-1/3 bg-[#23211d] hover:bg-[#322d23] border border-[#3d3322] text-[#8c867a] rounded-xl py-3.5 text-xs font-mono uppercase tracking-widest font-bold cursor-pointer transition active:scale-95"
                >
                  Rescan Receipt
                </button>
                <button
                  onClick={handleAddSelected}
                  className="w-full sm:w-2/3 bg-[var(--accent)] border border-[var(--accent)] text-[var(--bg)] rounded-xl py-3.5 text-xs font-mono uppercase tracking-widest font-bold cursor-pointer transition active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <Check size={14} className="text-[var(--bg)]" />
                  ADD SELECTED ITEMS ({selectedCount})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceiptScannerModal;
