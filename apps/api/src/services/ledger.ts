import { pb, ensureAdminAuth } from './pocketbase.js';
import {
  calculateEntryAllocations,
  validateInternalTransfer,
} from '@eev/business-rules';
import {
  AllocationRule,
  FundAccountCode,
  FundTransactionType,
  PaymentMethod,
  AuditAction,
  ExpenseStatus,
  ConsolidatedTreasury,
  FinancialEntryStatus,
} from '@eev/shared-types';
import { createAuditLog } from './audit.js';
import { campaignProgress } from '../routes/funds.routes.js';

export interface CreateFinancialEntryInput {
  serviceId?: string;
  categoryId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  donorName?: string;
  notes?: string;
  collectedAt: string;
  createdById: string;
}

export interface InternalTransferInput {
  sourceFundId: string;
  destinationFundId: string;
  amount: number;
  reason: string;
  authorizedById: string;
}

export interface PayExpenseInput {
  expenseId: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paidById: string;
}

export class LedgerService {
  /**
   * Génère le prochain numéro séquentiel annuel (ex. DEP-2026-00012) à partir du plus grand numéro
   * existant — et non du nombre d'enregistrements, qui produisait des doublons après suppression.
   */
  static async nextNumber(collection: string, field: string, prefix: string, pad: number): Promise<string> {
    await ensureAdminAuth();
    const yearPrefix = `${prefix}-${new Date().getFullYear()}-`;
    const last = await pb
      .collection(collection)
      .getList(1, 1, { filter: `${field} ~ "${yearPrefix}%"`, sort: `-${field}` })
      .catch(() => null);
    const lastValue = String(last?.items?.[0]?.[field] || '');
    const lastSeq = parseInt(lastValue.slice(yearPrefix.length), 10) || 0;
    return `${yearPrefix}${String(lastSeq + 1).padStart(pad, '0')}`;
  }

  /**
   * Enregistre une recette brute avec sa ventilation analytique non négociable.
   */
  static async recordFinancialEntry(input: CreateFinancialEntryInput) {
    await ensureAdminAuth();

    // 1. Récupérer la catégorie financière
    const category = await pb.collection('financial_categories').getOne(input.categoryId, {
      expand: 'target_fund',
    });

    const rule = category.allocation_rule as AllocationRule;
    const targetFundCode = (category.expand as any)?.target_fund?.code;
    if (rule === AllocationRule.DIRECT_ALLOCATED && !targetFundCode) {
      throw new Error(`La catégorie « ${category.name} » n'a pas de compartiment cible configuré.`);
    }
    if (!Object.values(AllocationRule).includes(rule)) {
      throw new Error(`Règle de ventilation inconnue pour la catégorie « ${category.name || category.id} ».`);
    }

    // 2. Calculer la ventilation avec exactitude arithmétique (pas de flottant)
    const splitResult = calculateEntryAllocations(input.amount, rule, targetFundCode);

    // 3. Récupérer tous les comptes de fonds
    const allFunds = await pb.collection('fund_accounts').getFullList();
    const fundMapByCode = new Map(allFunds.map((f) => [f.code, f]));

    // 4. Générer le numéro séquentiel d'entrée
    const entryNumber = await LedgerService.nextNumber('financial_entries', 'entry_number', 'REC', 5);

    // 5. Créer l'enregistrement de recette
    const entryRecord = await pb.collection('financial_entries').create({
      entry_number: entryNumber,
      service: input.serviceId || null,
      category: input.categoryId,
      amount: input.amount,
      payment_method: input.paymentMethod,
      reference: input.reference || '',
      donor_name: input.donorName || '',
      notes: input.notes || '',
      status: FinancialEntryStatus.VALIDATED,
      collected_at: input.collectedAt,
      created_by: input.createdById,
    });

    // 6. Enregistrer chaque affectation analytique et mettre à jour les soldes
    const createdAllocations = [];
    for (const alloc of splitResult.allocations) {
      const fund = fundMapByCode.get(alloc.fundCode);
      if (!fund) {
        throw new Error(`Compartiment de fonds introuvable pour le code: ${alloc.fundCode}`);
      }

      // Création de l'affectation
      const allocationRecord = await pb.collection('fund_allocations').create({
        financial_entry: entryRecord.id,
        fund_account: fund.id,
        amount: alloc.amount,
        percentage: alloc.percentage,
      });
      createdAllocations.push(allocationRecord);

      // Mise à jour du solde du fonds analytique
      const newBalance = (fund.current_balance || 0) + alloc.amount;
      await pb.collection('fund_accounts').update(fund.id, {
        current_balance: newBalance,
      });

      // Écriture au grand livre (journal des transactions)
      const txNumber = await LedgerService.nextNumber('fund_transactions', 'transaction_number', 'TX', 6);

      await pb.collection('fund_transactions').create({
        transaction_number: txNumber,
        fund_account: fund.id,
        type: FundTransactionType.CREDIT_ENTRY,
        direction: 'credit',
        amount: alloc.amount,
        balance_after: newBalance,
        related_entry: entryRecord.id,
        description: `Recette ${entryNumber} - ${alloc.description}`,
        created_by: input.createdById,
      });
    }

    // 7. Piste d'audit
    await createAuditLog({
      userId: input.createdById,
      action: AuditAction.CREATE,
      collectionName: 'financial_entries',
      recordId: entryRecord.id,
      newValues: {
        entryNumber,
        amount: input.amount,
        split: splitResult.allocations,
      },
    });

    return {
      entry: entryRecord,
      allocations: createdAllocations,
      split: splitResult,
    };
  }

  /**
   * Effectue un transfert analytique interne entre compartiments.
   * Le solde physique consolidé de la caisse reste rigoureusement inchangé.
   */
  static async recordInternalTransfer(input: InternalTransferInput) {
    await ensureAdminAuth();

    const sourceFund = await pb.collection('fund_accounts').getOne(input.sourceFundId);
    const destFund = await pb.collection('fund_accounts').getOne(input.destinationFundId);

    const validation = validateInternalTransfer(
      sourceFund.code,
      destFund.code,
      input.amount,
      sourceFund.current_balance
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 1. Débiter le fonds source
    const newSourceBalance = sourceFund.current_balance - input.amount;
    await pb.collection('fund_accounts').update(sourceFund.id, {
      current_balance: newSourceBalance,
    });

    // 2. Créditer le fonds destination
    const newDestBalance = destFund.current_balance + input.amount;
    await pb.collection('fund_accounts').update(destFund.id, {
      current_balance: newDestBalance,
    });

    // 3. Créer le transfert interne
    const transferNumber = await LedgerService.nextNumber('internal_transfers', 'transfer_number', 'TRF', 5);

    const transfer = await pb.collection('internal_transfers').create({
      transfer_number: transferNumber,
      source_fund: sourceFund.id,
      destination_fund: destFund.id,
      amount: input.amount,
      reason: input.reason,
      authorized_by: input.authorizedById,
    });

    // 4. Écrire les 2 écritures symétriques au grand livre
    const firstTx = await LedgerService.nextNumber('fund_transactions', 'transaction_number', 'TX', 6);
    const baseTxNum = parseInt(firstTx.split('-').pop() || '1', 10);

    // Débit source
    await pb.collection('fund_transactions').create({
      transaction_number: `TX-${new Date().getFullYear()}-${String(baseTxNum).padStart(6, '0')}`,
      fund_account: sourceFund.id,
      type: FundTransactionType.TRANSFER_OUT,
      direction: 'debit',
      amount: input.amount,
      balance_after: newSourceBalance,
      related_transfer: transfer.id,
      description: `Transfert vers ${destFund.name} (${transferNumber}): ${input.reason}`,
      created_by: input.authorizedById,
    });

    // Crédit destination
    await pb.collection('fund_transactions').create({
      transaction_number: `TX-${new Date().getFullYear()}-${String(baseTxNum + 1).padStart(6, '0')}`,
      fund_account: destFund.id,
      type: FundTransactionType.TRANSFER_IN,
      direction: 'credit',
      amount: input.amount,
      balance_after: newDestBalance,
      related_transfer: transfer.id,
      description: `Transfert depuis ${sourceFund.name} (${transferNumber}): ${input.reason}`,
      created_by: input.authorizedById,
    });

    // 5. Piste d'audit
    await createAuditLog({
      userId: input.authorizedById,
      action: 'internal_transfer',
      collectionName: 'internal_transfers',
      recordId: transfer.id,
      newValues: {
        transferNumber,
        source: sourceFund.code,
        destination: destFund.code,
        amount: input.amount,
      },
    });

    return transfer;
  }

  /**
   * Procède au décaissement effectif d'une dépense préalablement approuvée par le Leader.
   */
  static async payExpense(input: PayExpenseInput) {
    await ensureAdminAuth();

    const expense = await pb.collection('expenses').getOne(input.expenseId, {
      expand: 'fund_account,category',
    });

    if (expense.status !== ExpenseStatus.APPROVED) {
      throw new Error(`Seule une dépense au statut "approuvée" peut être payée. Statut actuel: ${expense.status}`);
    }

    const fund = (expense.expand as any)?.fund_account;
    if (!fund) {
      throw new Error('Compartiment analytique associé à la dépense introuvable.');
    }

    if (fund.current_balance < expense.amount) {
      throw new Error(`Solde insuffisant dans le fonds ${fund.name} (${fund.current_balance} FCFA disponible, ${expense.amount} FCFA requis).`);
    }

    // 1. Débiter le fonds analytique
    const newFundBalance = fund.current_balance - expense.amount;
    await pb.collection('fund_accounts').update(fund.id, {
      current_balance: newFundBalance,
    });

    // 2. Mettre à jour la dépense au statut PAID
    const updatedExpense = await pb.collection('expenses').update(expense.id, {
      status: ExpenseStatus.PAID,
      paid_at: new Date().toISOString(),
      paid_by: input.paidById,
      payment_method: input.paymentMethod,
      payment_reference: input.paymentReference || '',
    });

    // 3. Écrire au grand livre
    const txNumber = await LedgerService.nextNumber('fund_transactions', 'transaction_number', 'TX', 6);

    await pb.collection('fund_transactions').create({
      transaction_number: txNumber,
      fund_account: fund.id,
      type: FundTransactionType.DEBIT_EXPENSE,
      direction: 'debit',
      amount: expense.amount,
      balance_after: newFundBalance,
      related_expense: expense.id,
      description: `Règlement dépense ${expense.expense_number} - ${expense.purpose} (Bénéficiaire: ${expense.beneficiary})`,
      created_by: input.paidById,
    });

    // 4. Piste d'audit
    await createAuditLog({
      userId: input.paidById,
      action: AuditAction.PAY,
      collectionName: 'expenses',
      recordId: expense.id,
      oldValues: { status: ExpenseStatus.APPROVED },
      newValues: {
        status: ExpenseStatus.PAID,
        paidAt: updatedExpense.paid_at,
        amount: expense.amount,
      },
    });

    return updatedExpense;
  }

  /**
   * Procède au décaissement effectif d'une échéance de charge fixe (après approbation).
   * Débite simultanément le solde physique de la caisse et le compartiment analytique concerné.
   */
  static async payFixedOccurrence(input: {
    occurrenceId: string;
    paymentMethod: PaymentMethod | string;
    paymentReference?: string;
    paidById: string;
  }) {
    await ensureAdminAuth();

    const occ = await pb.collection('fixed_expense_occurrences').getOne(input.occurrenceId, {
      expand: 'fixed_expense,fund_account',
    });

    if (occ.status === 'paid') {
      throw new Error('Cette échéance a déjà été réglée.');
    }
    if (occ.status !== 'approved') {
      throw new Error("Aucun décaissement sans autorisation : l'échéance doit d'abord être approuvée par le Leader Principal.");
    }

    const fund = (occ.expand as any)?.fund_account;
    if (!fund) {
      throw new Error('Compartiment analytique associé à l’échéance introuvable.');
    }

    if (fund.current_balance < occ.expected_amount) {
      throw new Error(
        `Solde insuffisant dans le fonds ${fund.name} (${fund.current_balance} FCFA disponible, ${occ.expected_amount} FCFA requis).`
      );
    }

    // 1. Débiter le fonds analytique
    const newFundBalance = fund.current_balance - occ.expected_amount;
    await pb.collection('fund_accounts').update(fund.id, {
      current_balance: newFundBalance,
    });

    // 2. Générer le numéro de dépense et créer l'enregistrement comptable
    const expNumber = await LedgerService.nextNumber('expenses', 'expense_number', 'DEP', 5);
    const fixedExpName = (occ.expand as any)?.fixed_expense?.name || 'Charge fixe';

    const expenseRecord = await pb.collection('expenses').create({
      expense_number: expNumber,
      expense_type: 'fixed',
      fixed_expense: occ.fixed_expense,
      fixed_occurrence: occ.id,
      category_name: (occ.expand as any)?.fixed_expense?.category || 'Charge fixe',
      fund_account: fund.id,
      amount: occ.expected_amount,
      beneficiary: (occ.expand as any)?.fixed_expense?.beneficiary || 'Fournisseur',
      purpose: `Règlement échéance du ${occ.due_date} - ${fixedExpName}`,
      expense_date: occ.due_date,
      status: ExpenseStatus.PAID,
      requested_by: input.paidById,
      approved_by: occ.approved_by || input.paidById,
      approved_at: occ.approved_at || new Date().toISOString(),
      paid_by: input.paidById,
      paid_at: new Date().toISOString(),
      payment_method: input.paymentMethod,
      payment_reference: input.paymentReference || '',
    });

    // 3. Écrire au grand livre
    const txNumber = await LedgerService.nextNumber('fund_transactions', 'transaction_number', 'TX', 6);

    await pb.collection('fund_transactions').create({
      transaction_number: txNumber,
      fund_account: fund.id,
      type: FundTransactionType.DEBIT_EXPENSE,
      direction: 'debit',
      amount: occ.expected_amount,
      balance_after: newFundBalance,
      related_expense: expenseRecord.id,
      description: `Règlement charge fixe ${fixedExpName} (${expNumber})`,
      created_by: input.paidById,
    });

    // 4. Mettre à jour l'occurrence
    const updatedOcc = await pb.collection('fixed_expense_occurrences').update(occ.id, {
      status: 'paid',
      paid_amount: occ.expected_amount,
      paid_at: new Date().toISOString(),
      payment_transaction: txNumber,
    });

    // 5. Piste d'audit
    await createAuditLog({
      userId: input.paidById,
      action: 'pay_fixed_occurrence',
      collectionName: 'fixed_expense_occurrences',
      recordId: occ.id,
      oldValues: { status: occ.status },
      newValues: {
        status: 'paid',
        paidAmount: occ.expected_amount,
        txNumber,
      },
    });

    return { occurrence: updatedOcc, expense: expenseRecord };
  }

  /**
   * Fournit la synthèse de la Trésorerie Unique Consolidée et la répartition analytique.
   */
  static async getConsolidatedTreasury(): Promise<ConsolidatedTreasury> {
    await ensureAdminAuth();

    const funds = await pb.collection('fund_accounts').getFullList({
      filter: 'is_active = true',
      sort: 'code',
    });

    // Somme consolidée
    const consolidatedPhysicalBalance = funds.reduce((acc, f) => acc + (f.current_balance || 0), 0);

    // Dépenses approuvées non encore payées
    const pendingApprovedExpenses = await pb.collection('expenses').getFullList({
      filter: `status = '${ExpenseStatus.APPROVED}'`,
    });
    // Échéances de charges fixes approuvées mais non encore réglées : également des engagements
    const approvedOccurrences = await pb
      .collection('fixed_expense_occurrences')
      .getFullList({ filter: `status = 'approved'` })
      .catch(() => [] as any[]);
    const pendingCommitmentsTotal =
      pendingApprovedExpenses.reduce((acc, e) => acc + (e.amount || 0), 0) +
      approvedOccurrences.reduce((acc, o) => acc + (o.expected_amount || 0), 0);

    const generalFund = funds.find((f) => f.code === FundAccountCode.GENERAL);
    const generalFundBalance = generalFund ? generalFund.current_balance : 0;
    const generalFundFreeBalance = generalFundBalance - pendingCommitmentsTotal;

    // Cumul des entrées par compartiment (progression des quêtes vers leur objectif)
    const credits = await pb
      .collection('fund_transactions')
      .getFullList({ filter: "direction = 'credit'", fields: 'fund_account,amount' })
      .catch(() => [] as any[]);
    const collectedByFund = new Map<string, number>();
    for (const t of credits) collectedByFund.set(t.fund_account, (collectedByFund.get(t.fund_account) || 0) + (t.amount || 0));

    const fundsBreakdown = funds.map((f) => {
      const balance = f.current_balance || 0;
      const percentageOfTotal = consolidatedPhysicalBalance > 0
        ? Math.round((balance / consolidatedPhysicalBalance) * 1000) / 10
        : 0;
      const collected = collectedByFund.get(f.id) || 0;
      return {
        account: {
          id: f.id,
          code: f.code as FundAccountCode,
          name: f.name,
          description: f.description,
          currentBalance: balance,
          isRestricted: f.is_restricted,
          isActive: f.is_active,
          kind: (f.kind || 'permanent') as 'permanent' | 'campaign',
          status: f.status || 'active',
          color: f.color || '',
          targetAmount: f.target_amount || 0,
          startDate: f.start_date || '',
          endDate: f.end_date || '',
          revenueCategoryId: f.revenue_category || '',
          created: f.created,
          updated: f.updated,
        },
        balance,
        percentageOfTotal,
        collected,
        campaign: campaignProgress(f, collected),
      };
    });

    return {
      consolidatedPhysicalBalance,
      funds: fundsBreakdown,
      pendingCommitmentsTotal,
      generalFundFreeBalance,
    };
  }
}

