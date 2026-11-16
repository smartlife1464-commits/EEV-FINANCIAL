import { FastifyInstance } from 'fastify';
import { authenticateRequest, requirePermission } from '../middleware/auth.js';
import { pb, ensureAdminAuth } from '../services/pocketbase.js';
import { AnalyticsService, toCsv } from '../services/analytics.service.js';
import { isProtocolRole, normalizePeriod, sendCsv, sendServiceError } from '../utils/http.js';

type PeriodQuery = { period?: string; startDate?: string; endDate?: string };

export async function reportRoutes(app: FastifyInstance) {
  // Rapport périodique consolidé (le Protocole ne reçoit que la fréquentation)
  app.get('/api/reports/summary', { preHandler: authenticateRequest }, async (request, reply) => {
    const { period, startDate, endDate } = request.query as PeriodQuery;
    try {
      const includeFinance = !isProtocolRole(request.user?.role);
      const summary = await AnalyticsService.getReportSummary(normalizePeriod(period), startDate, endDate, includeFinance);
      return reply.send(summary);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de générer le rapport.');
    }
  });

  // Export CSV (finances pour les rôles financiers, fréquentation pour le Protocole)
  app.get('/api/reports/export/csv', { preHandler: requirePermission('canExportReports') }, async (request, reply) => {
    const { period, startDate, endDate } = request.query as PeriodQuery;
    const p = period ? normalizePeriod(period) : undefined;
    try {
      if (isProtocolRole(request.user?.role)) {
        return sendCsv(reply, 'rapport-frequentation-esprit-vie.csv', await AnalyticsService.buildAttendanceCsv(p, startDate, endDate));
      }
      return sendCsv(reply, 'rapport-financier-esprit-vie.csv', await AnalyticsService.buildFinanceCsv(p, startDate, endDate));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de générer l’export CSV.');
    }
  });

  // Export CSV du grand livre (journal immuable des mouvements de fonds)
  app.get('/api/reports/export/ledger-csv', { preHandler: requirePermission('canExportReports') }, async (request, reply) => {
    if (isProtocolRole(request.user?.role)) {
      return reply.status(403).send({ error: 'Accès interdit aux données financières.' });
    }
    try {
      await ensureAdminAuth();
      const list = await pb.collection('fund_transactions').getFullList({ sort: '-created', expand: 'fund_account' });
      const csv = toCsv(
        ['Numero', 'Date', 'Compartiment', 'Type', 'Sens', 'Montant_FCFA', 'Solde_Apres_FCFA', 'Libelle'],
        list.map((t: any) => [
          t.transaction_number,
          String(t.created || '').slice(0, 19),
          t.expand?.fund_account?.name || '',
          t.type,
          t.direction === 'credit' ? 'Crédit' : 'Débit',
          t.amount,
          t.balance_after,
          t.description,
        ])
      );
      return sendCsv(reply, 'grand-livre-esprit-vie.csv', csv);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible d’exporter le grand livre.');
    }
  });

  // Piste d'audit (Audit Logs) — lecture seule
  app.get('/api/audit-logs', { preHandler: requirePermission('canViewAuditLogs') }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const logs = await pb.collection('audit_logs').getList(1, 500, {
        sort: '-created',
        expand: 'user',
        filter: "action != ''",
      });
      return reply.send(
        logs.items.map((l: any) => ({
          ...l,
          user: l.expand?.user
            ? { id: l.expand.user.id, name: l.expand.user.name || l.expand.user.email, email: l.expand.user.email, role: l.expand.user.role }
            : { name: 'Système' },
        }))
      );
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de charger la piste d’audit.');
    }
  });
}
