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
    throw new Error(errData.error || errData.message || 'Erreur réseau');
  }

  return response.json();
}

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
};
