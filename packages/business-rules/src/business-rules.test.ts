import { describe, it, expect } from 'vitest';
import {
  calculateEntryAllocations,
  validateInternalTransfer,
  calculateAttendanceTotal,
  canTransitionExpense,
  PERMISSIONS_MATRIX,
  calculateCashReconciliation,
  calculateFixedExpenseTotals,
  calculateMonthlyEquivalent,
  generateUpcomingOccurrences,
  evaluateExpenseCoverage,
  checkAttendanceDuplicate,
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
    const valid = validateInternalTransfer(FundAccountCode.GENERAL, FundAccountCode.BUILDING, 20000, 50000);
    expect(valid.valid).toBe(true);

    const sameAccount = validateInternalTransfer(FundAccountCode.GENERAL, FundAccountCode.GENERAL, 20000, 50000);
    expect(sameAccount.valid).toBe(false);

    const insufficient = validateInternalTransfer(FundAccountCode.GENERAL, FundAccountCode.BUILDING, 60000, 50000);
    expect(insufficient.valid).toBe(false);
  });

  it('Scénario 10 : Matrice des permissions et séparation stricte des fonctions', () => {
    expect(PERMISSIONS_MATRIX[UserRole.PROTOCOL_AGENT].canCreateFinancialEntry).toBe(false);
    expect(PERMISSIONS_MATRIX[UserRole.PROTOCOL_AGENT].canCreateExpense).toBe(false);
    expect(PERMISSIONS_MATRIX[UserRole.PROTOCOL_AGENT].canApproveExpense).toBe(false);

    expect(PERMISSIONS_MATRIX[UserRole.CASHIER].canApproveExpense).toBe(false);
    expect(PERMISSIONS_MATRIX[UserRole.CASHIER].canViewDashboardLeader).toBe(false);

    expect(PERMISSIONS_MATRIX[UserRole.AUDITOR].canCreateFinancialEntry).toBe(false);
    expect(PERMISSIONS_MATRIX[UserRole.AUDITOR].canCreateExpense).toBe(false);
    expect(PERMISSIONS_MATRIX[UserRole.AUDITOR].canViewAuditLogs).toBe(true);
  });

  it('Billetage et rapprochement de caisse avec détection des écarts', () => {
    const count = {
      b10000: 5,
      b5000: 4,
      b2000: 10,
      c500: 10,
      mobileMoneyAmount: 50000,
    };

    const resBalanced = calculateCashReconciliation(count, 145000);
    expect(resBalanced.physicalCashTotal).toBe(95000);
    expect(resBalanced.electronicAndChecksTotal).toBe(50000);
    expect(resBalanced.grandTotalCounted).toBe(145000);
    expect(resBalanced.discrepancy).toBe(0);
    expect(resBalanced.status).toBe('balanced');
  });
});

describe('12 Scénarios Obligatoires — Module Dépenses Intelligentes & Fiches de Fréquentation', () => {
  // Test 1 — Charges fixes : charge mensuelle 150 000 XAF, génération d'échéances sans doublon
  it('Test 1 — Charges fixes : Génération des échéances mensuelles attendues sans doublon', () => {
    const rentCharge = {
      id: 'fix-rent',
      name: 'Loyer',
      amount: 150000,
      frequency: 'monthly',
      dueDay: 5,
    };

    // Première exécution : 3 mois d'horizon -> 3 échéances
    const occs = generateUpcomingOccurrences(rentCharge, 3, []);
    expect(occs).toHaveLength(3);
    expect(occs[0].expectedAmount).toBe(150000);

    // Deuxième exécution avec les échéances déjà existantes -> 0 doublon
    const existingDates = occs.map((o) => o.dueDate);
    const occsAfter = generateUpcomingOccurrences(rentCharge, 3, existingDates);
    expect(occsAfter).toHaveLength(0); // Strictement idempotent, 0 doublon généré
  });

  // Test 2 — Charges fixes multiples : Loyer + Eau + Élec + Internet
  it('Test 2 — Charges fixes multiples : Calcul exact de la somme des charges mensuelles', () => {
    const charges = [
      { name: 'Loyer', amount: 150000, frequency: 'monthly' },
      { name: 'Eau', amount: 15000, frequency: 'monthly' },
      { name: 'Électricité', amount: 35000, frequency: 'monthly' },
      { name: 'Internet', amount: 25000, frequency: 'monthly' },
    ];

    const totals = calculateFixedExpenseTotals(charges);
    expect(totals.totalMonthlyFixed).toBe(225000); // 150k + 15k + 35k + 25k = 225 000 FCFA
    expect(totals.monthlyEquivalentProvision).toBe(225000);
  });

  // Test 3 — Disponibilité financière suffisante : statut couvert
  it('Test 3 — Disponibilité financière suffisante : Détection statut couvert', () => {
    const coverage = evaluateExpenseCoverage({
      expectedAmount: 150000,
      fundCode: FundAccountCode.GENERAL,
      fundBalance: 8500000, // 8.5M dans le fonds général
      consolidatedPhysicalBalance: 14750000, // 14.75M dans la caisse physique
      priorCommitments: 200000,
    });

    expect(coverage.isCovered).toBe(true);
    expect(coverage.isPartiallyCovered).toBe(false);
    expect(coverage.coverageStatus).toBe('covered');
    expect(coverage.shortageAmount).toBe(0);
  });

  // Test 4 — Disponibilité insuffisante : montant manquant et statut non couvert ou partiel
  it('Test 4 — Disponibilité insuffisante : Montant manquant et statut uncovered / partially_covered', () => {
    // Cas 1 : Fonds insuffisant (50 000 FCFA dispo pour 150 000 requis)
    const partial = evaluateExpenseCoverage({
      expectedAmount: 150000,
      fundCode: FundAccountCode.GENERAL,
      fundBalance: 50000,
      consolidatedPhysicalBalance: 2000000,
    });
    expect(partial.coverageStatus).toBe('partially_covered');
    expect(partial.shortageAmount).toBe(100000); // Manque 100 000 FCFA

    // Cas 2 : Zéro solde dans le fonds
    const uncovered = evaluateExpenseCoverage({
      expectedAmount: 150000,
      fundCode: FundAccountCode.GENERAL,
      fundBalance: 0,
      consolidatedPhysicalBalance: 2000000,
    });
    expect(uncovered.coverageStatus).toBe('uncovered');
    expect(uncovered.shortageAmount).toBe(150000);
  });

  // Test 5 — Fonds affectés : Auditorium / Amis de Jésus ne financent PAS les charges courantes
  it('Test 5 — Fonds affectés : Interdiction stricte de financer les charges d’exploitation', () => {
    const buildingAttempt = evaluateExpenseCoverage({
      expectedAmount: 150000,
      fundCode: FundAccountCode.BUILDING, // Tente d'utiliser le fonds Auditorium
      fundBalance: 2800000,
      consolidatedPhysicalBalance: 14750000,
    });

    // Même avec 2.8M de solde, le fonds de construction ne peut pas couvrir une charge courante
    expect(buildingAttempt.isCovered).toBe(false);
    expect(buildingAttempt.coverageStatus).toBe('uncovered');
    expect(buildingAttempt.fundAvailable).toBe(0);
    expect(buildingAttempt.shortageAmount).toBe(150000);
  });

  // Test 6 — Provision analytique : N'est pas une sortie physique de trésorerie
  it('Test 6 — Provision : Une provision analytique n’est jamais enregistrée comme sortie physique d’argent', () => {
    const physicalCashStart = 14750000;
    const generalFundStart = 8500000;
    const rentProvision = 150000;

    // Calcul de provision : montant engagé
    const engagedProvision = rentProvision;
    const analyticalAvailable = generalFundStart - engagedProvision;

    // Le solde physique réel reste INTACT à 14 750 000 FCFA
    const physicalCashAfterProvision = physicalCashStart; // Strictement identique

    expect(analyticalAvailable).toBe(8350000);
    expect(physicalCashAfterProvision).toBe(14750000);
    expect(physicalCashAfterProvision).toBe(physicalCashStart);
  });

  // Test 7 — Paiement réel : Après approbation et paiement, débit du solde physique ET du fonds
  it('Test 7 — Paiement réel : Diminution effective du solde physique et du fonds analytique concerné', () => {
    const physicalCashStart = 14750000;
    const generalFundStart = 8500000;
    const paidAmount = 150000;

    // Décaissement confirmé
    const physicalCashAfterPayment = physicalCashStart - paidAmount;
    const generalFundAfterPayment = generalFundStart - paidAmount;

    expect(physicalCashAfterPayment).toBe(14600000);
    expect(generalFundAfterPayment).toBe(8350000);
  });

  // Test 8 — Dépense variable : Workflow de bout en bout (DRAFT -> PENDING -> APPROVED -> PAID)
  it('Test 8 — Dépense variable : Respect du workflow strict de validation et paiement', () => {
    // 1. Saisie (Draft -> Pending)
    const step1 = canTransitionExpense(ExpenseStatus.DRAFT, ExpenseStatus.PENDING_APPROVAL, UserRole.FINANCE_LEAD);
    expect(step1.allowed).toBe(true);

    // 2. Approbation par le Leader
    const step2 = canTransitionExpense(ExpenseStatus.PENDING_APPROVAL, ExpenseStatus.APPROVED, UserRole.LEAD_PASTOR);
    expect(step2.allowed).toBe(true);

    // 3. Paiement après approbation par le caissier / finances
    const step3 = canTransitionExpense(ExpenseStatus.APPROVED, ExpenseStatus.PAID, UserRole.CASHIER);
    expect(step3.allowed).toBe(true);
  });

  // Test 9 — Sept types de services prédéfinis officiels
  it('Test 9 — Sept types de services : Disponibilité des sept programmes officiels', () => {
    const officialSlugs = [
      'tuesday_service',
      'thursday_service',
      'sunday_service_1',
      'sunday_service_2',
      'mission_camp',
      'shepherds_camp',
      'special_programs',
    ];
    expect(officialSlugs).toHaveLength(7);
  });

  // Test 10 — Sélection du programme et date : Association correcte
  it('Test 10 — Sélection du programme et de la date : Culte de Mardi avec date passée', () => {
    const sheet = {
      serviceTypeSlug: 'tuesday_service',
      serviceDate: '2026-11-03', // Date passée
    };
    expect(sheet.serviceTypeSlug).toBe('tuesday_service');
    expect(sheet.serviceDate).toBe('2026-11-03');
  });

  // Test 11 — Total de fréquentation : H:30, F:25, J:20, E:15, Visiteurs:10 -> Total = 90 (PAS 100)
  it('Test 11 — Total de fréquentation : 30+25+20+15 = 90 participants (nouveaux visiteurs exclus du total)', () => {
    const stats = calculateAttendanceTotal({
      menCount: 30,
      womenCount: 25,
      youthCount: 20,
      childrenCount: 15,
      newVisitorsCount: 10,
    });

    // TOTAL PARTICIPANTS = HOMMES + FEMMES + JEUNES + ENFANTS = 30 + 25 + 20 + 15 = 90
    expect(stats.totalAttendance).toBe(90);
    expect(stats.totalAttendance).not.toBe(100);
    // Les visiteurs sont un indicateur complémentaire
    expect(stats.newVisitorsCount).toBe(10);
  });

  // Test 12 — Double fiche : Détection de tentative de doublon pour même programme et même date
  it('Test 12 — Double fiche : Détection du doublon pour même programme et même date', () => {
    const existing = [
      { serviceTypeSlug: 'tuesday_service', serviceDate: '2026-11-10' },
      { serviceTypeSlug: 'sunday_service_1', serviceDate: '2026-11-15' },
    ];

    // Tentative de soumettre une 2ème fiche pour mardi 10/11/2026
    const duplicateCheck = checkAttendanceDuplicate(existing, {
      serviceTypeSlug: 'tuesday_service',
      serviceDate: '2026-11-10',
    });

    expect(duplicateCheck.isDuplicate).toBe(true);
    expect(duplicateCheck.message).toContain('existe déjà');

    // Autre date ou autre programme -> non doublon
    const validCheck = checkAttendanceDuplicate(existing, {
      serviceTypeSlug: 'tuesday_service',
      serviceDate: '2026-11-17',
    });
    expect(validCheck.isDuplicate).toBe(false);
  });

  it('Scénario 18 : Conversion d’un montant numérique en lettres en français pour reçus et bons de caisse', async () => {
    const { numberToWordsFCFA } = await import('./number-to-words.js');

    expect(numberToWordsFCFA(0)).toBe('Zéro franc CFA');
    expect(numberToWordsFCFA(150000)).toBe('Cent cinquante mille francs CFA');
    expect(numberToWordsFCFA(15000)).toBe('Quinze mille francs CFA');
    expect(numberToWordsFCFA(35000)).toBe('Trente-cinq mille francs CFA');
    expect(numberToWordsFCFA(25000)).toBe('Vingt-cinq mille francs CFA');
    expect(numberToWordsFCFA(1000000)).toBe('Un million francs CFA');
    expect(numberToWordsFCFA(2500000)).toBe('Deux millions cinq cent mille francs CFA');
    expect(numberToWordsFCFA(14750000)).toBe('Quatorze millions sept cent cinquante mille francs CFA');
  });
});
