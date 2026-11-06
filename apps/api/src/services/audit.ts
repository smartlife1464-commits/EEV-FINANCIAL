import { pb, ensureAdminAuth } from './pocketbase.js';
import { AuditAction } from '@eev/shared-types';

export interface AuditLogPayload {
  userId: string;
  action: AuditAction | string;
  collectionName: string;
  recordId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(payload: AuditLogPayload): Promise<void> {
  try {
    await ensureAdminAuth();
    await pb.collection('audit_logs').create({
      user: payload.userId,
      action: payload.action,
      collection_name: payload.collectionName,
      record_id: payload.recordId,
      old_values: payload.oldValues || null,
      new_values: payload.newValues || null,
      reason: payload.reason || '',
      ip_address: payload.ipAddress || '',
      user_agent: payload.userAgent || '',
    });
  } catch (err: any) {
    // Audit logs must never crash the primary business transaction, but should log error
    console.error('❌ Failed to record audit log:', err?.message || err);
  }
}

