import { FastifyReply } from 'fastify';
import { UserRole } from '@eev/shared-types';
import type { PeriodKey } from '../services/analytics.service.js';

export function isProtocolRole(role?: string): boolean {
  return role === UserRole.PROTOCOL_LEAD || role === UserRole.PROTOCOL_AGENT;
}

/**
 * Réponse d'erreur uniforme. Remplace les anciens « replis » silencieux sur des données fictives :
 * l'utilisateur voit désormais une erreur claire au lieu de chiffres inventés.
 */
export function sendServiceError(reply: FastifyReply, err: unknown, fallbackMessage: string) {
  const e = err as { status?: number; message?: string; response?: { message?: string } };
  const status = e?.status && e.status >= 400 && e.status < 500 ? e.status : e?.status === 0 ? 503 : 500;
  const message =
    status === 503
      ? 'Base de données indisponible : vérifiez que PocketBase est démarré.'
      : e?.response?.message || e?.message || fallbackMessage;
  reply.log.error({ err }, fallbackMessage);
  return reply.status(status).send({ error: status === 404 ? 'Enregistrement introuvable.' : message });
}

/** Convertit les anciennes valeurs de période (monthly, quarterly…) vers les clés analytiques */
export function normalizePeriod(period?: string): PeriodKey {
  const legacy: Record<string, PeriodKey> = {
    weekly: 'this_week',
    monthly: 'this_month',
    quarterly: 'this_quarter',
    semester: 'this_semester',
    yearly: 'this_year',
    annual: 'this_year',
  };
  if (!period) return 'this_month';
  return legacy[period] || (period as PeriodKey);
}

/** Échappe une valeur insérée dans un filtre PocketBase */
export function pbString(value: string): string {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function sendCsv(reply: FastifyReply, filename: string, content: string) {
  reply.header('Content-Type', 'text/csv; charset=utf-8');
  reply.header('Content-Disposition', `attachment; filename="${filename}"`);
  return reply.send(content);
}

/**
 * Expose les relations développées (`expand`) directement sur l'enregistrement :
 * `entry.category` devient l'objet catégorie ({ id, name, code… }) au lieu de son seul identifiant.
 * Le bloc `expand` d'origine est conservé pour compatibilité.
 */
export function withRelations<T extends Record<string, any>>(record: T): T {
  if (!record || typeof record !== 'object' || !record.expand) return record;
  const out: Record<string, any> = { ...record };
  for (const [key, value] of Object.entries(record.expand)) {
    if (value && typeof value === 'object') out[key] = value;
  }
  return out as T;
}

export const withRelationsList = <T extends Record<string, any>>(list: T[]): T[] => list.map(withRelations);
