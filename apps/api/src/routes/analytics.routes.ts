import { FastifyInstance } from 'fastify';
import { authenticateRequest, requireRoles } from '../middleware/auth.js';
import { AnalyticsService, PeriodKey } from '../services/analytics.service.js';
import { UserRole } from '@eev/shared-types';
import { isProtocolRole, normalizePeriod, sendCsv, sendServiceError } from '../utils/http.js';

type PeriodQuery = { period?: PeriodKey; startDate?: string; endDate?: string };

export async function analyticsRoutes(app: FastifyInstance) {
  // 1. Synthèse globale KPI Fréquentation + Finances avec variations
  app.get('/api/analytics/overview', { preHandler: authenticateRequest }, async (request, reply) => {
    const { period = 'this_month', startDate, endDate } = request.query as PeriodQuery;
    try {
      // Séparation stricte : aucune donnée financière n'est calculée ni exposée au Protocole
      const includeFinance = !isProtocolRole(request.user?.role);
      return reply.send(await AnalyticsService.getOverview(period, startDate, endDate, includeFinance));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de calculer la synthèse analytique.');
    }
  });

  // 2. Statistiques détaillées de fréquentation
  app.get('/api/analytics/attendance', { preHandler: authenticateRequest }, async (request, reply) => {
    const { period = 'this_month', startDate, endDate } = request.query as PeriodQuery;
    try {
      return reply.send(await AnalyticsService.getAttendanceAnalytics(period, startDate, endDate));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de calculer les statistiques de fréquentation.');
    }
  });

  // 3. Évolution temporelle (courbes multi-séries)
  app.get('/api/analytics/attendance/trends', { preHandler: authenticateRequest }, async (request, reply) => {
    const { granularity = 'week' } = request.query as { granularity?: 'day' | 'week' | 'month' | 'quarter' };
    try {
      return reply.send(await AnalyticsService.getAttendanceTrends(granularity));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de calculer les tendances.');
    }
  });

  // 4. Analyses financières détaillées (STRICTEMENT INTERDIT AUX RÔLES PROTOCOLE)
  app.get(
    '/api/analytics/finance',
    {
      preHandler: requireRoles([
        UserRole.ADMIN,
        UserRole.LEAD_PASTOR,
        UserRole.FINANCE_LEAD,
        UserRole.CASHIER,
        UserRole.AUDITOR,
      ]),
    },
    async (request, reply) => {
      const { period = 'this_month', startDate, endDate } = request.query as PeriodQuery;
      try {
        return reply.send(await AnalyticsService.getFinancialAnalytics(period, startDate, endDate));
      } catch (err) {
        return sendServiceError(reply, err, 'Impossible de calculer les analyses financières.');
      }
    }
  );

  // 5. Export des données statistiques en CSV (données réelles, filtrables par période)
  app.get('/api/analytics/export/csv', { preHandler: authenticateRequest }, async (request, reply) => {
    const { type = 'attendance', period, startDate, endDate } = request.query as {
      type?: 'attendance' | 'finance';
      period?: string;
      startDate?: string;
      endDate?: string;
    };
    const p = period ? normalizePeriod(period) : undefined;

    if (type === 'finance' && isProtocolRole(request.user?.role)) {
      return reply.status(403).send({
        error: 'Accès interdit : Le rôle Protocole n’est pas autorisé à exporter les données financières.',
      });
    }

    try {
      if (type === 'finance') {
        return sendCsv(reply, 'statistiques-financieres-eev.csv', await AnalyticsService.buildFinanceCsv(p, startDate, endDate));
      }
      return sendCsv(reply, 'statistiques-frequentation-eev.csv', await AnalyticsService.buildAttendanceCsv(p, startDate, endDate));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de générer l’export CSV.');
    }
  });
}
