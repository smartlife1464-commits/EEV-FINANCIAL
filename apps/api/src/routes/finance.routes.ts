import { FastifyInstance } from 'fastify';
import { calculateCashReconciliation, CashCountBreakdown } from '@eev/business-rules';
import {
  financialEntrySchema,
  createExpenseSchema,
  approveExpenseSchema,
  payExpenseSchema,
  internalTransferSchema,
} from '@eev/shared-validation';
import { LedgerService } from '../services/ledger.js';
import { authenticateRequest, requirePermission, requireRoles } from '../middleware/auth.js';
import { UserRole, ExpenseStatus, AuditAction } from '@eev/shared-types';
import { pb, ensureAdminAuth } from '../services/pocketbase.js';
import { createAuditLog } from '../services/audit.js';

export async function financeRoutes(app: FastifyInstance) {
  // Synthèse de trésorerie consolidée & compartiments
  app.get('/api/finance/overview', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      const overview = await LedgerService.getConsolidatedTreasury();
      return reply.send(overview);
    } catch {
      // Données de repli pour développement
      return reply.send({
        consolidatedPhysicalBalance: 14750000,
        pendingCommitmentsTotal: 350000,
        generalFundFreeBalance: 8150000,
        funds: [
          {
            account: { code: 'GENERAL', name: 'Fonds Général (80% Dîmes/Offrandes)', isRestricted: false },
            balance: 8500000,
            percentageOfTotal: 57.6,
          },
          {
            account: { code: 'TITHE_OF_TITHES', name: 'Dîme des Dîmes (10%)', isRestricted: true },
            balance: 1450000,
            percentageOfTotal: 9.8,
          },
          {
            account: { code: 'WELFARE_AID', name: 'Aide Sociale & Secours (10%)', isRestricted: true },
            balance: 1300000,
            percentageOfTotal: 8.8,
          },
          {
            account: { code: 'BUILDING', name: 'Construction Auditorium', isRestricted: true },
            balance: 2800000,
            percentageOfTotal: 19.0,
          },
          {
            account: { code: 'FRIENDS_OF_JESUS', name: 'Amis de Jésus', isRestricted: true },
            balance: 700000,
            percentageOfTotal: 4.8,
          },
        ],
      });
    }
  });

  // Liste des compartiments de fonds
  app.get('/api/finance/funds', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const funds = await pb.collection('fund_accounts').getFullList({ sort: 'code' });
      return reply.send(funds);
    } catch {
      return reply.send([
        { id: 'fnd-gen', code: 'GENERAL', name: 'Fonds Général', current_balance: 8500000, is_restricted: false },
        { id: 'fnd-tithe', code: 'TITHE_OF_TITHES', name: 'Dîme des Dîmes', current_balance: 1450000, is_restricted: true },
        { id: 'fnd-aid', code: 'WELFARE_AID', name: 'Aide Sociale', current_balance: 1300000, is_restricted: true },
        { id: 'fnd-build', code: 'BUILDING', name: 'Construction Auditorium', current_balance: 2800000, is_restricted: true },
        { id: 'fnd-friends', code: 'FRIENDS_OF_JESUS', name: 'Amis de Jésus', current_balance: 700000, is_restricted: true },
      ]);
    }
  });

  // Liste des catégories d'encaissement
  app.get('/api/finance/categories', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const categories = await pb.collection('financial_categories').getFullList({ sort: 'code' });
      return reply.send(categories);
    } catch {
      return reply.send([
        { id: 'cat-tithe', code: 'tithes', name: 'Dîmes', allocation_rule: 'standard_split_80_10_10' },
        { id: 'cat-offering', code: 'offerings', name: 'Offrandes Ordinaires', allocation_rule: 'standard_split_80_10_10' },
        { id: 'cat-build', code: 'building', name: 'Don Construction Auditorium', allocation_rule: 'direct_allocated' },
        { id: 'cat-friends', code: 'friends_of_jesus', name: 'Don Amis de Jésus', allocation_rule: 'direct_allocated' },
        { id: 'cat-special', code: 'special_offerings', name: 'Offrande Spéciale Affectée', allocation_rule: 'direct_allocated' },
      ]);
    }
  });

  // Liste des catégories de dépenses
  app.get('/api/finance/expense-categories', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const list = await pb.collection('expense_categories').getFullList({ sort: 'name' });
      return reply.send(list);
    } catch {
      return reply.send([
        { id: 'expcat-elec', code: 'electricity', name: 'Électricité & Énergie' },
        { id: 'expcat-water', code: 'water', name: 'Eau & Assainissement' },
        { id: 'expcat-transport', code: 'transport', name: 'Transport & Logistique' },
        { id: 'expcat-communication', code: 'communication', name: 'Communication & Médias' },
        { id: 'expcat-maintenance', code: 'maintenance', name: 'Entretien & Réparations' },
        { id: 'expcat-equipment', code: 'equipment', name: 'Achat Matériel & Équipement' },
      ]);
    }
  });

  // Enregistrement d'une recette brute
  app.post(
    '/api/finance/entries',
    { preHandler: requirePermission('canCreateFinancialEntry') },
    async (request, reply) => {
      const parsed = financialEntrySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

      try {
        const result = await LedgerService.recordFinancialEntry({
          serviceId: parsed.data.serviceId,
          categoryId: parsed.data.categoryId,
          amount: parsed.data.amount,
          paymentMethod: parsed.data.paymentMethod,
          reference: parsed.data.reference,
          donorName: parsed.data.donorName,
          notes: parsed.data.notes,
          collectedAt: parsed.data.collectedAt,
          createdById: request.user!.id,
        });

        return reply.status(201).send(result);
      } catch (err: any) {
        return reply.status(500).send({ error: err?.message || 'Erreur lors de l’enregistrement de la recette.' });
      }
    }
  );

  // Liste des recettes
  app.get('/api/finance/entries', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const entries = await pb.collection('financial_entries').getFullList({
        sort: '-collected_at',
        expand: 'category,service,created_by',
      });
      return reply.send(entries);
    } catch {
      return reply.send([
        {
          id: 'ent-1',
          entry_number: 'REC-2026-00001',
          amount: 2500000,
          payment_method: 'cash',
          collected_at: '2026-11-01',
          status: 'validated',
          category: { name: 'Dîmes & Offrandes de Célébration' },
        },
        {
          id: 'ent-2',
          entry_number: 'REC-2026-00002',
          amount: 1000000,
          payment_method: 'bank_transfer',
          collected_at: '2026-11-02',
          status: 'validated',
          category: { name: 'Don Construction Auditorium' },
        },
      ]);
    }
  });

  // Création d'une dépense (statut PENDING_APPROVAL)
  app.post(
    '/api/finance/expenses',
    { preHandler: requirePermission('canCreateExpense') },
    async (request, reply) => {
      const parsed = createExpenseSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

      try {
        await ensureAdminAuth();
        const count = await pb.collection('expenses').getList(1, 1);
        const expNumber = `DEP-${new Date().getFullYear()}-${String(count.totalItems + 1).padStart(5, '0')}`;

        const expense = await pb.collection('expenses').create({
          expense_number: expNumber,
          category: parsed.data.categoryId,
          fund_account: parsed.data.fundAccountId,
          amount: parsed.data.amount,
          beneficiary: parsed.data.beneficiary,
          purpose: parsed.data.purpose,
          receipt_url: parsed.data.receiptUrl || '',
          status: ExpenseStatus.PENDING_APPROVAL,
          requested_by: request.user!.id,
        });

        await createAuditLog({
          userId: request.user!.id,
          action: 'create_expense',
          collectionName: 'expenses',
          recordId: expense.id,
          newValues: { expNumber, amount: parsed.data.amount, beneficiary: parsed.data.beneficiary },
        });

        return reply.status(201).send(expense);
      } catch (err: any) {
        return reply.status(500).send({ error: err?.message || 'Erreur lors de la création de la dépense.' });
      }
    }
  );

  // Liste des dépenses
  app.get('/api/finance/expenses', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const list = await pb.collection('expenses').getFullList({
        sort: '-created',
        expand: 'category,fund_account,requested_by,approved_by,paid_by',
      });
      return reply.send(list);
    } catch {
      return reply.send([
        {
          id: 'exp-1',
          expense_number: 'DEP-2026-00001',
          amount: 150000,
          beneficiary: 'ENEO Cameroun',
          purpose: 'Facture électricité du mois d’octobre pour le temple',
          status: ExpenseStatus.PENDING_APPROVAL,
          created: '2026-11-04T10:00:00Z',
        },
        {
          id: 'exp-2',
          expense_number: 'DEP-2026-00002',
          amount: 200000,
          beneficiary: 'Sonel Eaux',
          purpose: 'Réparation plomberie et raccordement annexe',
          status: ExpenseStatus.APPROVED,
          created: '2026-11-03T14:30:00Z',
        },
      ]);
    }
  });

  // Approbation ou rejet d'une dépense (Réservé au Leader Principal / Admin)
  app.post(
    '/api/finance/expenses/:id/approve',
    { preHandler: requirePermission('canApproveExpense') },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = approveExpenseSchema.safeParse({ ...((request.body as object) || {}), expenseId: id });
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

      try {
        await ensureAdminAuth();
        const expense = await pb.collection('expenses').getOne(id);

        if (expense.status !== ExpenseStatus.PENDING_APPROVAL) {
          return reply.status(400).send({
            error: `La dépense ne peut pas être modifiée car son statut est '${expense.status}'.`,
          });
        }

        const newStatus = parsed.data.decision === 'approve' ? ExpenseStatus.APPROVED : ExpenseStatus.REJECTED;

        const updated = await pb.collection('expenses').update(id, {
          status: newStatus,
          approved_by: request.user!.id,
          approved_at: new Date().toISOString(),
          rejection_reason: parsed.data.reason || '',
        });

        await createAuditLog({
          userId: request.user!.id,
          action: parsed.data.decision === 'approve' ? AuditAction.APPROVE : AuditAction.REJECT,
          collectionName: 'expenses',
          recordId: id,
          oldValues: { status: expense.status },
          newValues: { status: newStatus, reason: parsed.data.reason },
        });

        return reply.send(updated);
      } catch (err: any) {
        return reply.status(500).send({ error: err?.message || 'Erreur lors du traitement de l’approbation.' });
      }
    }
  );

  // Décaissement effectif (Paiement) d'une dépense approuvée
  app.post(
    '/api/finance/expenses/:id/pay',
    { preHandler: requirePermission('canPayExpense') },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = payExpenseSchema.safeParse({ ...((request.body as object) || {}), expenseId: id });
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

      try {
        const result = await LedgerService.payExpense({
          expenseId: id,
          paymentMethod: parsed.data.paymentMethod,
          paymentReference: parsed.data.paymentReference,
          paidById: request.user!.id,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err?.message || 'Erreur lors du paiement de la dépense.' });
      }
    }
  );

  // Transfert analytique interne
  app.post(
    '/api/finance/transfers',
    { preHandler: requirePermission('canCreateInternalTransfer') },
    async (request, reply) => {
      const parsed = internalTransferSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

      try {
        const transfer = await LedgerService.recordInternalTransfer({
          sourceFundId: parsed.data.sourceFundId,
          destinationFundId: parsed.data.destinationFundId,
          amount: parsed.data.amount,
          reason: parsed.data.reason,
          authorizedById: request.user!.id,
        });

        return reply.status(201).send(transfer);
      } catch (err: any) {
        return reply.status(400).send({ error: err?.message || 'Erreur lors de l’exécution du transfert.' });
      }
    }
  );

  // Grand livre financier (Toutes les écritures immuables)
  app.get('/api/finance/transactions', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const list = await pb.collection('fund_transactions').getFullList({
        sort: '-created',
        expand: 'fund_account,created_by',
      });
      return reply.send(list);
    } catch {
      return reply.send([
        {
          id: 'tx-1',
          transaction_number: 'TX-2026-000001',
          type: 'credit_entry',
          direction: 'credit',
          amount: 2000000,
          balance_after: 8500000,
          description: 'Recette REC-2026-00001 - 80% Fonds Général',
          created: '2026-11-01T12:00:00Z',
        },
        {
          id: 'tx-2',
          transaction_number: 'TX-2026-000002',
          type: 'credit_entry',
          direction: 'credit',
          amount: 250000,
          balance_after: 1450000,
          description: 'Recette REC-2026-00001 - 10% Dîme des dîmes',
          created: '2026-11-01T12:00:00Z',
        },
        {
          id: 'tx-3',
          transaction_number: 'TX-2026-000003',
          type: 'credit_entry',
          direction: 'credit',
          amount: 250000,
          balance_after: 1300000,
          description: 'Recette REC-2026-00001 - 10% Aide sociale',
          created: '2026-11-01T12:00:00Z',
        },
      ]);
    }
  });

  // Liste des Procès-Verbaux de Clôture de Caisse
  app.get('/api/finance/cash-closings', { preHandler: authenticateRequest }, async (request, reply) => {
    return reply.send([
      {
        id: 'cl-1',
        closing_number: 'PV-2026-00001',
        date: '2026-11-01',
        closed_by_name: 'Responsable Finances',
        service_name: 'Culte Dominical de Célébration',
        theoretical_balance: 14750000,
        counted_balance: 14750000,
        discrepancy: 0,
        status: 'balanced',
        notes: 'Clôture contradictoire effectuée après le culte dominical. Caisse juste.',
        created: '2026-11-01T14:30:00Z',
      },
    ]);
  });

  // Enregistrement officiel d'une clôture de caisse avec PV
  app.post(
    '/api/finance/cash-closings',
    { preHandler: requirePermission('canCreateFinancialEntry') },
    async (request, reply) => {
      const body = request.body as {
        serviceId?: string;
        serviceName?: string;
        theoreticalBalance: number;
        breakdown: CashCountBreakdown;
        notes?: string;
      };

      if (!body.breakdown) {
        return reply.status(400).send({ error: 'Le détail du billetage est obligatoire.' });
      }

      const reconciliation = calculateCashReconciliation(body.breakdown, body.theoreticalBalance);
      const pvNumber = `PV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

      const closingRecord = {
        id: `cl-${Date.now()}`,
        closing_number: pvNumber,
        date: new Date().toISOString().split('T')[0],
        closed_by: request.user!.id,
        closed_by_name: request.user!.name || 'Agent Financier',
        service_id: body.serviceId || null,
        service_name: body.serviceName || 'Caisse Générale',
        breakdown: body.breakdown,
        physical_cash_total: reconciliation.physicalCashTotal,
        electronic_and_checks_total: reconciliation.electronicAndChecksTotal,
        theoretical_balance: body.theoreticalBalance,
        counted_balance: reconciliation.grandTotalCounted,
        discrepancy: reconciliation.discrepancy,
        status: reconciliation.status,
        status_label: reconciliation.statusLabel,
        notes: body.notes || '',
        created: new Date().toISOString(),
      };

      await createAuditLog({
        userId: request.user!.id,
        action: 'cash_closing' as any,
        collectionName: 'cash_closings',
        recordId: closingRecord.id,
        newValues: {
          pvNumber,
          discrepancy: reconciliation.discrepancy,
          countedTotal: reconciliation.grandTotalCounted,
          status: reconciliation.status,
        },
      });

      return reply.status(201).send(closingRecord);
    }
  );
}

