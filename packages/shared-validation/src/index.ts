import { z } from 'zod';
import {
  UserRole,
  ServiceType,
  ServiceStatus,
  PaymentMethod,
  AllocationRule,
  ExpenseStatus,
} from '@eev/shared-types';

// ==================== AUTH & USERS ====================
export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export const createUserSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
});

// ==================== SERVICES & ATTENDANCE ====================
export const createServiceSchema = z.object({
  name: z.string().min(3, 'Le titre du culte doit contenir au moins 3 caractères'),
  serviceType: z.nativeEnum(ServiceType),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (AAAA-MM-JJ)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format heure de début invalide (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format heure de fin invalide (HH:MM)'),
  status: z.nativeEnum(ServiceStatus).default(ServiceStatus.SCHEDULED),
  description: z.string().optional(),
  protocolLeaderId: z.string().optional(),
});

export const attendanceSheetSchema = z.object({
  serviceId: z.string().min(1, 'Service requis'),
  menCount: z.number().int().nonnegative('Le nombre d’hommes doit être supérieur ou égal à 0'),
  womenCount: z.number().int().nonnegative('Le nombre de femmes doit être supérieur ou égal à 0'),
  youthCount: z.number().int().nonnegative('Le nombre de jeunes doit être supérieur ou égal à 0'),
  childrenCount: z.number().int().nonnegative('Le nombre d’enfants doit être supérieur ou égal à 0'),
  newVisitorsCount: z.number().int().nonnegative('Le nombre de nouveaux visiteurs doit être supérieur ou égal à 0'),
  salvationsCount: z.number().int().nonnegative('Le nombre de décisions pour Christ doit être >= 0').default(0),
  notes: z.string().optional(),
});

// ==================== FINANCES ====================
export const financialEntrySchema = z.object({
  serviceId: z.string().optional(),
  categoryId: z.string().min(1, 'Catégorie requise'),
  amount: z.number().int().positive('Le montant doit être un entier strictement positif (FCFA)'),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  reference: z.string().optional(),
  donorName: z.string().optional(),
  notes: z.string().optional(),
  collectedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Date de collecte invalide'),
});

export const createExpenseSchema = z.object({
  categoryId: z.string().min(1, 'Catégorie de dépense requise'),
  fundAccountId: z.string().min(1, 'Compartiment de fonds requis'),
  amount: z.number().int().positive('Le montant doit être un entier strictement positif (FCFA)'),
  beneficiary: z.string().min(2, 'Le bénéficiaire est obligatoire'),
  purpose: z.string().min(3, 'Le motif ou la justification est obligatoire'),
  receiptUrl: z.string().optional(),
  status: z.nativeEnum(ExpenseStatus).default(ExpenseStatus.PENDING_APPROVAL),
});

export const approveExpenseSchema = z.object({
  expenseId: z.string().min(1, 'ID de dépense requis'),
  decision: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export const payExpenseSchema = z.object({
  expenseId: z.string().min(1, 'ID de dépense requis'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentReference: z.string().optional(),
});

export const internalTransferSchema = z.object({
  sourceFundId: z.string().min(1, 'Fonds source requis'),
  destinationFundId: z.string().min(1, 'Fonds destination requis'),
  amount: z.number().int().positive('Le montant doit être un entier strictement positif (FCFA)'),
  reason: z.string().min(5, 'Le motif du transfert est obligatoire (au moins 5 caractères)'),
}).refine((data) => data.sourceFundId !== data.destinationFundId, {
  message: 'Le fonds source et le fonds destination doivent être distincts',
  path: ['destinationFundId'],
});

// ==================== CHARGES FIXES & RÉCURRENTES ====================
export const createFixedExpenseSchema = z.object({
  name: z.string().min(2, 'Le nom de la charge est requis'),
  category: z.string().min(2, 'La catégorie est requise'),
  description: z.string().optional(),
  amount: z.number().int().positive('Le montant habituel doit être strictement supérieur à 0 (XAF)'),
  currency: z.string().default('XAF'),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'custom']).default('monthly'),
  dueDay: z.number().int().min(1).max(31).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (AAAA-MM-JJ)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (AAAA-MM-JJ)').optional().or(z.literal('')),
  fundAccountId: z.string().min(1, 'Compartiment analytique requis'),
  beneficiary: z.string().min(2, 'Le bénéficiaire ou fournisseur est obligatoire'),
  responsibleUserId: z.string().optional(),
  paymentMethod: z.string().default('cash'),
  status: z.enum(['active', 'suspended', 'archived']).default('active'),
  notes: z.string().optional(),
});

export const updateFixedExpenseSchema = createFixedExpenseSchema.partial();

// ==================== BUDGETS DÉPENSES VARIABLES ====================
export const createExpenseBudgetSchema = z.object({
  category: z.string().min(2, 'La catégorie est requise'),
  amount: z.number().int().positive('Le budget prévu doit être supérieur à 0 (XAF)'),
  periodType: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de début requise'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de fin requise'),
  fundAccountId: z.string().optional(),
  alertThreshold: z.number().int().min(1).max(100).default(80),
  status: z.enum(['active', 'closed']).default('active'),
});

// ==================== FICHES DE FRÉQUENTATION STRUCTURÉES (7 PROGRAMMES) ====================
export const structuredAttendanceSchema = z.object({
  serviceTypeSlug: z.string().min(1, 'Programme requis'),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date du service requise (AAAA-MM-JJ)'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  menCount: z.number().int().nonnegative('Le nombre d’hommes doit être >= 0').default(0),
  womenCount: z.number().int().nonnegative('Le nombre de femmes doit être >= 0').default(0),
  youthCount: z.number().int().nonnegative('Le nombre de jeunes doit être >= 0').default(0),
  childrenCount: z.number().int().nonnegative('Le nombre d’enfants doit être >= 0').default(0),
  newVisitorsCount: z.number().int().nonnegative('Le nombre de nouveaux visiteurs doit être >= 0').default(0),
  salvationsCount: z.number().int().nonnegative('Le nombre de décisions pour Christ doit être >= 0').default(0),
  notes: z.string().optional(),
  responsibleUserId: z.string().optional(),
  isDraft: z.boolean().default(false),
});


