import { FastifyInstance } from 'fastify';
import { authenticateRequest, requireRoles } from '../middleware/auth.js';
import { AnalyticsService, PeriodKey } from '../services/analytics.service.js';
import { UserRole } from '@eev/shared-types';
import { isProtocolRole, sendServiceError } from '../utils/http.js';

type PeriodQuery = { period?: PeriodKey; startDate?: string; endDate?: string };

export async function dashboardRoutes(app: FastifyInstance) {
  // Vue d'ensemble exécutive (Leader, Admin, Auditeur). Le Protocole ne reçoit aucune donnée financière.
  app.get('/api/dashboard/overview', { preHandler: authenticateRequest }, async (request, reply) => {
    const { period = 'this_month', startDate, endDate } = request.query as PeriodQuery;
    try {
      const includeFinance = !isProtocolRole(request.user?.role);
      return reply.send(await AnalyticsService.getDashboard(period, startDate, endDate, includeFinance));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de calculer le tableau de bord.');
    }
  });

  // Tableau de bord Protocole (présences, nouveaux visiteurs, décisions pour Christ)
  app.get('/api/dashboard/attendance', { preHandler: authenticateRequest }, async (request, reply) => {
    const { period = 'this_month', startDate, endDate } = request.query as PeriodQuery;
    try {
      return reply.send(await AnalyticsService.getAttendanceDashboard(period, startDate, endDate));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de calculer les statistiques de fréquentation.');
    }
  });

  // Tableau de bord Finances (STRICTEMENT RÉSERVÉ AUX RÔLES FINANCES & DIRECTION)
  app.get(
    '/api/dashboard/finance',
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
        return reply.send(await AnalyticsService.getFinanceDashboard(period, startDate, endDate));
      } catch (err) {
        return sendServiceError(reply, err, 'Impossible de calculer le tableau de bord financier.');
      }
    }
  );
}
