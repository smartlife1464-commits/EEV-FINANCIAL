import { MobileStorage } from './storage';
import { mobileApi } from './api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ATTENDANCE_QUEUE_KEY = 'eev_offline_attendance_queue';
const ENTRY_QUEUE_KEY = 'eev_offline_entry_queue';
const EXPENSE_QUEUE_KEY = 'eev_offline_expense_queue';

export interface QueuedItem {
  id: string;
  data: any;
  queuedAt: string;
}

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export const OfflineSyncService = {
  // --- FICHES DE PRÉSENCE ---
  async queueAttendance(data: any): Promise<QueuedItem> {
    const queue = await this.getQueuedAttendances();
    const item: QueuedItem = {
      id: `queue-att-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      data,
      queuedAt: new Date().toISOString(),
    };
    queue.push(item);
    await setStorageItem(ATTENDANCE_QUEUE_KEY, JSON.stringify(queue));
    return item;
  },

  async getQueuedAttendances(): Promise<QueuedItem[]> {
    try {
      const raw = await getStorageItem(ATTENDANCE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // --- RECETTES ---
  async queueEntry(data: any): Promise<QueuedItem> {
    const queue = await this.getQueuedEntries();
    const item: QueuedItem = {
      id: `queue-ent-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      data,
      queuedAt: new Date().toISOString(),
    };
    queue.push(item);
    await setStorageItem(ENTRY_QUEUE_KEY, JSON.stringify(queue));
    return item;
  },

  async getQueuedEntries(): Promise<QueuedItem[]> {
    try {
      const raw = await getStorageItem(ENTRY_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // --- DÉPENSES ---
  async queueExpense(data: any): Promise<QueuedItem> {
    const queue = await this.getQueuedExpenses();
    const item: QueuedItem = {
      id: `queue-exp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      data,
      queuedAt: new Date().toISOString(),
    };
    queue.push(item);
    await setStorageItem(EXPENSE_QUEUE_KEY, JSON.stringify(queue));
    return item;
  },

  async getQueuedExpenses(): Promise<QueuedItem[]> {
    try {
      const raw = await getStorageItem(EXPENSE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // --- SYNCHRONISATION GLOBALE ---
  async syncAll(): Promise<{
    syncedAttendances: number;
    syncedEntries: number;
    syncedExpenses: number;
    errors: any[];
  }> {
    const result = {
      syncedAttendances: 0,
      syncedEntries: 0,
      syncedExpenses: 0,
      errors: [] as any[],
    };

    // 1. Sync attendances
    const attendances = await this.getQueuedAttendances();
    const remainingAttendances: QueuedItem[] = [];
    for (const item of attendances) {
      try {
        // Les fiches mobiles utilisent le format structuré (programme + date), pas l'ancien format par culte
        await mobileApi.createStructuredAttendance(item.data);
        result.syncedAttendances++;
      } catch (err: any) {
        remainingAttendances.push(item);
        result.errors.push({ type: 'attendance', id: item.id, error: err.message });
      }
    }
    await setStorageItem(ATTENDANCE_QUEUE_KEY, JSON.stringify(remainingAttendances));

    // 2. Sync entries
    const entries = await this.getQueuedEntries();
    const remainingEntries: QueuedItem[] = [];
    for (const item of entries) {
      try {
        const data = { ...item.data };
        // Résolution différée de la catégorie (saisie hors-ligne sans référentiel chargé)
        if (!data.categoryId && data.categoryCode) {
          const categories = await mobileApi.getCategories();
          data.categoryId = categories.find((c: any) => c.code === data.categoryCode)?.id;
          delete data.categoryCode;
        }
        await mobileApi.createEntry(data);
        result.syncedEntries++;
      } catch (err: any) {
        remainingEntries.push(item);
        result.errors.push({ type: 'entry', id: item.id, error: err.message });
      }
    }
    await setStorageItem(ENTRY_QUEUE_KEY, JSON.stringify(remainingEntries));

    // 3. Sync expenses
    const expenses = await this.getQueuedExpenses();
    const remainingExpenses: QueuedItem[] = [];
    for (const item of expenses) {
      try {
        await mobileApi.createExpense(item.data);
        result.syncedExpenses++;
      } catch (err: any) {
        remainingExpenses.push(item);
        result.errors.push({ type: 'expense', id: item.id, error: err.message });
      }
    }
    await setStorageItem(EXPENSE_QUEUE_KEY, JSON.stringify(remainingExpenses));

    return result;
  },

  async getPendingCount(): Promise<number> {
    const a = await this.getQueuedAttendances();
    const n = await this.getQueuedEntries();
    const e = await this.getQueuedExpenses();
    return a.length + n.length + e.length;
  },
};
