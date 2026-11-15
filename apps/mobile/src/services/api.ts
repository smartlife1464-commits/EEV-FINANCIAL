import { MobileStorage } from './storage';
import { Platform } from 'react-native';

// For local testing on emulator / phone :
// Android emulator uses 10.0.2.2, iOS simulator uses localhost, physical phone uses host IP
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
export const API_BASE_URL = `${DEFAULT_HOST}/api`;

export async function mobileRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await MobileStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errData: any = {};
    try {
      errData = await response.json();
    } catch {
      errData = { message: response.statusText };
    }
    const message = typeof errData.error === 'string' ? errData.error : errData.message || 'Erreur serveur';
    // Erreur métier (400/403/409…) : NE PAS mettre en file hors-ligne, elle échouerait indéfiniment
    throw Object.assign(new Error(message), { status: response.status });
  }

  return response.json();
}

/** Vrai si l'erreur provient d'une absence de réseau (et non d'un refus du serveur) */
export const isNetworkError = (err: any): boolean => !err || err.status === undefined;

export const mobileApi = {
  login: (credentials: { email: string; password: string }) =>
    mobileRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getDashboardOverview: () => mobileRequest<any>('/dashboard/overview'),
  getAttendance: () => mobileRequest<any[]>('/attendance'),
  createAttendance: (data: any) =>
    mobileRequest<any>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getExpenses: () => mobileRequest<any[]>('/finance/expenses'),
  createEntry: (data: any) =>
    mobileRequest<any>('/finance/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createExpense: (data: any) =>
    mobileRequest<any>('/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveExpense: (id: string, decision: 'approve' | 'reject', reason?: string) =>
    mobileRequest<any>(`/finance/expenses/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    }),
  getServiceTypes: () => mobileRequest<any[]>('/service-types'),
  getCategories: () => mobileRequest<any[]>('/finance/categories'),
  createStructuredAttendance: (data: any) =>
    mobileRequest<any>('/attendance/structured', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getFixedExpenses: () => mobileRequest<any[]>('/finance/fixed-expenses'),
  getFixedOccurrences: () => mobileRequest<any[]>('/finance/fixed-expenses/occurrences'),
  payFixedExpenseOccurrence: (id: string, paymentMethod: string, paymentReference?: string) =>
    mobileRequest<any>(`/finance/fixed-expenses/occurrences/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, paymentReference }),
    }),
  approveFixedExpenseOccurrence: (id: string, decision: 'approve' | 'reject', reason?: string) =>
    mobileRequest<any>(`/finance/fixed-expenses/occurrences/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    }),
};

