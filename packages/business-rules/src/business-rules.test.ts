import { describe, it, expect } from 'vitest';
import {
  calculateEntryAllocations,
  validateInternalTransfer,
  calculateAttendanceTotal,
  canTransitionExpense,
  PERMISSIONS_MATRIX,
  calculateCashReconciliation,
} from './index.js';
import {
  AllocationRule,
  FundAccountCode,
  ExpenseStatus,
  UserRole,
} from '@eev/shared-types';

describe('Scénarios Financiers et Règles Métier EEV', () => {
  it('Scénario 1 : Recette ordinaire de 100 000 FCFA génère 10k dîme, 10k aide, 80k fonds général', () => {
    const result = calculateEntryAllocations(100000, AllocationRule.STANDARD_SPLIT_80_10_10);
    expect(result.grossAmount).toBe(100000);
    expect(result.totalAllocated).toBe(100000);

    const titheOfTithes = result.allocations.find((a) => a.fundCode === FundAccountCode.TITHE_OF_TITHES);
    const welfareAid = result.allocations.find((a) => a.fundCode === FundAccountCode.WELFARE_AID);
    const generalFund = result.allocations.find((a) => a.fundCode === FundAccountCode.GENERAL);

    expect(titheOfTithes?.amount).toBe(10000);
    expect(welfareAid?.amount).toBe(10000);
    expect(generalFund?.amount).toBe(80000);
  });

  it('Scénario 2 : Don affecté (construction) de 100 000 FCFA génère 100 000 FCFA intégral sans prélèvement', () => {
    const result = calculateEntryAllocations(100000, AllocationRule.DIRECT_ALLOCATED, FundAccountCode.BUILDING);
    expect(result.grossAmount).toBe(100000);
    expect(result.totalAllocated).toBe(100000);
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].fundCode).toBe(FundAccountCode.BUILDING);
    expect(result.allocations[0].amount).toBe(100000);
    expect(result.allocations[0].percentage).toBe(100);
  });

  it('Scénario 6 : Transfert interne entre deux fonds sans changer le solde global', () => {
    // Cas valide
    const valid = validateInternalTransfer(FundAccountCode.GENERAL, FundAccountCode.BUILDING, 20000, 50000);
    expect(valid.valid).toBe(true);

    // Cas invalide : même compte
    const sameAccount = validateInternalTransfer(FundAccountCode.GENERAL, FundAccountCode.GENERAL, 20000, 50000);
    expect(sameAccount.valid).toBe(false);

    // Cas invalide : solde insuffisant
    const insufficient = validateInternalTransfer(FundAccountCode.GENERAL, FundAccountCode.BUILDING, 60000, 50000);
    expect(insufficient.valid).toBe(false);
  });

  it('Scénario 7 : Les nouveaux visiteurs ne doivent JAMAIS être ajoutés au total de fréquentation', () => {
    const stats = calculateAttendanceTotal({
      menCount: 120,
      womenCount: 150,
      youthCount: 80,
      childrenCount: 50,
      newVisitorsCount: 25,
      salvationsCount: 10,
    });

    // Total = 120 + 150 + 80 + 50 = 400
    expect(stats.totalAttendance).toBe(400);
    // Nouveaux visiteurs reste à 25 de manière indépendante
    expect(stats.newVisitorsCount).toBe(25);
    expect(stats.salvationsCount).toBe(10);
  });

  it("Scénario 4 & 5 : Workflow dépense - seul le leader approuve et une dépense non approuvée ne peut être payée", () => {
    // 1. Passage de DRAFT à PENDING_APPROVAL
    const toPending = canTransitionExpense(ExpenseStatus.DRAFT, ExpenseStatus.PENDING_APPROVAL, UserRole.FINANCE_LEAD);
    expect(toPending.allowed).toBe(true);

    // 2. Le caissier ou finance lead tente d'approuver -> REFUSÉ
    const cashierApprove = canTransitionExpense(ExpenseStatus.PENDING_APPROVAL, ExpenseStatus.APPROVED, UserRole.CASHIER);
    expect(cashierApprove.allowed).toBe(false);

    // 3. Le Leader principal approuve -> ACCEPTÉ
    const leaderApprove = canTransitionExpense(ExpenseStatus.PENDING_APPROVAL, ExpenseStatus.APPROVED, UserRole.LEAD_PASTOR);
    expect(leaderApprove.allowed).toBe(true);

    // 4. Tentative de paiement d'une dépense encore PENDING_APPROVAL -> REFUSÉ
    const payPending = canTransitionExpense(ExpenseStatus.PENDING_APPROVAL, ExpenseStatus.PAID, UserRole.FINANCE_LEAD);
    expect(payPending.allowed).toBe(false);

    // 5. Paiement d'une dépense APPROVED par le service financier -> ACCEPTÉ
    const payApproved = canTransitionExpense(ExpenseStatus.APPROVED, ExpenseStatus.PAID, UserRole.FINANCE_LEAD);
    expect(payApproved.allowed).toBe(true);
  });

  it('Scénario 10 : Matrice des permissions et séparation stricte des fonctions', () => {
    // Agent protocole ne peut pas toucher aux finances
    expect(PERMISSIONS_MATRIX[UserRole.PROTOCOL_AGENT].canCreateFinancialEntry).toBe(false);
    expect(PERMISSIONS_MATRIX[UserRole.PROTOCOL_AGENT].canCreateExpense).toBe(false);
    expect(PERMISSIONS_MATRIX[UserRole.PROTOCOL_AGENT].canApproveExpense).toBe(false);

    // Caissier ne peut pas approuver les dépenses ni voir le dashboard leader
    expect(PERMISSIONS_MATRIX[UserRole.CASHIER].canApproveExpense).toBe(false);
    expect(PERMISSIONS_MATRIX[UserRole.CASHIER].canViewDashboardLeader).toBe(false);

    // Auditeur n'a aucun droit d'écriture financière mais consultation
    expect(PERMISSIONS_MATRIX[UserRole.AUDITOR].canCreateFinancialEntry).toBe(false);
    expect(PERMISSIONS_MATRIX[UserRole.AUDITOR].canCreateExpense).toBe(false);
    expect(PERMISSIONS_MATRIX[UserRole.AUDITOR].canViewAuditLogs).toBe(true);
  });

  it('Scénario 11 : Dénombrement physique (billetage) et rapprochement de caisse avec détection des écarts', () => {
    // 5 billets de 10 000 (50k) + 4 billets de 5 000 (20k) + 10 billets de 2 000 (20k) + 10 pièces de 500 (5k) + 50k Mobile Money = 145 000 FCFA
    const count = {
      b10000: 5,
      b5000: 4,
      b2000: 10,
      c500: 10,
      mobileMoneyAmount: 50000,
    };

    // Cas 1 : Caisse parfaitement juste
    const resBalanced = calculateCashReconciliation(count, 145000);
    expect(resBalanced.physicalCashTotal).toBe(95000);
    expect(resBalanced.electronicAndChecksTotal).toBe(50000);
    expect(resBalanced.grandTotalCounted).toBe(145000);
    expect(resBalanced.discrepancy).toBe(0);
    expect(resBalanced.status).toBe('balanced');

    // Cas 2 : Manquant de caisse (solde théorique = 150 000, compté = 145 000 -> manquant de -5 000)
    const resShortage = calculateCashReconciliation(count, 150000);
    expect(resShortage.discrepancy).toBe(-5000);
    expect(resShortage.status).toBe('shortage');

    // Cas 3 : Excédent de caisse (solde théorique = 140 000, compté = 145 000 -> excédent de +5 000)
    const resSurplus = calculateCashReconciliation(count, 140000);
    expect(resSurplus.discrepancy).toBe(5000);
    expect(resSurplus.status).toBe('surplus');
  });
});

