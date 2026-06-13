export interface Expense {
  id: string;
  monthKey: string; // YYYY-MM
  category: string;
  description: string;
  amount: number;
  date: string; // "Jun 13"
  note: string;
  isRecurring: boolean;
  imported: boolean;
  createdAt: number; // millisecond timestamp
}

export interface Income {
  id: string;
  monthKey: string; // YYYY-MM
  description: string;
  amount: number;
  date: string;
  createdAt: number; // millisecond timestamp
}

export interface BudgetLimit {
  id: string; // category name or identifier
  category: string;
  limit: number;
  type: 'variable' | 'fixed';
  color: string;
}

export interface Settings {
  id: 'user-settings';
  theme: string;
  budgetCeiling: number;
  savingsTarget: number;
  defaultIncome: number;
}

export interface AuthResponse {
  token: string;
  uid: string;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  income: number;
  spent: number;
  net: number;
}

export interface CategoryBreakdown {
  category: string;
  spent: number;
  limit: number;
  color: string;
  type: 'variable' | 'fixed';
}

export interface YTDStats {
  ytdIncome: number;
  ytdSpent: number;
  ytdNet: number;
  realSpent: number;
  cardPayments: number;
  monthlySummaries: MonthlySummary[];
  categorySpendsByMonth: { [monthKey: string]: { [category: string]: number } };
  budgetLimits: BudgetLimit[];
}
