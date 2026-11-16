import {
  AllocationRule,
  FundAccountCode,
} from '@eev/shared-types';

export interface AllocationSplitResult {
  allocations: {
    fundCode: FundAccountCode | string;
    amount: number;
    percentage: number;
    description: string;
  }[];
  totalAllocated: number;
  grossAmount: number;
}

/**
 * Calcule la ventilation d'une recette brute en FCFA.
 * Règle non négociable :
 * - Dîmes et Offrandes ordinaires : 10% Dîme des dîmes, 10% Aide, 80% Fonds Général.
 * - Fonds affectés : 100% alloué au fonds cible, 0% de prélèvement.
 * Précision exacte : pas de flottants pour les totaux, somme égale au centime/franc près.
 */
export function calculateEntryAllocations(
  grossAmount: number,
  rule: AllocationRule,
  targetFundCode?: FundAccountCode | string
): AllocationSplitResult {
  if (grossAmount < 0) {
    throw new Error('Le montant brut doit être positif ou nul.');
  }

  // Si montant zéro, retourne allocations à 0
  if (grossAmount === 0) {
    if (rule === AllocationRule.STANDARD_SPLIT_80_10_10) {
      return {
        grossAmount: 0,
        totalAllocated: 0,
        allocations: [
          { fundCode: FundAccountCode.TITHE_OF_TITHES, amount: 0, percentage: 10, description: '10% Dîme des dîmes' },
          { fundCode: FundAccountCode.WELFARE_AID, amount: 0, percentage: 10, description: '10% Aide' },
          { fundCode: FundAccountCode.GENERAL, amount: 0, percentage: 80, description: '80% Fonds général' },
        ],
      };
    } else {
      const code = targetFundCode || FundAccountCode.OTHER_DESIGNATED;
      return {
        grossAmount: 0,
        totalAllocated: 0,
        allocations: [{ fundCode: code, amount: 0, percentage: 100, description: '100% Affectation directe' }],
      };
    }
  }

  // Règle 1 : Ventilation ordinaire 80 / 10 / 10
  if (rule === AllocationRule.STANDARD_SPLIT_80_10_10) {
    const titheOfTithes = Math.floor((grossAmount * 10) / 100);
    const welfareAid = Math.floor((grossAmount * 10) / 100);
    // Le reliquat va au fonds général pour garantir que la somme = montant brut
    const generalFund = grossAmount - (titheOfTithes + welfareAid);

    const totalAllocated = titheOfTithes + welfareAid + generalFund;

    if (totalAllocated !== grossAmount) {
      throw new Error(`Incohérence de calcul: ${totalAllocated} != ${grossAmount}`);
    }

    return {
      grossAmount,
      totalAllocated,
      allocations: [
        {
          fundCode: FundAccountCode.TITHE_OF_TITHES,
          amount: titheOfTithes,
          percentage: 10,
          description: '10% Dîme des dîmes (prélèvement brut)',
        },
        {
          fundCode: FundAccountCode.WELFARE_AID,
          amount: welfareAid,
          percentage: 10,
          description: '10% Aide sociale (prélèvement brut)',
        },
        {
          fundCode: FundAccountCode.GENERAL,
          amount: generalFund,
          percentage: 80,
          description: '80% Fonds général (fonctionnement)',
        },
      ],
    };
  }

  // Règle 2 : Fonds affecté intégralement (100%)
  const destFund = targetFundCode || FundAccountCode.OTHER_DESIGNATED;
  return {
    grossAmount,
    totalAllocated: grossAmount,
    allocations: [
      {
        fundCode: destFund,
        amount: grossAmount,
        percentage: 100,
        description: 'Affectation directe intégrale (0% prélèvement)',
      },
    ],
  };
}

/**
 * Valide un transfert interne analytique entre deux compartiments.
 * Un transfert interne ne modifie JAMAIS le solde global de la caisse physique.
 */
export function validateInternalTransfer(
  sourceFundCode: string,
  destFundCode: string,
  amount: number,
  sourceCurrentBalance: number
): { valid: boolean; error?: string } {
  if (sourceFundCode === destFundCode) {
    return { valid: false, error: 'Le fonds source et le fonds destination doivent être distincts.' };
  }
  if (amount <= 0) {
    return { valid: false, error: 'Le montant du transfert doit être strictement supérieur à 0 FCFA.' };
  }
  if (sourceCurrentBalance < amount) {
    return {
      valid: false,
      error: `Solde insuffisant sur le fonds source (${sourceCurrentBalance} FCFA disponible, ${amount} FCFA demandé).`,
    };
  }
  return { valid: true };
}

export interface CashCountBreakdown {
  // Billets FCFA (CEMAC)
  b10000?: number; // 10 000 FCFA
  b5000?: number;  // 5 000 FCFA
  b2000?: number;  // 2 000 FCFA
  b1000?: number;  // 1 000 FCFA
  b500?: number;   // 500 FCFA
  // Pièces FCFA (CEMAC)
  c500?: number;   // 500 FCFA
  c100?: number;   // 100 FCFA
  c50?: number;    // 50 FCFA
  c25?: number;    // 25 FCFA
  // Autres avoirs de caisse
  mobileMoneyAmount?: number;
  bankTransfersAmount?: number;
  checksAmount?: number;
}

export interface CashReconciliationResult {
  physicalCashTotal: number;
  electronicAndChecksTotal: number;
  grandTotalCounted: number;
  theoreticalBalance: number;
  discrepancy: number; // grandTotalCounted - theoreticalBalance
  status: 'balanced' | 'surplus' | 'shortage';
  statusLabel: string;
}

/**
 * Calcule le dénombrement physique (billetage) et le rapprochement avec le solde théorique de caisse.
 */
export function calculateCashReconciliation(
  count: CashCountBreakdown,
  theoreticalBalance: number
): CashReconciliationResult {
  const b10k = (count.b10000 || 0) * 10000;
  const b5k = (count.b5000 || 0) * 5000;
  const b2k = (count.b2000 || 0) * 2000;
  const b1k = (count.b1000 || 0) * 1000;
  const b500 = (count.b500 || 0) * 500;

  const c500 = (count.c500 || 0) * 500;
  const c100 = (count.c100 || 0) * 100;
  const c50 = (count.c50 || 0) * 50;
  const c25 = (count.c25 || 0) * 25;

  const physicalCashTotal = b10k + b5k + b2k + b1k + b500 + c500 + c100 + c50 + c25;
  const electronicAndChecksTotal =
    (count.mobileMoneyAmount || 0) + (count.bankTransfersAmount || 0) + (count.checksAmount || 0);

  const grandTotalCounted = physicalCashTotal + electronicAndChecksTotal;
  const discrepancy = grandTotalCounted - theoreticalBalance;

  let status: 'balanced' | 'surplus' | 'shortage' = 'balanced';
  let statusLabel = 'Caisse Juste (Écart nul)';

  if (discrepancy > 0) {
    status = 'surplus';
    statusLabel = `Excédent de caisse (+${discrepancy} FCFA)`;
  } else if (discrepancy < 0) {
    status = 'shortage';
    statusLabel = `Manquant de caisse (${discrepancy} FCFA)`;
  }

  return {
    physicalCashTotal,
    electronicAndChecksTotal,
    grandTotalCounted,
    theoreticalBalance,
    discrepancy,
    status,
    statusLabel,
  };
}

