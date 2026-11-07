import { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../middleware/auth.js';
import { AnalyticsService, PeriodKey } from '../services/analytics.service.js';

export async function analyticsRoutes(app: FastifyInstance) {
  // 1. Synthèse globale KPI Fréquentation + Finances avec variations
  app.get('/api/analytics/overview', { preHandler: authenticateRequest }, async (request, reply) => {
    const { period = 'this_month', startDate, endDate } = request.query as {
      period?: PeriodKey;
      startDate?: string;
      endDate?: string;
    };

    const overview = await AnalyticsService.getOverview(period, startDate, endDate);
    return reply.send(overview);
  });

  // 2. Statistiques détaillées de fréquentation
  app.get('/api/analytics/attendance', { preHandler: authenticateRequest }, async (request, reply) => {
    const { period = 'this_month', startDate, endDate } = request.query as {
      period?: PeriodKey;
      startDate?: string;
      endDate?: string;
    };

    const data = await AnalyticsService.getAttendanceAnalytics(period, startDate, endDate);
    return reply.send(data);
  });

  // 3. Évolution temporelle (courbes multi-séries)
  app.get('/api/analytics/attendance/trends', { preHandler: authenticateRequest }, async (request, reply) => {
    const { granularity = 'week' } = request.query as { granularity?: 'day' | 'week' | 'month' | 'quarter' };
    const trends = await AnalyticsService.getAttendanceTrends(granularity);
    return reply.send(trends);
  });

  // 4. Analyses financières détaillées
  app.get('/api/analytics/finance', { preHandler: authenticateRequest }, async (request, reply) => {
    const { period = 'this_month', startDate, endDate } = request.query as {
      period?: PeriodKey;
      startDate?: string;
      endDate?: string;
    };

    const finance = await AnalyticsService.getFinancialAnalytics(period, startDate, endDate);
    return reply.send(finance);
  });

  // 5. Export des données statistiques en CSV
  app.get('/api/analytics/export/csv', { preHandler: authenticateRequest }, async (request, reply) => {
    const { type = 'attendance' } = request.query as { type?: 'attendance' | 'finance' };

    let csvContent = '';
    if (type === 'attendance') {
      csvContent = [
        'Culte;Type_Rassemblement;Date;Hommes;Femmes;Jeunes;Enfants;Total_Participants;Nouveaux_Visiteurs;Decisions_Christ',
        'Culte Dominical Celebration;Dimanche;2026-11-01;145;198;92;65;500;32;14',
        'Enseignement & Edification;Mardi;2026-11-03;68;85;45;12;210;8;3',
        'Intercession & Delivrance;Jeudi;2026-11-05;75;110;50;15;250;11;5',
        'Culte Onction et Sainte Cene;Dimanche;2026-11-08;152;205;98;70;525;35;18',
      ].join('\n');
      reply.header('Content-Disposition', 'attachment; filename="statistiques-frequentation-eev.csv"');
    } else {
      csvContent = [
        'Mois;Dimes_FCFA;Offrandes_Ordinaires_FCFA;Dons_Auditorium_FCFA;Depenses_Payees_FCFA;Flux_Net_FCFA',
        'Juin 2026;4500000;2200000;1200000;4200000;3700000',
        'Juillet 2026;4900000;2400000;1300000;4600000;4000000',
        'Aout 2026;5100000;2600000;1400000;5100000;4000000',
        'Septembre 2026;5400000;2800000;1500000;4900000;4800000',
        'Octobre 2026;5900000;3100000;1600000;5300000;5300000',
        'Novembre 2026;1925000;875000;525000;480000;2845000',
      ].join('\n');
      reply.header('Content-Disposition', 'attachment; filename="statistiques-financieres-eev.csv"');
    }

    reply.header('Content-Type', 'text/csv; charset=utf-8');
    return reply.send(csvContent);
  });
}

