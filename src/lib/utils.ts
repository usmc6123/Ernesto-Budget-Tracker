export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}$${formatted}`;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_KEYS = MONTHS.map((_, i) => `2026-${String(i + 1).padStart(2, '0')}`);

export const CAT_COLORS: { [key: string]: string } = {
  "Groceries": "#8db88e",
  "Food & Dining": "#c8a97e",
  "Dining Out": "#e8c07a",
  "Gas": "#7aace8",
  "Auto": "#e87a7a",
  "Housing": "#d4b483",
  "Personal Care": "#e89b7a",
  "Wellness & Grooming": "#e8c09a",
  "Clothing": "#c87aaa",
  "Accessories": "#c8a97e",
  "Shopping": "#c87aaa",
  "Bills & Utilities": "#8ab8d4",
  "Health & Fitness": "#7ac8a9",
  "Subscriptions": "#a8b8c8",
  "Tech": "#c8c87a",
  "Entertainment": "#b8c87a",
  "Cigars & Leisure": "#c8a87a",
  "Gifts": "#c87ab8",
  "Parking": "#9b8ec8",
  "Home & Decor": "#d4c483",
  "Business": "#a0a0a0",
  "Education": "#7ac8a9",
  "Vacation": "#9b8ec8",
  "Taxes": "#e87a7a",
  "Card Payments": "#888888",
  "Other": "#888888"
};

// Determines if a given month index is historical (Jan-May 2026, indices 0-4)
export function isHistoricalMonth(monthIndex: number): boolean {
  return monthIndex < 5;
}

export function getMonthKey(monthIndex: number): string {
  return `2026-${String(monthIndex + 1).padStart(2, '0')}`;
}
