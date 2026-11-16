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
    // Session expirée ou compte désactivé : retour à l'écran de connexion
    if ((response.status === 401 || (response.status === 403 && /désactivé/i.test(String(errorData.error || '')))) && token && !endpoint.startsWith('/auth/login')) {
      localStorage.removeItem('eev_token');
      localStorage.removeItem('eev_user');
      window.dispatchEvent(new Event('eev:session-expired'));
    }
    throw new ApiError(response.status, formatApiError(errorData), errorData);
  }

  return response.json();
}

/** Transforme une erreur Zod formatée ({ field: { _errors: [...] } }) en message lisible */
export function formatApiError(data: any): string {
  const err = data?.error ?? data?.message;
  if (!err) return 'Une erreur est survenue';
  if (typeof err === 'string') return err;
  const messages: string[] = [];
  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node._errors)) messages.push(...node._errors);
    for (const [k, v] of Object.entries(node)) if (k !== '_errors') walk(v);
  };
  walk(err);
  return messages.length ? Array.from(new Set(messages)).join(' • ') : 'Données invalides';
}

/** Construit la chaîne de requête de période (globale ou personnalisée) */
export function periodQuery(period?: string, startDate?: string, endDate?: string): string {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  if (period === 'custom' && startDate && endDate) {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

/**
 * Téléchargement authentifié d'un fichier (CSV…).
 * Remplace window.open(), qui n'envoyait pas le jeton et renvoyait systématiquement une erreur 401.
 */
export async function downloadFile(endpoint: string, fallbackName: string): Promise<void> {
  const token = localStorage.getItem('eev_token');
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    let data: any = {};
    try {
      data = await response.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(response.status, formatApiError(data) || 'Téléchargement impossible', data);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = match?.[1] || fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<{ user: any }>('/auth/me'),
  requestPasswordReset: (email: string) =>
    request<{ success: boolean; message: string; devOtp?: string }>('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyOtp: (email: string, otp: string) =>
    request<{ success: boolean; message: string; resetToken: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),
  resetPassword: (data: { email: string; resetToken: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getUsers: () => request<any[]>('/users'),
  createUser: (data: any) =>
    request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUserStatus: (id: string, isActive: boolean) =>
    request<any>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    }),

  // Dashboard (filtrés par la période globale de l'en-tête)
  getDashboardOverview: (period?: string, startDate?: string, endDate?: string) =>
    request<any>(`/dashboard/overview${periodQuery(period, startDate, endDate)}`),
  getAttendanceDashboard: (period?: string, startDate?: string, endDate?: string) =>
    request<any>(`/dashboard/attendance${periodQuery(period, startDate, endDate)}`),
  getFinanceDashboard: (period?: string, startDate?: string, endDate?: string) =>
    request<any>(`/dashboard/finance${periodQuery(period, startDate, endDate)}`),

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
  validateAttendance: (id: string, decision: 'validate' | 'reject', reason?: string) =>
    request<any>(`/attendance/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
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

  // Paramètres institutionnels & état du système
  getSettings: () => request<any>('/settings'),
  updateSettings: (data: any) =>
    request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getSystemStatus: () => request<any>('/system/status'),
  createBackup: () => request<any>('/system/backup', { method: 'POST' }),

  // Notifications calculées en temps réel selon le rôle
  getNotifications: () => request<any[]>('/notifications'),

  // Reports & Audit
  getReportsSummary: (period: string = 'this_month', startDate?: string, endDate?: string) =>
    request<any>(`/reports/summary${periodQuery(period, startDate, endDate)}`),

  // Exports CSV authentifiés
  exportReportCsv: (period?: string, startDate?: string, endDate?: string) =>
    downloadFile(`/reports/export/csv${periodQuery(period, startDate, endDate)}`, 'rapport-esprit-vie.csv'),
  exportLedgerCsv: () => downloadFile('/reports/export/ledger-csv', 'grand-livre-esprit-vie.csv'),
  exportAnalyticsCsv: (type: 'attendance' | 'finance', period?: string, startDate?: string, endDate?: string) => {
    const q = periodQuery(period, startDate, endDate);
    return downloadFile(
      `/analytics/export/csv${q ? `${q}&` : '?'}type=${type}`,
      type === 'finance' ? 'statistiques-financieres-eev.csv' : 'statistiques-frequentation-eev.csv'
    );
  },
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

