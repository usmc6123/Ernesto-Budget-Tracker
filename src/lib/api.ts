const TOKEN_KEY = 'reyes_budget_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session token expired or invalid
    removeToken();
    window.dispatchEvent(new Event('auth-expired'));
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = 'Operation failed';
    let data: any = {};
    try {
      data = JSON.parse(errText);
      errMsg = data.error || errMsg;
    } catch {
      errMsg = errText || errMsg;
    }
    const err: any = new Error(errMsg);
    if (data.rawText) err.rawText = data.rawText;
    if (data.details) err.details = data.details;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  async login(password: string) {
    const data = await apiFetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    if (data && data.token) {
      setToken(data.token);
    }
    return data;
  },

  async getExpenses(monthKey: string) {
    return apiFetch(`/api/expenses?month=${monthKey}`);
  },

  async createExpense(expense: {
    monthKey: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    note?: string;
    isRecurring?: boolean;
    imported?: boolean;
  }) {
    return apiFetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },

  async updateExpense(id: string, updates: {
    category?: string;
    description?: string;
    amount?: number;
    date?: string;
    note?: string;
    isRecurring?: boolean;
  }) {
    return apiFetch(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteExpense(id: string) {
    return apiFetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  async getIncome(monthKey: string) {
    return apiFetch(`/api/income?month=${monthKey}`);
  },

  async createIncome(income: {
    monthKey: string;
    description: string;
    amount: number;
    date: string;
  }) {
    return apiFetch('/api/income', {
      method: 'POST',
      body: JSON.stringify(income),
    });
  },

  async deleteIncome(id: string) {
    return apiFetch(`/api/income/${id}`, {
      method: 'DELETE',
    });
  },

  async getStats() {
    return apiFetch('/api/stats');
  },

  async getSettings() {
    return apiFetch('/api/settings');
  },

  async updateSettings(settings: {
    theme?: string;
    budgetCeiling?: number;
    savingsTarget?: number;
    defaultIncome?: number;
  }) {
    return apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async getBudgetLimits() {
    return apiFetch('/api/budget-limits');
  },

  async updateBudgetLimit(id: string, limit: number) {
    return apiFetch('/api/budget-limits', {
      method: 'PUT',
      body: JSON.stringify({ id, limit }),
    });
  },

  async analyzeReceipt(imageData: string, mimeType: string) {
    return apiFetch('/api/analyze-receipt', {
      method: 'POST',
      body: JSON.stringify({ imageData, mimeType }),
    });
  },
};
