import PocketBase from 'pocketbase';
import { config } from '../config.js';

export const pb = new PocketBase(config.pocketbaseUrl);

// Auto-cancellation disable for server-side concurrent requests
pb.autoCancellation(false);

let adminAuthPromise: Promise<void> | null = null;

export async function ensureAdminAuth(): Promise<void> {
  if (pb.authStore.isValid && pb.authStore.isSuperuser) {
    return;
  }

  if (adminAuthPromise) {
    return adminAuthPromise;
  }

  adminAuthPromise = (async () => {
    try {
      // In PocketBase v0.23+ superusers authenticate through collection '_superusers' or admins.authWithPassword
      if (typeof (pb as any).collection === 'function') {
        try {
          await pb.collection('_superusers').authWithPassword(config.pbAdminEmail, config.pbAdminPassword);
        } catch {
          await pb.admins.authWithPassword(config.pbAdminEmail, config.pbAdminPassword);
        }
      } else {
        await pb.admins.authWithPassword(config.pbAdminEmail, config.pbAdminPassword);
      }
    } catch (err: any) {
      // In development, if PB is starting or credentials not yet seeded, continue with warning
      console.warn('⚠️ PB Superuser auth not available yet:', err?.message || err);
    } finally {
      adminAuthPromise = null;
    }
  })();

  return adminAuthPromise;
}
