export enum UserRole {
  ADMIN = 'admin',
  LEAD_PASTOR = 'lead_pastor',
  PROTOCOL_LEAD = 'protocol_lead',
  PROTOCOL_AGENT = 'protocol_agent',
  FINANCE_LEAD = 'finance_lead',
  CASHIER = 'cashier',
  AUDITOR = 'auditor',
}

export enum ServiceType {
  SUNDAY_SERVICE = 'sunday_service',
  TUESDAY_PROGRAM = 'tuesday_program',
  THURSDAY_PROGRAM = 'thursday_program',
  SPECIAL_MEETING = 'special_meeting',
  EVANGELISM_CAMPAIGN = 'evangelism_campaign',
}

export enum ServiceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AttendanceSheetStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
}

export enum FundAccountCode {
  GENERAL = 'GENERAL',
  TITHE_OF_TITHES = 'TITHE_OF_TITHES',
  WELFARE_AID = 'WELFARE_AID',
  BUILDING = 'BUILDING',
  FRIENDS_OF_JESUS = 'FRIENDS_OF_JESUS',
  SPECIAL_OFFERING = 'SPECIAL_OFFERING',
  OTHER_DESIGNATED = 'OTHER_DESIGNATED',
}

export enum AllocationRule {
  STANDARD_SPLIT_80_10_10 = 'standard_split_80_10_10',
  DIRECT_ALLOCATED = 'direct_allocated',
}

export enum FinancialEntryStatus {
  VALIDATED = 'validated',
  CANCELLED = 'cancelled',
  REGULARIZED = 'regularized',
}

export enum ExpenseStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum FundTransactionType {
  CREDIT_ENTRY = 'credit_entry',
  DEBIT_EXPENSE = 'debit_expense',
  TRANSFER_OUT = 'transfer_out',
  TRANSFER_IN = 'transfer_in',
  REGULARIZATION = 'regularization',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  CHECK = 'check',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  APPROVE = 'approve',
  REJECT = 'reject',
  PAY = 'pay',
  CANCEL = 'cancel',
  REGULARIZE = 'regularize',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

