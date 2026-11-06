import { UserRole, ExpenseStatus } from '@eev/shared-types';

export const PERMISSIONS_MATRIX: Record<UserRole, {
  canViewDashboardLeader: boolean;
  canViewDashboardFinance: boolean;
  canViewDashboardProtocol: boolean;
  canCreateService: boolean;
  canSubmitAttendance: boolean;
  canValidateAttendance: boolean;
  canCreateFinancialEntry: boolean;
  canCreateExpense: boolean;
  canApproveExpense: boolean;
  canPayExpense: boolean;
  canCreateInternalTransfer: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canExportReports: boolean;
}> = {
  [UserRole.ADMIN]: {
    canViewDashboardLeader: true,
    canViewDashboardFinance: true,
    canViewDashboardProtocol: true,
    canCreateService: true,
    canSubmitAttendance: true,
    canValidateAttendance: true,
    canCreateFinancialEntry: true,
    canCreateExpense: true,
    canApproveExpense: false, // Séparation des pouvoirs : seul le leader approuve
    canPayExpense: false,
    canCreateInternalTransfer: true,
    canManageUsers: true,
    canViewAuditLogs: true,
    canExportReports: true,
  },
  [UserRole.LEAD_PASTOR]: {
    canViewDashboardLeader: true,
    canViewDashboardFinance: true,
    canViewDashboardProtocol: true,
    canCreateService: true,
    canSubmitAttendance: true,
    canValidateAttendance: true,
    canCreateFinancialEntry: true,
    canCreateExpense: true,
    canApproveExpense: true, // Approbation souveraine du leader
    canPayExpense: false, // Exécuté par les caissiers/finances après approbation
    canCreateInternalTransfer: true,
    canManageUsers: true,
    canViewAuditLogs: true,
    canExportReports: true,
  },
  [UserRole.FINANCE_LEAD]: {
    canViewDashboardLeader: false,
    canViewDashboardFinance: true,
    canViewDashboardProtocol: false,
    canCreateService: false,
    canSubmitAttendance: false,
    canValidateAttendance: false,
    canCreateFinancialEntry: true,
    canCreateExpense: true,
    canApproveExpense: false,
    canPayExpense: true, // Paiement après approbation du leader
    canCreateInternalTransfer: true,
    canManageUsers: false,
    canViewAuditLogs: false,
    canExportReports: true,
  },
  [UserRole.CASHIER]: {
    canViewDashboardLeader: false,
    canViewDashboardFinance: true,
    canViewDashboardProtocol: false,
    canCreateService: false,
    canSubmitAttendance: false,
    canValidateAttendance: false,
    canCreateFinancialEntry: true,
    canCreateExpense: true,
    canApproveExpense: false,
    canPayExpense: true,
    canCreateInternalTransfer: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canExportReports: false,
  },
  [UserRole.PROTOCOL_LEAD]: {
    canViewDashboardLeader: false,
    canViewDashboardFinance: false,
    canViewDashboardProtocol: true,
    canCreateService: true,
    canSubmitAttendance: true,
    canValidateAttendance: true,
    canCreateFinancialEntry: false,
    canCreateExpense: false,
    canApproveExpense: false,
    canPayExpense: false,
    canCreateInternalTransfer: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canExportReports: true,
  },
  [UserRole.PROTOCOL_AGENT]: {
    canViewDashboardLeader: false,
    canViewDashboardFinance: false,
    canViewDashboardProtocol: true,
    canCreateService: false,
    canSubmitAttendance: true,
    canValidateAttendance: false,
    canCreateFinancialEntry: false,
    canCreateExpense: false,
    canApproveExpense: false,
    canPayExpense: false,
    canCreateInternalTransfer: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canExportReports: false,
  },
  [UserRole.AUDITOR]: {
    canViewDashboardLeader: true,
    canViewDashboardFinance: true,
    canViewDashboardProtocol: true,
    canCreateService: false,
    canSubmitAttendance: false,
    canValidateAttendance: false,
    canCreateFinancialEntry: false,
    canCreateExpense: false,
    canApproveExpense: false,
    canPayExpense: false,
    canCreateInternalTransfer: false,
    canManageUsers: false,
    canViewAuditLogs: true,
    canExportReports: true,
  },
};

/**
 * Valide les transitions d'états d'une dépense.
 */
export function canTransitionExpense(
  currentStatus: ExpenseStatus,
  targetStatus: ExpenseStatus,
  userRole: UserRole,
  isOwnExpense: boolean = false
): { allowed: boolean; reason?: string } {
  // Règle anti auto-approbation : on ne peut pas approuver sa propre dépense
  if (targetStatus === ExpenseStatus.APPROVED && isOwnExpense && userRole !== UserRole.LEAD_PASTOR) {
    return { allowed: false, reason: "Auto-approbation interdite : vous ne pouvez pas approuver votre propre dépense." };
  }

  switch (currentStatus) {
    case ExpenseStatus.DRAFT:
      if (targetStatus === ExpenseStatus.PENDING_APPROVAL) {
        return { allowed: true };
      }
      if (targetStatus === ExpenseStatus.CANCELLED) {
        return { allowed: true };
      }
      return { allowed: false, reason: "Un brouillon ne peut passer qu'en attente d'approbation ou être annulé." };

    case ExpenseStatus.PENDING_APPROVAL:
      if (targetStatus === ExpenseStatus.APPROVED || targetStatus === ExpenseStatus.REJECTED) {
        if (!PERMISSIONS_MATRIX[userRole].canApproveExpense) {
          return { allowed: false, reason: "Seul le Leader Principal a le droit d'approuver ou rejeter les dépenses." };
        }
        return { allowed: true };
      }
      if (targetStatus === ExpenseStatus.CANCELLED) {
        return { allowed: true };
      }
      return { allowed: false, reason: "Une dépense en attente doit être approuvée, rejetée ou annulée." };

    case ExpenseStatus.APPROVED:
      if (targetStatus === ExpenseStatus.PAID) {
        if (!PERMISSIONS_MATRIX[userRole].canPayExpense) {
          return { allowed: false, reason: "Seul le service financier autorisé peut procéder au décaissement effectif." };
        }
        return { allowed: true };
      }
      if (targetStatus === ExpenseStatus.CANCELLED) {
        return { allowed: true };
      }
      return { allowed: false, reason: "Une dépense approuvée ne peut qu'être payée ou exceptionnellement annulée." };

    case ExpenseStatus.REJECTED:
    case ExpenseStatus.PAID:
    case ExpenseStatus.CANCELLED:
      return { allowed: false, reason: `L'état ${currentStatus} est terminal. Aucune modification directe possible.` };

    default:
      return { allowed: false, reason: "État inconnu." };
  }
}

