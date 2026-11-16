import {
  FundAccountCode,
  AllocationRule,
  FinancialEntryStatus,
  ExpenseStatus,
  FundTransactionType,
  PaymentMethod,
} from './enums.js';

export interface FundAccount {
  id: string;
  code: FundAccountCode;
  name: string;
  description?: string;
  currentBalance: number; // In FCFA integer (exact amount)
  isRestricted: boolean; // True for designated funds (building, welfare, tithe of tithes, etc.)
  isActive: boolean;
  created: string;
  updated: string;
}

export interface FinancialCategory {
  id: string;
  code: string;
  name: string;
  allocationRule: AllocationRule;
  targetFundAccountId?: string; // Set when allocationRule === DIRECT_ALLOCATED
  description?: string;
  isActive: boolean;
}

export interface FinancialEntry {
  id: string;
  entryNumber: string;
  serviceId?: string;
  categoryId: string;
  amount: number; // Gross amount in FCFA integer
  paymentMethod: PaymentMethod;
  reference?: string;
  donorName?: string;
  notes?: string;
  collectedAt: string;
  status: FinancialEntryStatus;
  createdById: string;
  created: string;
  updated: string;
}

export interface FundAllocation {
  id: string;
  financialEntryId: string;
  fundAccountId: string;
  amount: number; // Exact amount allocated in FCFA
  percentage: number; // 80, 10, or 100
  created: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  categoryId: string;
  fundAccountId: string; // The analytical fund debited (General fund for operating costs)
  amount: number; // In FCFA
  beneficiary: string;
  purpose: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  requestedById: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  paidAt?: string;
  paidById?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  created: string;
  updated: string;
}

export interface FundTransaction {
  id: string;
  transactionNumber: string;
  fundAccountId: string;
  type: FundTransactionType;
  amount: number; // Always positive magnitude
  direction: 'credit' | 'debit';
  balanceAfter: number;
  relatedEntryId?: string;
  relatedExpenseId?: string;
  relatedTransferId?: string;
  description: string;
  createdById: string;
  created: string;
}

export interface InternalTransfer {
  id: string;
  transferNumber: string;
  sourceFundId: string;
  destinationFundId: string;
  amount: number;
  reason: string;
  authorizedById: string;
  created: string;
}

/**
 * Single Consolidated Physical Cash Box vs Analytical Compartments
 */
export interface ConsolidatedTreasury {
  /**
   * Consolidated Physical Balance (Total real cash/bank in the ministry's possession)
   * Formule : Sum of all analytical fund account balances
   */
  consolidatedPhysicalBalance: number;
  
  /**
   * Analytical Funds breakdown
   */
  funds: {
    account: FundAccount;
    balance: number;
    percentageOfTotal: number;
  }[];

  /**
   * Pending commitments (expenses approved but not yet paid)
   */
  pendingCommitmentsTotal: number;
  
  /**
   * General fund free / uncommitted balance
   */
  generalFundFreeBalance: number;
}

export type FixedExpenseFrequency = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom';
export type FixedExpenseStatus = 'active' | 'suspended' | 'archived';

export interface FixedExpense {
  id: string;
  name: string;
  category: string;
  description?: string;
  amount: number;
  currency: string;
  frequency: FixedExpenseFrequency;
  dueDay?: number;
  startDate: string;
  endDate?: string;
  fundAccountId: string;
  beneficiary: string;
  responsibleUserId?: string;
  paymentMethod?: string;
  status: FixedExpenseStatus;
  notes?: string;
  createdById?: string;
  created?: string;
  updated?: string;
}

export type OccurrenceStatus = 'pending' | 'due_soon' | 'overdue' | 'approved' | 'paid' | 'cancelled';
export type OccurrenceCoverageStatus = 'covered' | 'partially_covered' | 'uncovered';

export interface FixedExpenseOccurrence {
  id: string;
  fixedExpenseId: string;
  dueDate: string;
  expectedAmount: number;
  fundAccountId: string;
  status: OccurrenceStatus;
  reservedAmount: number;
  paidAmount: number;
  coverageStatus?: OccurrenceCoverageStatus;
  generatedAt?: string;
  approvedById?: string;
  approvedAt?: string;
  paidAt?: string;
  paymentTransaction?: string;
  notes?: string;
  fixedExpense?: FixedExpense;
}

export interface ExpenseBudget {
  id: string;
  category: string;
  amount: number;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  fundAccountId?: string;
  alertThreshold: number;
  status: 'active' | 'closed';
  spentAmount?: number;
  remainingAmount?: number;
  consumptionRate?: number;
}

export interface FixedExpensesSummary {
  totalMonthlyFixed: number;
  totalQuarterlyFixed: number;
  totalAnnualFixed: number;
  monthlyEquivalentProvision: number;
  upcomingOccurrencesTotal: number;
  paidOccurrencesTotal: number;
  pendingOccurrencesTotal: number;
  overdueOccurrencesTotal: number;
  coverageRate: number;
}

export interface CoverageEvaluation {
  isCovered: boolean;
  isPartiallyCovered: boolean;
  coverageStatus: OccurrenceCoverageStatus;
  shortageAmount: number;
  physicalCashAvailable: number;
  fundAvailable: number;
  committedAmount: number;
}

