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

/** Une ligne de la règle de ventilation des recettes ordinaires (paramétrable par église). */
export interface SplitRuleLine {
  fundCode: string;
  percentage: number;
  label?: string;
}

/** Règle par défaut : 10 % Dîme des dîmes, 10 % Aide sociale, le reliquat (80 %) au Fonds général. */
export const DEFAULT_SPLIT_RULE: SplitRuleLine[] = [
  { fundCode: FundAccountCode.TITHE_OF_TITHES, percentage: 10, label: 'Dîme des dîmes' },
  { fundCode: FundAccountCode.WELFARE_AID, percentage: 10, label: 'Aide sociale' },
  { fundCode: FundAccountCode.GENERAL, percentage: 80, label: 'Fonds général' },
];
export const DEFAULT_REMAINDER_FUND = FundAccountCode.GENERAL as string;

/**
 * Vérifie qu'une règle de ventilation est exploitable : pourcentages entiers positifs, total de 100 %,
 * compartiments distincts, et compartiment du reliquat présent dans la règle.
 */
export function validateSplitRule(split: SplitRuleLine[], remainderFund: string): { valid: boolean; error?: string } {
  if (!Array.isArray(split) || split.length === 0) {
    return { valid: false, error: 'La règle de ventilation doit contenir au moins un compartiment.' };
  }
  const codes = new Set<string>();
  let total = 0;
  for (const line of split) {
    if (!line.fundCode) return { valid: false, error: 'Chaque ligne doit désigner un compartiment.' };
    if (codes.has(line.fundCode)) return { valid: false, error: `Le compartiment ${line.fundCode} apparaît deux fois.` };
    codes.add(line.fundCode);
    if (!Number.isInteger(line.percentage) || line.percentage < 0 || line.percentage > 100) {
      return { valid: false, error: 'Les pourcentages doivent être des entiers entre 0 et 100.' };
    }
    total += line.percentage;
  }
  if (total !== 100) return { valid: false, error: `Le total de la ventilation doit faire 100 % (actuellement ${total} %).` };
  if (!codes.has(remainderFund)) {
    return { valid: false, error: 'Le compartiment qui reçoit le reliquat doit faire partie de la ventilation.' };
  }
  return { valid: true };
}

/**
 * Calcule la ventilation d'une recette brute (montants entiers).
 * - Recettes ordinaires (règle standard) : chaque compartiment reçoit sa part arrondie à l'inférieur,
 *   le compartiment du reliquat reçoit le complément pour que la somme soit exactement le montant brut.
 *   La règle est paramétrable par église (par défaut 80 / 10 / 10).
 * - Fonds affectés : 100 % alloué au fonds cible, 0 % de prélèvement.
 */
export function calculateEntryAllocations(
  grossAmount: number,
  rule: AllocationRule,
  targetFundCode?: FundAccountCode | string,
  split: SplitRuleLine[] = DEFAULT_SPLIT_RULE,
  remainderFund: string = DEFAULT_REMAINDER_FUND
): AllocationSplitResult {
  if (grossAmount < 0) {
    throw new Error('Le montant brut doit être positif ou nul.');
  }

  if (rule === AllocationRule.STANDARD_SPLIT_80_10_10) {
    const check = validateSplitRule(split, remainderFund);
    if (!check.valid) throw new Error(check.error);

    const others = split.filter((l) => l.fundCode !== remainderFund);
    const remainderLine = split.find((l) => l.fundCode === remainderFund)!;
    const parts = others.map((l) => ({ line: l, amount: Math.floor((grossAmount * l.percentage) / 100) }));
    const remainderAmount = grossAmount - parts.reduce((s, p) => s + p.amount, 0);

    const allocations = [
      ...parts.map((p) => ({
        fundCode: p.line.fundCode,
        amount: p.amount,
        percentage: p.line.percentage,
        description: `${p.line.percentage}% ${p.line.label || p.line.fundCode} (prélèvement brut)`,
      })),
      {
        fundCode: remainderLine.fundCode,
        amount: remainderAmount,
        percentage: remainderLine.percentage,
        description: `${remainderLine.percentage}% ${remainderLine.label || remainderLine.fundCode} (reliquat)`,
      },
    ];
    const totalAllocated = allocations.reduce((s, a) => s + a.amount, 0);
    if (totalAllocated !== grossAmount) {
      throw new Error(`Incohérence de calcul: ${totalAllocated} != ${grossAmount}`);
    }
    return { grossAmount, totalAllocated, allocations };
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
    return { valid: false, error: 'Le montant du transfert doit être strictement supérieur à 0.' };
  }
  if (sourceCurrentBalance < amount) {
    return {
      valid: false,
      error: `Solde insuffisant sur le fonds source (${sourceCurrentBalance} disponible, ${amount} demandé).`,
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
    statusLabel = `Excédent de caisse (+${discrepancy})`;
  } else if (discrepancy < 0) {
    status = 'shortage';
    statusLabel = `Manquant de caisse (${discrepancy})`;
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

