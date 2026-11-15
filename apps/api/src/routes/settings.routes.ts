import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserRole } from '@eev/shared-types';
import { authenticateRequest, requireRoles } from '../middleware/auth.js';
import { pb, ensureAdminAuth } from '../services/pocketbase.js';
import { createAuditLog } from '../services/audit.js';
import { config } from '../config.js';
import { sendServiceError } from '../utils/http.js';

export const ministrySettingsSchema = z.object({
  name: z.string().min(2, 'Le nom officiel est requis').max(120),
  headquarters: z.string().max(160).default(''),
  postalBox: z.string().max(60).default(''),
  phone: z.string().max(60).default(''),
  email: z.string().email('Adresse email invalide').or(z.literal('')).default(''),
  website: z.string().max(120).default(''),
  mainPastor: z.string().max(120).default(''),
  venueCapacity: z.number().int().min(0).max(100000).default(0),
});

export type MinistrySettings = z.infer<typeof ministrySettingsSchema>;

const DEFAULTS: MinistrySettings = {
  name: 'Ministère Esprit & Vie',
  headquarters: '',
  postalBox: '',
  phone: '',
  email: '',
  website: '',
  mainPastor: '',
  venueCapacity: 0,
};

/** Lecture des paramètres institutionnels (avec valeurs par défaut si la collection est absente) */
export async function getMinistrySettings(): Promise<MinistrySettings> {
  await ensureAdminAuth();
  try {
    const rec = await pb.collection('app_settings').getFirstListItem(`key = "ministry"`);
    return { ...DEFAULTS, ...(rec.value || {}) };
  } catch {
    return { ...DEFAULTS, venueCapacity: config.venueCapacity };
  }
}

export async function settingsRoutes(app: FastifyInstance) {
  // Identité du ministère (utilisée par les documents officiels : reçus, bons, PV, rapports)
  app.get('/api/settings', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      return reply.send(await getMinistrySettings());
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de charger les paramètres.');
    }
  });

  app.put('/api/settings', { preHandler: requireRoles([UserRole.ADMIN, UserRole.LEAD_PASTOR]) }, async (request, reply) => {
    const parsed = ministrySettingsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    try {
      await ensureAdminAuth();
      const previous = await getMinistrySettings();
      const existing = await pb.collection('app_settings').getFirstListItem(`key = "ministry"`).catch(() => null);
      if (existing) {
        await pb.collection('app_settings').update(existing.id, { value: parsed.data });
      } else {
        await pb.collection('app_settings').create({ key: 'ministry', value: parsed.data });
      }
      await createAuditLog({
        userId: request.user!.id,
        action: 'update_settings',
        collectionName: 'app_settings',
        recordId: existing?.id || 'ministry',
        oldValues: previous as unknown as Record<string, unknown>,
        newValues: parsed.data as unknown as Record<string, unknown>,
      });
      return reply.send(parsed.data);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible d’enregistrer les paramètres.');
    }
  });

  // État réel du système (remplace les indicateurs « Opérationnel » codés en dur)
  app.get('/api/system/status', { preHandler: requireRoles([UserRole.ADMIN, UserRole.LEAD_PASTOR, UserRole.AUDITOR]) }, async (request, reply) => {
    const started = Date.now();
    let pocketbase: { ok: boolean; latencyMs?: number; message?: string } = { ok: false };
    try {
      const health = await pb.health.check();
      pocketbase = { ok: health.code === 200, latencyMs: Date.now() - started, message: health.message };
    } catch (err: any) {
      pocketbase = { ok: false, message: err?.message || 'Injoignable' };
    }

    let backups: { key: string; size: number; modified: string }[] = [];
    let counts: Record<string, number> = {};
    if (pocketbase.ok) {
      try {
        await ensureAdminAuth();
        backups = (await pb.backups.getFullList()).sort((a, b) => b.modified.localeCompare(a.modified)).slice(0, 5);
      } catch {
        backups = [];
      }
      for (const name of ['users', 'financial_entries', 'expenses', 'attendance_sheets', 'fund_transactions', 'audit_logs']) {
        try {
          counts[name] = (await pb.collection(name).getList(1, 1)).totalItems;
        } catch {
          counts[name] = 0;
        }
      }
    }

    return reply.send({
      api: { ok: true, version: '1.1.0', node: process.version, env: config.nodeEnv, uptimeSeconds: Math.round(process.uptime()) },
      pocketbase,
      backups,
      counts,
      checkedAt: new Date().toISOString(),
    });
  });

  // Déclenchement d'une sauvegarde PocketBase à la demande (Admin)
  app.post('/api/system/backup', { preHandler: requireRoles([UserRole.ADMIN, UserRole.LEAD_PASTOR]) }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const name = `eev_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.zip`;
      await pb.backups.create(name);
      await createAuditLog({
        userId: request.user!.id,
        action: 'create_backup',
        collectionName: 'system',
        recordId: name,
      });
      return reply.status(201).send({ key: name });
    } catch (err) {
      return sendServiceError(reply, err, 'La sauvegarde a échoué.');
    }
  });
}
