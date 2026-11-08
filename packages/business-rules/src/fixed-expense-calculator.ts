import {
  FixedExpenseFrequency,
  FixedExpensesSummary,
  CoverageEvaluation,
  OccurrenceCoverageStatus,
  FundAccountCode,
} from '@eev/shared-types';

export interface FixedExpenseItem {
  id?: string;
  name?: string;
  amount: number;
  frequency: FixedExpenseFrequency | string;
  status?: string;
  dueDay?: number;
  startDate?: string;
  endDate?: string;
  fundAccountId?: string;
}

/**
 * Calcule l'équivalent mensuel de provision pour une charge selon sa périodicité.
 * Formule certifiée :
 * - Mensuelle : montant
 * - Hebdomadaire : montant * 52 / 12
 * - Trimestrielle : montant / 3
 * - Semestrielle : montant / 6
 * - Annuelle : montant / 12
 */
export function calculateMonthlyEquivalent(amount: number, frequency: FixedExpenseFrequency | string): number {
  if (amount <= 0) return 0;
  switch (frequency) {
    case 'weekly':
      return Math.round((amount * 52) / 12);
    case 'monthly':
      return Math.round(amount);
    case 'quarterly':
      return Math.round(amount / 3);
    case 'semiannual':
      return Math.round(amount / 6);
    case 'annual':
      return Math.round(amount / 12);
    default:
      return Math.round(amount);
  }
}

/**
 * Calcule les totaux et prévisions des charges fixes.
 */
export function calculateFixedExpenseTotals(
  expenses: FixedExpenseItem[],
  occurrences: Array<{ expectedAmount: number; status: string; paidAmount?: number }> = []
): FixedExpensesSummary {
  const activeExpenses = expenses.filter((e) => !e.status || e.status === 'active');

  let totalMonthlyFixed = 0;
  let totalQuarterlyFixed = 0;
  let totalAnnualFixed = 0;
  let monthlyEquivalentProvision = 0;

  for (const exp of activeExpenses) {
    const monthlyEq = calculateMonthlyEquivalent(exp.amount, exp.frequency);
    monthlyEquivalentProvision += monthlyEq;

    if (exp.frequency === 'monthly') {
      totalMonthlyFixed += exp.amount;
    } else if (exp.frequency === 'quarterly') {
      totalQuarterlyFixed += exp.amount;
    } else if (exp.frequency === 'annual') {
      totalAnnualFixed += exp.amount;
    }
  }

  // Totaux calculés depuis les occurrences
  let upcomingOccurrencesTotal = 0;
  let paidOccurrencesTotal = 0;
  let pendingOccurrencesTotal = 0;
  let overdueOccurrencesTotal = 0;

  for (const occ of occurrences) {
    if (occ.status === 'paid') {
      paidOccurrencesTotal += occ.paidAmount || occ.expectedAmount;
    } else if (occ.status === 'overdue') {
      overdueOccurrencesTotal += occ.expectedAmount;
      upcomingOccurrencesTotal += occ.expectedAmount;
    } else if (['pending', 'covered', 'partially_covered', 'uncovered', 'due_soon', 'approved'].includes(occ.status)) {
      pendingOccurrencesTotal += occ.expectedAmount;
      upcomingOccurrencesTotal += occ.expectedAmount;
    }
  }

  const totalEvaluated = upcomingOccurrencesTotal + paidOccurrencesTotal;
  const coverageRate = totalEvaluated > 0 ? Math.round((paidOccurrencesTotal / totalEvaluated) * 100) : 100;

  return {
    totalMonthlyFixed,
    totalQuarterlyFixed,
    totalAnnualFixed,
    monthlyEquivalentProvision,
    upcomingOccurrencesTotal,
    paidOccurrencesTotal,
    pendingOccurrencesTotal,
    overdueOccurrencesTotal,
    coverageRate,
  };
}

/**
 * Génère automatiquement les échéances à venir pour une charge fixe sans jamais créer de doublon.
 * Traitement strictement idempotent : si une date existe déjà dans existingDueDates, elle est ignorée.
 */
export function generateUpcomingOccurrences(
  expense: FixedExpenseItem,
  horizonMonths: number = 3,
  existingDueDates: string[] = []
): Array<{ dueDate: string; expectedAmount: number; fundAccountId: string }> {
  if (!expense.amount || expense.amount <= 0 || expense.status === 'suspended' || expense.status === 'archived') {
    return [];
  }

  const existingSet = new Set(existingDueDates);
  const results: Array<{ dueDate: string; expectedAmount: number; fundAccountId: string }> = [];

  const dueDay = Math.min(28, Math.max(1, expense.dueDay || 5));
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based

  if (expense.frequency === 'monthly') {
    for (let i = 0; i < horizonMonths; i++) {
      const targetMonth = currentMonth + i;
      const d = new Date(currentYear, targetMonth, dueDay);
      const isoDate = d.toISOString().split('T')[0];

      if (!existingSet.has(isoDate)) {
        results.push({
          dueDate: isoDate,
          expectedAmount: expense.amount,
          fundAccountId: expense.fundAccountId || '',
        });
      }
    }
  } else if (expense.frequency === 'quarterly') {
    // Tous les 3 mois
    for (let i = 0; i < horizonMonths; i += 3) {
      const targetMonth = currentMonth + i;
      const d = new Date(currentYear, targetMonth, dueDay);
      const isoDate = d.toISOString().split('T')[0];

      if (!existingSet.has(isoDate)) {
        results.push({
          dueDate: isoDate,
          expectedAmount: expense.amount,
          fundAccountId: expense.fundAccountId || '',
        });
      }
    }
  } else if (expense.frequency === 'annual') {
    // Une fois par an
    const d = new Date(currentYear, currentMonth, dueDay);
    const isoDate = d.toISOString().split('T')[0];
    if (!existingSet.has(isoDate)) {
      results.push({
        dueDate: isoDate,
        expectedAmount: expense.amount,
        fundAccountId: expense.fundAccountId || '',
      });
    }
  } else if (expense.frequency === 'weekly') {
    // Toutes les semaines
    for (let w = 0; w < horizonMonths * 4; w++) {
      const d = new Date(now.getTime() + w * 7 * 24 * 60 * 60 * 1000);
      const isoDate = d.toISOString().split('T')[0];
      if (!existingSet.has(isoDate)) {
        results.push({
          dueDate: isoDate,
          expectedAmount: expense.amount,
          fundAccountId: expense.fundAccountId || '',
        });
      }
    }
  }

  return results;
}

export interface ExpenseCoverageInput {
  expectedAmount: number;
  fundCode?: string;
  fundBalance: number;
  consolidatedPhysicalBalance: number;
  priorCommitments?: number;
}

/**
 * MOTEUR INTELLIGENT DE COUVERTURE DES CHARGES
 * 
 * RÈGLE D'OR :
 * 1. Vérifie simultanément la disponibilité physique des liquidités ET la disponibilité analytique du fonds autorisé.
 * 2. Les fonds affectés / restreints (Construction, Amis de Jésus) ont INTERDICTION formelle
 *    de financer les charges de fonctionnement courantes !
 * 3. Une provision analytique n'est JAMAIS une sortie physique de trésorerie.
 */
export function evaluateExpenseCoverage(input: ExpenseCoverageInput): CoverageEvaluation {
  const { expectedAmount, fundCode, fundBalance, consolidatedPhysicalBalance } = input;
  const priorCommitments = Math.max(0, input.priorCommitments || 0);

  // Règle des fonds affectés : si c'est un fonds restreint comme BUILDING ou FRIENDS_OF_JESUS
  // et que la charge est une charge d'exploitation, elle est déclarée non couverte.
  const isRestrictedOperatingCharge =
    fundCode === FundAccountCode.BUILDING || fundCode === FundAccountCode.FRIENDS_OF_JESUS;

  if (isRestrictedOperatingCharge) {
    return {
      isCovered: false,
      isPartiallyCovered: false,
      coverageStatus: 'uncovered',
      shortageAmount: expectedAmount,
      physicalCashAvailable: Math.max(0, consolidatedPhysicalBalance - priorCommitments),
      fundAvailable: 0, // 0 FCFA autorisé pour exploitation
      committedAmount: priorCommitments,
    };
  }

  const fundAvailable = Math.max(0, fundBalance - priorCommitments);
  const physicalCashAvailable = Math.max(0, consolidatedPhysicalBalance - priorCommitments);

  const effectiveAvailable = Math.min(fundAvailable, physicalCashAvailable);

  if (effectiveAvailable >= expectedAmount) {
    return {
      isCovered: true,
      isPartiallyCovered: false,
      coverageStatus: 'covered',
      shortageAmount: 0,
      physicalCashAvailable,
      fundAvailable,
      committedAmount: priorCommitments,
    };
  } else if (effectiveAvailable > 0) {
    return {
      isCovered: false,
      isPartiallyCovered: true,
      coverageStatus: 'partially_covered',
      shortageAmount: expectedAmount - effectiveAvailable,
      physicalCashAvailable,
      fundAvailable,
      committedAmount: priorCommitments,
    };
  } else {
    return {
      isCovered: false,
      isPartiallyCovered: false,
      coverageStatus: 'uncovered',
      shortageAmount: expectedAmount,
      physicalCashAvailable,
      fundAvailable,
      committedAmount: priorCommitments,
    };
  }
}

