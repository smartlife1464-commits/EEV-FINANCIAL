import { z } from 'zod';
import { DEFAULT_REMAINDER_FUND, DEFAULT_SPLIT_RULE, validateSplitRule } from '@eev/business-rules';
import { pb, ensureAdminAuth } from './pocketbase.js';

/**
 * Configuration de la plateforme (une installation = une église).
 *
 * Tout ce qui distingue une église d'une autre est ici, modifiable depuis la console de l'admin
 * plateforme, sans toucher au code : apparence, monnaie, règle de ventilation des recettes,
 * modules activés. L'identité officielle (nom, siège, contacts) reste dans la clé « ministry ».
 */

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hexadécimale attendue (#RRGGBB)');

export const MODULE_KEYS = [
  'attendance',
  'finance',
  'campaigns',
  'fixedExpenses',
  'budgets',
  'transfers',
  'cashClosing',
  'analytics',
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  attendance: 'Fréquentation des cultes',
  finance: 'Finances (recettes, dépenses, caisse)',
  campaigns: 'Quêtes spontanées',
  fixedExpenses: 'Charges fixes',
  budgets: 'Budgets de dépenses',
  transfers: 'Transferts internes',
  cashClosing: 'Clôture de caisse',
  analytics: 'Analyses et prévisions',
};

export const platformConfigSchema = z.object({
  branding: z.object({
    shortName: z.string().max(40).default(''),
    tagline: z.string().max(140).default(''),
    /** Logo : URL https ou image encodée (data:image/...) de 400 Ko maximum */
    logo: z
      .string()
      .max(560_000, 'Logo trop lourd (400 Ko maximum)')
      .refine((v) => v === '' || v.startsWith('data:image/') || v.startsWith('https://'), 'Logo : URL https ou image attendue')
      .default(''),
    primaryColor: hexColor.default('#FFBC00'),
    secondaryColor: hexColor.default('#091338'),
  }),
  locale: z.object({
    currencyCode: z.string().min(3).max(3).default('XAF'),
    currencyLabel: z.string().min(1).max(12).default('FCFA'),
    /** Monnaie en toutes lettres sur les reçus et bons : « francs CFA », « euros »… */
    currencyWords: z.string().min(1).max(40).default('francs CFA'),
    country: z.string().max(60).default(''),
    city: z.string().max(60).default(''),
    timezone: z.string().max(60).default('Africa/Douala'),
  }),
  finance: z.object({
    split: z
      .array(
        z.object({
          fundCode: z.string().min(1).max(60),
          percentage: z.number().int().min(0).max(100),
          label: z.string().max(80).default(''),
        })
      )
      .min(1)
      .default(DEFAULT_SPLIT_RULE.map((l) => ({ ...l, label: l.label || '' }))),
    remainderFund: z.string().min(1).default(DEFAULT_REMAINDER_FUND),
  }),
  modules: z.object(
    Object.fromEntries(MODULE_KEYS.map((k) => [k, z.boolean().default(true)])) as Record<ModuleKey, z.ZodDefault<z.ZodBoolean>>
  ),
  /** Libellés des rôles affichés dans les applications (les droits restent ceux du code) */
  roleLabels: z.object({
    admin: z.string().min(2).max(60).default('Administrateur général'),
    lead_pastor: z.string().min(2).max(60).default('Pasteur principal'),
    finance_lead: z.string().min(2).max(60).default('Responsable des finances'),
    cashier: z.string().min(2).max(60).default('Caissier'),
    protocol_lead: z.string().min(2).max(60).default('Responsable du protocole'),
    protocol_agent: z.string().min(2).max(60).default('Agent du protocole'),
    auditor: z.string().min(2).max(60).default('Auditeur'),
  }),
  setup: z.object({
    completed: z.boolean().default(false),
    completedAt: z.string().default(''),
  }),
});

export type PlatformConfig = z.infer<typeof platformConfigSchema>;

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = platformConfigSchema.parse({
  branding: {},
  locale: {},
  finance: {},
  modules: {},
  roleLabels: {},
  setup: {},
});

/** Fusion profonde section par section (les sections manquantes prennent les valeurs par défaut) */
export function mergePlatformConfig(base: PlatformConfig, patch: any): PlatformConfig {
  const out: any = {};
  for (const key of Object.keys(DEFAULT_PLATFORM_CONFIG) as (keyof PlatformConfig)[]) {
    const p = patch && typeof patch === 'object' ? patch[key] : undefined;
    out[key] = { ...(base as any)[key], ...(p && typeof p === 'object' && !Array.isArray(p) ? p : {}) };
  }
  return platformConfigSchema.parse(out);
}

export function checkPlatformConfig(cfg: PlatformConfig): string | null {
  const split = validateSplitRule(cfg.finance.split, cfg.finance.remainderFund);
  if (!split.valid) return split.error || 'Règle de ventilation invalide.';
  if (cfg.modules.campaigns && !cfg.modules.finance) return 'Les quêtes spontanées nécessitent le module Finances.';
  return null;
}

let cache: { value: PlatformConfig; at: number } | null = null;
const CACHE_MS = 15_000;

/** Dernière configuration connue (synchrone, pour les libellés) — valeurs par défaut avant le premier chargement */
export function cachedPlatformConfig(): PlatformConfig {
  return cache?.value || DEFAULT_PLATFORM_CONFIG;
}

/** Montant formaté avec la monnaie de l'église : « 150 000 FCFA » */
export function money(n: number): string {
  return `${Math.round(Number(n) || 0).toLocaleString('fr-FR')} ${cachedPlatformConfig().locale.currencyLabel}`;
}

export function invalidatePlatformCache() {
  cache = null;
}

export async function getPlatformConfig(): Promise<PlatformConfig> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  await ensureAdminAuth();
  let value = DEFAULT_PLATFORM_CONFIG;
  try {
    const rec = await pb.collection('app_settings').getFirstListItem(`key = "platform"`);
    value = mergePlatformConfig(DEFAULT_PLATFORM_CONFIG, rec.value || {});
  } catch {
    value = DEFAULT_PLATFORM_CONFIG;
  }
  cache = { value, at: Date.now() };
  return value;
}

export async function savePlatformConfig(next: PlatformConfig): Promise<PlatformConfig> {
  await ensureAdminAuth();
  const existing = await pb.collection('app_settings').getFirstListItem(`key = "platform"`).catch(() => null);
  if (existing) {
    await pb.collection('app_settings').update(existing.id, { value: next });
  } else {
    await pb.collection('app_settings').create({ key: 'platform', value: next });
  }
  invalidatePlatformCache();
  return next;
}

/** Une installation est « à initialiser » tant qu'aucun administrateur plateforme actif n'existe. */
export async function isSetupRequired(): Promise<boolean> {
  await ensureAdminAuth();
  try {
    const admins = await pb.collection('users').getList(1, 1, { filter: 'is_platform_admin = true && is_active != false' });
    return admins.totalItems === 0;
  } catch {
    // Champ absent (migration non appliquée) : on considère qu'il faut initialiser
    return true;
  }
}
