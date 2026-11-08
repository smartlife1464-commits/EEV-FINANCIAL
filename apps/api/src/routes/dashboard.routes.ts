import { FastifyInstance } from 'fastify';
import { authenticateRequest, requireRoles } from '../middleware/auth.js';
import { LedgerService } from '../services/ledger.js';
import { UserRole } from '@eev/shared-types';

export async function dashboardRoutes(app: FastifyInstance) {
  // Vue d'ensemble générale pour le Leader Principal & l'Admin
  app.get('/api/dashboard/overview', { preHandler: authenticateRequest }, async (request, reply) => {
    // Si l'utilisateur est du département Protocole, masquer TOUTES les données financières
    const isProtocolRole = [UserRole.PROTOCOL_LEAD, UserRole.PROTOCOL_AGENT].includes(request.user?.role as UserRole);

    if (isProtocolRole) {
      return reply.send({
        attendance: {
          lastService: {
            name: 'Culte de Célébration et d’Adoration',
            date: '2026-11-01',
            totalAttendance: 500,
            menCount: 145,
            womenCount: 198,
            youthCount: 92,
            childrenCount: 65,
            newVisitorsCount: 32,
            salvationsCount: 14,
          },
          monthlyAverage: 465,
          weeklyGrowthPercent: 7.5,
          recentServices: [
            { date: '11/10', total: 420, newVisitors: 18 },
            { date: '18/10', total: 445, newVisitors: 24 },
            { date: '25/10', total: 480, newVisitors: 28 },
            { date: '01/11', total: 500, newVisitors: 32 },
          ],
        },
      });
    }

    try {
      const treasury = await LedgerService.getConsolidatedTreasury();

      return reply.send({
        treasury,
        attendance: {
          lastService: {
            name: 'Culte de Célébration et d’Adoration',
            date: '2026-11-01',
            totalAttendance: 500,
            menCount: 145,
            womenCount: 198,
            youthCount: 92,
            childrenCount: 65,
            newVisitorsCount: 32,
            salvationsCount: 14,
          },
          monthlyAverage: 465,
          weeklyGrowthPercent: 7.5,
          recentServices: [
            { date: '11/10', total: 420, newVisitors: 18 },
            { date: '18/10', total: 445, newVisitors: 24 },
            { date: '25/10', total: 480, newVisitors: 28 },
            { date: '01/11', total: 500, newVisitors: 32 },
          ],
        },
        financialTrends: [
          { month: 'Juin', revenues: 8500000, expenses: 4200000 },
          { month: 'Juil', revenues: 9200000, expenses: 4600000 },
          { month: 'Août', revenues: 9800000, expenses: 5100000 },
          { month: 'Sept', revenues: 10400000, expenses: 4900000 },
          { month: 'Oct', revenues: 11200000, expenses: 5300000 },
          { month: 'Nov', revenues: 3500000, expenses: 350000 },
        ],
        pendingApprovalsCount: 2,
        pendingApprovalsTotalAmount: 350000,
      });
    } catch {
      return reply.send({
        treasury: {
          consolidatedPhysicalBalance: 14750000,
          pendingCommitmentsTotal: 350000,
          generalFundFreeBalance: 8150000,
          funds: [
            { account: { code: 'GENERAL', name: 'Fonds Général' }, balance: 8500000, percentageOfTotal: 57.6 },
            { account: { code: 'TITHE_OF_TITHES', name: 'Dîme des Dîmes' }, balance: 1450000, percentageOfTotal: 9.8 },
            { account: { code: 'WELFARE_AID', name: 'Aide Sociale' }, balance: 1300000, percentageOfTotal: 8.8 },
            { account: { code: 'BUILDING', name: 'Construction Auditorium' }, balance: 2800000, percentageOfTotal: 19.0 },
            { account: { code: 'FRIENDS_OF_JESUS', name: 'Amis de Jésus' }, balance: 700000, percentageOfTotal: 4.8 },
          ],
        },
        attendance: {
          lastService: {
            name: 'Culte de Célébration et d’Adoration',
            date: '2026-11-01',
            totalAttendance: 500,
            menCount: 145,
            womenCount: 198,
            youthCount: 92,
            childrenCount: 65,
            newVisitorsCount: 32,
            salvationsCount: 14,
          },
          monthlyAverage: 465,
          weeklyGrowthPercent: 7.5,
          recentServices: [
            { date: '11/10', total: 420, newVisitors: 18 },
            { date: '18/10', total: 445, newVisitors: 24 },
            { date: '25/10', total: 480, newVisitors: 28 },
            { date: '01/11', total: 500, newVisitors: 32 },
          ],
        },
        financialTrends: [
          { month: 'Juin', revenues: 8500000, expenses: 4200000 },
          { month: 'Juil', revenues: 9200000, expenses: 4600000 },
          { month: 'Août', revenues: 9800000, expenses: 5100000 },
          { month: 'Sept', revenues: 10400000, expenses: 4900000 },
          { month: 'Oct', revenues: 11200000, expenses: 5300000 },
          { month: 'Nov', revenues: 3500000, expenses: 350000 },
        ],
        pendingApprovalsCount: 2,
        pendingApprovalsTotalAmount: 350000,
      });
    }
  });

  // Dashboard Protocole (100% Présences, Nouveaux Visiteurs, Décisions pour Christ)
  app.get('/api/dashboard/attendance', { preHandler: authenticateRequest }, async (request, reply) => {
    return reply.send({
      lastServiceTotal: 500,
      men: 145,
      women: 198,
      youth: 92,
      children: 65,
      newVisitors: 32,
      salvations: 14,
      byServiceType: [
        { type: 'Dimanche (Célébration)', average: 480 },
        { type: 'Mardi (Enseignement)', average: 230 },
        { type: 'Jeudi (Intercession)', average: 190 },
      ],
    });
  });

  // Dashboard Finances (STRICTEMENT RÉSERVÉ AUX RÔLES FINANCES & DIRECTION)
  app.get(
    '/api/dashboard/finance',
    {
      preHandler: [
        authenticateRequest,
        requireRoles([
          UserRole.ADMIN,
          UserRole.LEAD_PASTOR,
          UserRole.FINANCE_LEAD,
          UserRole.CASHIER,
          UserRole.AUDITOR,
        ]),
      ],
    },
    async (request, reply) => {
      return reply.send({
        totalRevenueMonth: 3500000,
        totalExpensesMonth: 350000,
        netCashFlow: 3150000,
        consolidatedCash: 14750000,
        generalFundAvailable: 8150000,
        tithesSplitTotal: 2500000,
        welfareAidTotal: 1300000,
        buildingFundTotal: 2800000,
      });
    }
  );
}
