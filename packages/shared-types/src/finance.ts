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

