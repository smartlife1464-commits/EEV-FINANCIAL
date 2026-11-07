const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('eev_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new ApiError(response.status, errorData.error || errorData.message || 'Une erreur est survenue', errorData);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<{ user: any }>('/auth/me'),
  getUsers: () => request<any[]>('/users'),
  createUser: (data: any) =>
    request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboardOverview: () => request<any>('/dashboard/overview'),
  getAttendanceDashboard: () => request<any>('/dashboard/attendance'),
  getFinanceDashboard: () => request<any>('/dashboard/finance'),

  // Services & Attendance
  getServices: () => request<any[]>('/services'),
  getServiceTypes: () => request<any[]>('/service-types'),
  createService: (data: any) =>
    request<any>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAttendance: () => request<any[]>('/attendance'),
  createAttendance: (data: any) =>
    request<any>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createStructuredAttendance: (data: any) =>
    request<any>('/attendance/structured', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAttendance: (id: string, data: any) =>
    request<any>(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Finance
  getTreasuryOverview: () => request<any>('/finance/overview'),
  getFunds: () => request<any[]>('/finance/funds'),
  getCategories: () => request<any[]>('/finance/categories'),
  getExpenseCategories: () => request<any[]>('/finance/expense-categories'),
  getEntries: () => request<any[]>('/finance/entries'),
  createEntry: (data: any) =>
    request<any>('/finance/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getExpenses: () => request<any[]>('/finance/expenses'),
  createExpense: (data: any) =>
    request<any>('/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveExpense: (id: string, decision: 'approve' | 'reject', reason?: string) =>
    request<any>(`/finance/expenses/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    }),
  payExpense: (id: string, paymentMethod: string, paymentReference?: string) =>
    request<any>(`/finance/expenses/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, paymentReference }),
    }),
  createTransfer: (data: any) =>
    request<any>('/finance/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTransactions: () => request<any[]>('/finance/transactions'),

  // Reports & Audit
  getReportsSummary: (period: string = 'monthly') => request<any>(`/reports/summary?period=${period}`),
  getAuditLogs: () => request<any[]>('/audit-logs'),

  // Cash Closings & Reconciliation (Procès-Verbal de Caisse)
  getCashClosings: () => request<any[]>('/finance/cash-closings'),
  createCashClosing: (data: any) =>
    request<any>('/finance/cash-closings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Charges Fixes Récurrentes & Moteur de Prévision
  getFixedExpenses: () => request<any[]>('/finance/fixed-expenses'),
  createFixedExpense: (data: any) =>
    request<any>('/finance/fixed-expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFixedExpense: (id: string, data: any) =>
    request<any>(`/finance/fixed-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleFixedExpenseStatus: (id: string) =>
    request<any>(`/finance/fixed-expenses/${id}/toggle-status`, {
      method: 'POST',
    }),
  getFixedExpenseOccurrences: () => request<any[]>('/finance/fixed-expenses/occurrences'),
  generateFixedExpenseOccurrences: () =>
    request<any>('/finance/fixed-expenses/generate-occurrences', {
      method: 'POST',
    }),
  submitFixedExpenseOccurrencePayment: (id: string) =>
    request<any>(`/finance/fixed-expenses/occurrences/${id}/submit-payment`, {
      method: 'POST',
    }),
  approveFixedExpenseOccurrence: (id: string, decision: 'approve' | 'reject', reason?: string) =>
    request<any>(`/finance/fixed-expenses/occurrences/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    }),
  payFixedExpenseOccurrence: (id: string, paymentMethod: string, paymentReference?: string) =>
    request<any>(`/finance/fixed-expenses/occurrences/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, paymentReference }),
    }),
  getFixedExpensesSummary: () => request<any>('/finance/fixed-expenses/summary'),

  // Budgets Dépenses Variables
  getExpenseBudgets: () => request<any[]>('/finance/budgets'),
  createExpenseBudget: (data: any) =>
    request<any>('/finance/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Projections Intelligentes de Trésorerie
  getCashProjections: () => request<any>('/finance/cash-projections'),

  // Analytics & Statistics Module
  getAnalyticsOverview: (period: string = 'this_month', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ period });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return request<any>(`/analytics/overview?${params.toString()}`);
  },
  getAttendanceAnalytics: (period: string = 'this_month', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ period });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return request<any>(`/analytics/attendance?${params.toString()}`);
  },
  getAttendanceTrends: (granularity: string = 'week') =>
    request<any[]>(`/analytics/attendance/trends?granularity=${granularity}`),
  getFinancialAnalytics: (period: string = 'this_month', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ period });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return request<any>(`/analytics/finance?${params.toString()}`);
  },
};

