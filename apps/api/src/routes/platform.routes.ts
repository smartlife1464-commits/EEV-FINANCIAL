import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserRole } from '@eev/shared-types';
import { authenticateRequest, requirePlatformAdmin } from '../middleware/auth.js';
import { pb, ensureAdminAuth } from '../services/pocketbase.js';
import { createAuditLog } from '../services/audit.js';
import { config } from '../config.js';
import { sendServiceError } from '../utils/http.js';
import { isMailConfigured } from '../services/mailer.js';
import { tooManyAttempts } from '../utils/rateLimit.js';
import { getMinistrySettings, ministrySettingsSchema } from './settings.routes.js';
import {
  DEFAULT_PLATFORM_CONFIG,
  MODULE_KEYS,
  MODULE_LABELS,
  checkPlatformConfig,
  getPlatformConfig,
  invalidatePlatformCache,
  isSetupRequired,
  mergePlatformConfig,
  savePlatformConfig,
} from '../services/platform.js';

/**
 * Console de l'administrateur de la plateforme.
 *
 * Une installation sert une église. L'admin plateforme l'adapte sans toucher au code :
 * identité, apparence, monnaie, ventilation des recettes, modules, compartiments, catégories,
 * types de culte, libellés des rôles. Un « profil d'église » (export JSON) permet de dupliquer
 * une configuration vers une nouvelle installation.
 */

const PROFILE_VERSION = 1;
/** Compartiment de fonctionnement : code réservé, il reçoit les dépenses courantes par défaut */
const OPERATING_FUND = 'GENERAL';

/** Données transactionnelles effacées par la remise à zéro (jamais la configuration ni les référentiels) */
const TRANSACTIONAL_COLLECTIONS = [
  'fund_allocations',
  'fund_transactions',
  'financial_entries',
  'internal_transfers',
  'fixed_expense_occurrences',
  'expenses',
  'fixed_expenses',
  'expense_budgets',
  'cash_closings',
  'attendance_sheets',
  'services',
  'audit_logs',
];

const codeSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[A-Za-z0-9_]+$/, 'Code : lettres, chiffres et « _ » uniquement');

const fundCreateSchema = z.object({
  code: codeSchema.transform((v) => v.toUpperCase()),
  name: z.string().min(2).max(120),
  description: z.string().max(300).default(''),
  is_restricted: z.boolean().default(true),
  color: z.string().max(9).default(''),
});
const fundUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(300).optional(),
  is_restricted: z.boolean().optional(),
  is_active: z.boolean().optional(),
  color: z.string().max(9).optional(),
});

const revenueCategorySchema = z.object({
  code: codeSchema.transform((v) => v.toLowerCase()),
  name: z.string().min(2).max(120),
  allocation_rule: z.enum(['standard_split_80_10_10', 'direct_allocated']),
  target_fund: z.string().default(''),
  description: z.string().max(300).default(''),
  is_active: z.boolean().default(true),
});

const expenseCategorySchema = z.object({
  code: codeSchema.transform((v) => v.toLowerCase()),
  name: z.string().min(2).max(120),
  type: z.enum(['fixed', 'variable']),
  description: z.string().max(300).default(''),
  is_active: z.boolean().default(true),
});

const serviceTypeSchema = z.object({
  slug: codeSchema.transform((v) => v.toLowerCase()),
  name: z.string().min(2).max(120),
  description: z.string().max(300).default(''),
  display_order: z.number().int().min(0).max(999).default(0),
  is_active: z.boolean().default(true),
});

const setupSchema = z.object({
  token: z.string().default(''),
  admin: z.object({
    name: z.string().min(2, 'Nom requis').max(120),
    email: z.string().email('Email invalide'),
    password: z.string().min(10, 'Le mot de passe doit faire au moins 10 caractères').max(72),
    phone: z.string().max(40).default(''),
  }),
  ministry: ministrySettingsSchema,
  platform: z.any().optional(),
});

const profileSchema = z.object({
  version: z.number().int(),
  kind: z.literal('eev-church-profile'),
  ministry: z.any().optional(),
  platform: z.any().optional(),
  funds: z.array(z.any()).default([]),
  revenueCategories: z.array(z.any()).default([]),
  expenseCategories: z.array(z.any()).default([]),
  serviceTypes: z.array(z.any()).default([]),
});

function publicView(cfg: Awaited<ReturnType<typeof getPlatformConfig>>, ministryName: string, setupRequired: boolean) {
  return {
    name: ministryName || 'Gestion d’église',
    shortName: cfg.branding.shortName,
    tagline: cfg.branding.tagline,
    logo: cfg.branding.logo,
    colors: { primary: cfg.branding.primaryColor, secondary: cfg.branding.secondaryColor },
    currency: { code: cfg.locale.currencyCode, label: cfg.locale.currencyLabel, words: cfg.locale.currencyWords },
    modules: cfg.modules,
    roleLabels: cfg.roleLabels,
    setupRequired,
  };
}

async function audit(userId: string, action: string, recordId: string, newValues?: unknown, oldValues?: unknown) {
  await createAuditLog({
    userId,
    action,
    collectionName: 'platform',
    recordId,
    newValues: newValues as Record<string, unknown> | undefined,
    oldValues: oldValues as Record<string, unknown> | undefined,
  });
}

async function upsertByKey(collection: string, key: string, value: string, data: Record<string, unknown>) {
  const existing = await pb
    .collection(collection)
    .getFirstListItem(pb.filter(`${key} = {:v}`, { v: value }))
    .catch(() => null);
  if (existing) return pb.collection(collection).update(existing.id, data);
  return pb.collection(collection).create({ [key]: value, ...data });
}

export async function platformRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // Configuration publique (écran de connexion, thème, monnaie) — sans authentification
  // ---------------------------------------------------------------------------
  app.get('/api/platform/public', async (request, reply) => {
    try {
      const [cfg, ministry, setupRequired] = await Promise.all([getPlatformConfig(), getMinistrySettings(), isSetupRequired()]);
      return reply.send(publicView(cfg, ministry.name, setupRequired));
    } catch (err) {
      return sendServiceError(reply, err, 'Configuration indisponible.');
    }
  });

  // Configuration complète utile aux écrans (ventilation, modules…) — tout utilisateur connecté
  app.get('/api/platform/config', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      const [cfg, ministry] = await Promise.all([getPlatformConfig(), getMinistrySettings()]);
      return reply.send({ config: cfg, ministry, moduleLabels: MODULE_LABELS, operatingFund: OPERATING_FUND });
    } catch (err) {
      return sendServiceError(reply, err, 'Configuration indisponible.');
    }
  });

  // ---------------------------------------------------------------------------
  // Assistant de première installation
  // ---------------------------------------------------------------------------
  app.get('/api/platform/setup/status', async (request, reply) => {
    try {
      const setupRequired = await isSetupRequired();
      return reply.send({
        setupRequired,
        tokenRequired: Boolean(config.setupToken) || !config.isDevelopment,
        tokenConfigured: Boolean(config.setupToken),
        mailConfigured: isMailConfigured(),
      });
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de vérifier l’état de l’installation.');
    }
  });

  app.post('/api/platform/setup', async (request, reply) => {
    try {
      if (!(await isSetupRequired())) {
        return reply.status(409).send({ error: 'Cette installation est déjà configurée.' });
      }
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de vérifier l’état de l’installation.');
    }
    if (tooManyAttempts(`setup:${request.ip}`, 10, 15 * 60 * 1000)) {
      return reply.status(429).send({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
    }
    const parsed = setupSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });
    const body = parsed.data;

    try {
      if (!config.isDevelopment && !config.setupToken) {
        return reply.status(503).send({
          error: 'SETUP_TOKEN n’est pas défini sur le serveur. Ajoutez-le aux variables d’environnement de l’API puis réessayez.',
        });
      }
      if (config.setupToken && body.token !== config.setupToken) {
        return reply.status(403).send({ error: 'Jeton d’installation incorrect.' });
      }

      let platform = DEFAULT_PLATFORM_CONFIG;
      if (body.platform) {
        platform = mergePlatformConfig(DEFAULT_PLATFORM_CONFIG, body.platform);
        const problem = checkPlatformConfig(platform);
        if (problem) return reply.status(400).send({ error: problem });
      }

      await ensureAdminAuth();
      const existing = await pb
        .collection('users')
        .getFirstListItem(pb.filter('email = {:email}', { email: body.admin.email.toLowerCase() }))
        .catch(() => null);
      const userData = {
        name: body.admin.name,
        phone: body.admin.phone,
        role: UserRole.ADMIN,
        is_active: true,
        is_platform_admin: true,
        verified: true,
        password: body.admin.password,
        passwordConfirm: body.admin.password,
      };
      const user = existing
        ? await pb.collection('users').update(existing.id, userData)
        : await pb.collection('users').create({ email: body.admin.email.toLowerCase(), emailVisibility: true, ...userData });

      await upsertByKey('app_settings', 'key', 'ministry', { value: body.ministry });
      platform = { ...platform, setup: { completed: true, completedAt: new Date().toISOString() } };
      await savePlatformConfig(platform);

      await audit(user.id, 'platform_setup', user.id, { admin: body.admin.email, ministry: body.ministry.name });
      return reply.status(201).send({ success: true, email: user.email });
    } catch (err) {
      return sendServiceError(reply, err, 'L’installation a échoué.');
    }
  });

  // ---------------------------------------------------------------------------
  // Configuration (admin plateforme)
  // ---------------------------------------------------------------------------
  app.put('/api/platform/config', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const previous = await getPlatformConfig();
      let next;
      try {
        next = mergePlatformConfig(previous, request.body || {});
      } catch (err: any) {
        return reply.status(400).send({ error: err?.errors?.[0]?.message || 'Configuration invalide.', details: err?.format?.() });
      }
      next = { ...next, setup: previous.setup };
      const problem = checkPlatformConfig(next);
      if (problem) return reply.status(400).send({ error: problem });

      // Les compartiments de la ventilation doivent exister et être actifs
      await ensureAdminAuth();
      const funds = await pb.collection('fund_accounts').getFullList();
      const activeCodes = new Set(funds.filter((f) => f.is_active !== false).map((f) => f.code));
      const missing = next.finance.split.filter((l) => !activeCodes.has(l.fundCode)).map((l) => l.fundCode);
      if (missing.length) {
        return reply.status(400).send({ error: `Compartiment(s) inexistant(s) ou inactif(s) dans la ventilation : ${missing.join(', ')}.` });
      }

      await savePlatformConfig(next);
      await audit(request.user!.id, 'update_platform_config', 'platform', next, previous);
      return reply.send({ config: next });
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible d’enregistrer la configuration.');
    }
  });

  // ---------------------------------------------------------------------------
  // Référentiels de l'église
  // ---------------------------------------------------------------------------
  app.get('/api/platform/reference', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const [funds, revenueCategories, expenseCategories, serviceTypes, users] = await Promise.all([
        pb.collection('fund_accounts').getFullList({ sort: 'created' }),
        pb.collection('financial_categories').getFullList({ sort: 'created', expand: 'target_fund' }),
        pb.collection('expense_categories').getFullList({ sort: 'type,name' }),
        pb.collection('service_types').getFullList({ sort: 'display_order' }),
        pb.collection('users').getFullList({ fields: 'id,name,email,role,is_active,is_platform_admin' }),
      ]);
      return reply.send({
        funds: funds.map((f) => ({
          id: f.id,
          code: f.code,
          name: f.name,
          description: f.description,
          kind: f.kind || 'permanent',
          status: f.status || 'active',
          is_restricted: f.is_restricted,
          is_active: f.is_active !== false,
          color: f.color || '',
          current_balance: f.current_balance || 0,
        })),
        revenueCategories: revenueCategories.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          allocation_rule: c.allocation_rule,
          target_fund: c.target_fund || '',
          target_fund_code: (c.expand as any)?.target_fund?.code || '',
          description: c.description,
          is_active: c.is_active !== false,
        })),
        expenseCategories: expenseCategories.map((c) => ({
          id: c.id, code: c.code, name: c.name, type: c.type, description: c.description, is_active: c.is_active !== false,
        })),
        serviceTypes: serviceTypes.map((t) => ({
          id: t.id, slug: t.slug, name: t.name, description: t.description, display_order: t.display_order || 0, is_active: t.is_active !== false,
        })),
        users: users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, is_active: u.is_active !== false, is_platform_admin: u.is_platform_admin === true })),
        operatingFund: OPERATING_FUND,
      });
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de charger les référentiels.');
    }
  });

  // Compartiments permanents
  app.post('/api/platform/funds', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    const parsed = fundCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });
    try {
      await ensureAdminAuth();
      const dup = await pb.collection('fund_accounts').getFirstListItem(pb.filter('code = {:c}', { c: parsed.data.code })).catch(() => null);
      if (dup) return reply.status(409).send({ error: `Le code ${parsed.data.code} existe déjà.` });
      const rec = await pb.collection('fund_accounts').create({
        ...parsed.data,
        current_balance: 0,
        is_active: true,
        kind: 'permanent',
        status: 'active',
        created_by: request.user!.id,
      });
      await audit(request.user!.id, 'create_fund', rec.id, parsed.data);
      return reply.status(201).send(rec);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de créer le compartiment.');
    }
  });

  app.patch('/api/platform/funds/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = fundUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });
    try {
      await ensureAdminAuth();
      const fund = await pb.collection('fund_accounts').getOne(id);
      if (parsed.data.is_active === false) {
        const cfg = await getPlatformConfig();
        if (fund.code === OPERATING_FUND) return reply.status(400).send({ error: 'Le compartiment de fonctionnement ne peut pas être désactivé.' });
        if (cfg.finance.split.some((l) => l.fundCode === fund.code)) {
          return reply.status(400).send({ error: 'Ce compartiment fait partie de la ventilation des recettes : retirez-le d’abord de la règle.' });
        }
        if ((fund.current_balance || 0) !== 0) {
          return reply.status(400).send({ error: 'Le solde doit être nul (transférez-le) avant de désactiver ce compartiment.' });
        }
      }
      const rec = await pb.collection('fund_accounts').update(id, parsed.data);
      await audit(request.user!.id, 'update_fund', id, parsed.data, { name: fund.name, is_active: fund.is_active });
      return reply.send(rec);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de modifier le compartiment.');
    }
  });

  // Catégories de recettes
  const validateCategoryTarget = async (data: z.infer<typeof revenueCategorySchema>) => {
    if (data.allocation_rule === 'direct_allocated') {
      if (!data.target_fund) return 'Une catégorie à affectation directe doit désigner un compartiment.';
      const fund = await pb.collection('fund_accounts').getOne(data.target_fund).catch(() => null);
      if (!fund || fund.is_active === false) return 'Compartiment cible introuvable ou inactif.';
    }
    return null;
  };

  app.post('/api/platform/revenue-categories', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    const parsed = revenueCategorySchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });
    try {
      await ensureAdminAuth();
      const problem = await validateCategoryTarget(parsed.data);
      if (problem) return reply.status(400).send({ error: problem });
      const dup = await pb.collection('financial_categories').getFirstListItem(pb.filter('code = {:c}', { c: parsed.data.code })).catch(() => null);
      if (dup) return reply.status(409).send({ error: `Le code ${parsed.data.code} existe déjà.` });
      const data = { ...parsed.data, target_fund: parsed.data.allocation_rule === 'direct_allocated' ? parsed.data.target_fund : '' };
      const rec = await pb.collection('financial_categories').create(data);
      await audit(request.user!.id, 'create_revenue_category', rec.id, data);
      return reply.status(201).send(rec);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de créer la catégorie.');
    }
  });

  app.patch('/api/platform/revenue-categories/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = revenueCategorySchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });
    try {
      await ensureAdminAuth();
      const current = await pb.collection('financial_categories').getOne(id);
      const merged = { ...current, ...parsed.data } as any;
      const problem = await validateCategoryTarget(merged);
      if (problem) return reply.status(400).send({ error: problem });
      const { code: _code, ...data } = parsed.data;
      if (merged.allocation_rule !== 'direct_allocated') (data as any).target_fund = '';
      const rec = await pb.collection('financial_categories').update(id, data);
      await audit(request.user!.id, 'update_revenue_category', id, data, { name: current.name });
      return reply.send(rec);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de modifier la catégorie.');
    }
  });

  // Catégories de dépenses
  app.post('/api/platform/expense-categories', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    const parsed = expenseCategorySchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });
    try {
      await ensureAdminAuth();
      const dup = await pb.collection('expense_categories').getFirstListItem(pb.filter('code = {:c}', { c: parsed.data.code })).catch(() => null);
      if (dup) return reply.status(409).send({ error: `Le code ${parsed.data.code} existe déjà.` });
      const rec = await pb.collection('expense_categories').create(parsed.data);
      await audit(request.user!.id, 'create_expense_category', rec.id, parsed.data);
      return reply.status(201).send(rec);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de créer la catégorie.');
    }
  });

  app.patch('/api/platform/expense-categories/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = expenseCategorySchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });
    try {
      await ensureAdminAuth();
      const { code: _code, ...data } = parsed.data;
      const rec = await pb.collection('expense_categories').update(id, data);
      await audit(request.user!.id, 'update_expense_category', id, data);
      return reply.send(rec);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de modifier la catégorie.');
    }
  });

  // Types de culte / programmes
  app.post('/api/platform/service-types', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    const parsed = serviceTypeSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });
    try {
      await ensureAdminAuth();
      const dup = await pb.collection('service_types').getFirstListItem(pb.filter('slug = {:s}', { s: parsed.data.slug })).catch(() => null);
      if (dup) return reply.status(409).send({ error: `L’identifiant ${parsed.data.slug} existe déjà.` });
      const rec = await pb.collection('service_types').create(parsed.data);
      await audit(request.user!.id, 'create_service_type', rec.id, parsed.data);
      return reply.status(201).send(rec);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de créer le type de culte.');
    }
  });

  app.patch('/api/platform/service-types/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = serviceTypeSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });
    try {
      await ensureAdminAuth();
      const { slug: _slug, ...data } = parsed.data;
      const rec = await pb.collection('service_types').update(id, data);
      await audit(request.user!.id, 'update_service_type', id, data);
      return reply.send(rec);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de modifier le type de culte.');
    }
  });

  // Désignation / retrait d'un administrateur plateforme
  app.patch('/api/platform/admins/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { is_platform_admin } = (request.body as { is_platform_admin?: boolean }) || {};
    if (typeof is_platform_admin !== 'boolean') return reply.status(400).send({ error: 'is_platform_admin (booléen) requis.' });
    if (id === request.user!.id && !is_platform_admin) {
      return reply.status(400).send({ error: 'Vous ne pouvez pas retirer vos propres droits d’administrateur plateforme.' });
    }
    try {
      await ensureAdminAuth();
      const data: Record<string, unknown> = { is_platform_admin };
      if (is_platform_admin) data.role = UserRole.ADMIN;
      const rec = await pb.collection('users').update(id, data);
      await audit(request.user!.id, is_platform_admin ? 'grant_platform_admin' : 'revoke_platform_admin', id, data);
      return reply.send({ id: rec.id, is_platform_admin: rec.is_platform_admin === true });
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de modifier ce compte.');
    }
  });

  // ---------------------------------------------------------------------------
  // Profil d'église : export / import (duplication vers une autre installation)
  // ---------------------------------------------------------------------------
  app.get('/api/platform/profile', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const [cfg, ministry, funds, revenueCategories, expenseCategories, serviceTypes] = await Promise.all([
        getPlatformConfig(),
        getMinistrySettings(),
        pb.collection('fund_accounts').getFullList({ filter: "kind != 'campaign'", sort: 'created' }),
        pb.collection('financial_categories').getFullList({ sort: 'created', expand: 'target_fund' }),
        pb.collection('expense_categories').getFullList({ sort: 'type,name' }),
        pb.collection('service_types').getFullList({ sort: 'display_order' }),
      ]);
      const { setup: _setup, ...platform } = cfg;
      const campaignCategoryIds = new Set(
        (await pb.collection('fund_accounts').getFullList({ filter: "kind = 'campaign'" })).map((f) => f.revenue_category).filter(Boolean)
      );
      return reply.send({
        kind: 'eev-church-profile',
        version: PROFILE_VERSION,
        exportedAt: new Date().toISOString(),
        ministry,
        platform,
        funds: funds.map((f) => ({ code: f.code, name: f.name, description: f.description, is_restricted: f.is_restricted, is_active: f.is_active !== false, color: f.color || '' })),
        revenueCategories: revenueCategories
          .filter((c) => !campaignCategoryIds.has(c.id))
          .map((c) => ({
            code: c.code, name: c.name, allocation_rule: c.allocation_rule, target_fund_code: (c.expand as any)?.target_fund?.code || '', description: c.description, is_active: c.is_active !== false,
          })),
        expenseCategories: expenseCategories.map((c) => ({ code: c.code, name: c.name, type: c.type, description: c.description, is_active: c.is_active !== false })),
        serviceTypes: serviceTypes.map((t) => ({ slug: t.slug, name: t.name, description: t.description, display_order: t.display_order || 0, is_active: t.is_active !== false })),
      });
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible d’exporter le profil.');
    }
  });

  app.post('/api/platform/profile', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    const body = (request.body as { profile?: unknown; includeIdentity?: boolean }) || {};
    const parsed = profileSchema.safeParse(body.profile);
    if (!parsed.success) return reply.status(400).send({ error: 'Fichier de profil invalide.' });
    const profile = parsed.data;
    if (profile.version > PROFILE_VERSION) return reply.status(400).send({ error: 'Profil créé par une version plus récente de la plateforme.' });

    try {
      await ensureAdminAuth();
      const summary = { funds: 0, revenueCategories: 0, expenseCategories: 0, serviceTypes: 0 };

      for (const f of profile.funds) {
        const p = fundCreateSchema.safeParse(f);
        if (!p.success) continue;
        const existing = await pb.collection('fund_accounts').getFirstListItem(pb.filter('code = {:c}', { c: p.data.code })).catch(() => null);
        if (existing) {
          await pb.collection('fund_accounts').update(existing.id, { name: p.data.name, description: p.data.description, is_restricted: p.data.is_restricted, color: p.data.color });
        } else {
          await pb.collection('fund_accounts').create({ ...p.data, current_balance: 0, is_active: true, kind: 'permanent', status: 'active' });
        }
        summary.funds++;
      }

      const funds = await pb.collection('fund_accounts').getFullList();
      const fundIdByCode = new Map(funds.map((f) => [f.code, f.id]));

      for (const c of profile.revenueCategories) {
        const target = c?.target_fund_code ? fundIdByCode.get(String(c.target_fund_code)) || '' : '';
        const p = revenueCategorySchema.safeParse({ ...c, target_fund: target });
        if (!p.success) continue;
        if (p.data.allocation_rule === 'direct_allocated' && !target) continue;
        const { code, ...data } = p.data;
        await upsertByKey('financial_categories', 'code', code, data);
        summary.revenueCategories++;
      }
      for (const c of profile.expenseCategories) {
        const p = expenseCategorySchema.safeParse(c);
        if (!p.success) continue;
        const { code, ...data } = p.data;
        await upsertByKey('expense_categories', 'code', code, data);
        summary.expenseCategories++;
      }
      for (const t of profile.serviceTypes) {
        const p = serviceTypeSchema.safeParse(t);
        if (!p.success) continue;
        const { slug, ...data } = p.data;
        await upsertByKey('service_types', 'slug', slug, data);
        summary.serviceTypes++;
      }

      if (profile.platform) {
        const previous = await getPlatformConfig();
        const next = { ...mergePlatformConfig(previous, profile.platform), setup: previous.setup };
        const problem = checkPlatformConfig(next);
        if (problem) return reply.status(400).send({ error: `Référentiels importés, mais configuration refusée : ${problem}`, summary });
        await savePlatformConfig(next);
      }
      if (body.includeIdentity && profile.ministry) {
        const m = ministrySettingsSchema.safeParse(profile.ministry);
        if (m.success) await upsertByKey('app_settings', 'key', 'ministry', { value: m.data });
      }

      invalidatePlatformCache();
      await audit(request.user!.id, 'import_church_profile', 'platform', summary);
      return reply.send({ success: true, summary });
    } catch (err) {
      return sendServiceError(reply, err, 'L’import du profil a échoué.');
    }
  });

  // ---------------------------------------------------------------------------
  // Remise à zéro des données (après formation / avant mise en production)
  // ---------------------------------------------------------------------------
  app.post('/api/platform/reset-data', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    const { confirm, removeUsers } = (request.body as { confirm?: string; removeUsers?: boolean }) || {};
    try {
      const ministry = await getMinistrySettings();
      if (!confirm || confirm.trim() !== ministry.name.trim()) {
        return reply.status(400).send({ error: `Pour confirmer, saisissez exactement le nom de l’église : « ${ministry.name} ».` });
      }
      await ensureAdminAuth();

      // Sauvegarde complète systématique avant effacement
      const backupName = `avant_remise_a_zero_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.zip`;
      await pb.backups.create(backupName);

      const deleted: Record<string, number> = {};
      for (const name of TRANSACTIONAL_COLLECTIONS) {
        const items = await pb.collection(name).getFullList({ fields: 'id' }).catch(() => []);
        for (const it of items) await pb.collection(name).delete(it.id);
        deleted[name] = items.length;
      }

      // Quêtes spontanées : supprimées avec leur catégorie de recette
      const campaigns = await pb.collection('fund_accounts').getFullList({ filter: "kind = 'campaign'" });
      for (const c of campaigns) {
        await pb.collection('fund_accounts').delete(c.id);
        if (c.revenue_category) await pb.collection('financial_categories').delete(c.revenue_category).catch(() => null);
      }
      deleted.campaigns = campaigns.length;

      // Soldes remis à zéro
      const funds = await pb.collection('fund_accounts').getFullList();
      for (const f of funds) await pb.collection('fund_accounts').update(f.id, { current_balance: 0 });

      if (removeUsers) {
        const others = await pb.collection('users').getFullList({ filter: 'is_platform_admin != true' });
        for (const u of others) await pb.collection('users').delete(u.id);
        deleted.users = others.length;
      }

      await audit(request.user!.id, 'reset_platform_data', 'platform', { backup: backupName, deleted });
      return reply.send({ success: true, backup: backupName, deleted });
    } catch (err) {
      return sendServiceError(reply, err, 'La remise à zéro a échoué.');
    }
  });

  // Liste des modules (pour la console)
  app.get('/api/platform/modules', { preHandler: authenticateRequest }, async () => ({
    modules: MODULE_KEYS.map((k) => ({ key: k, label: MODULE_LABELS[k] })),
  }));
}
