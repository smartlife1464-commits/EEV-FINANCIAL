import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserRole } from '@eev/shared-types';
import { authenticateRequest, requireRoles } from '../middleware/auth.js';
import { pb, ensureAdminAuth } from '../services/pocketbase.js';
import { createAuditLog } from '../services/audit.js';
import { isProtocolRole, pbString, sendServiceError } from '../utils/http.js';

/** Rôles habilités à structurer la caisse (créer, modifier, clôturer un compartiment ou une quête) */
const FUND_MANAGERS = [UserRole.ADMIN, UserRole.LEAD_PASTOR, UserRole.FINANCE_LEAD];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (AAAA-MM-JJ)');

export const createFundSchema = z
  .object({
    name: z.string().trim().min(3, 'Le nom doit contenir au moins 3 caractères').max(80),
    description: z.string().trim().max(400).optional().default(''),
    kind: z.enum(['permanent', 'campaign']).default('permanent'),
    targetAmount: z.number().int().nonnegative().optional(),
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
    isRestricted: z.boolean().default(true),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.kind === 'campaign') {
      if (!d.targetAmount || d.targetAmount <= 0) {
        ctx.addIssue({ code: 'custom', path: ['targetAmount'], message: 'La somme à atteindre est obligatoire pour une quête.' });
      }
      if (!d.endDate) {
        ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'La date limite est obligatoire pour une quête.' });
      } else if (d.endDate < new Date().toISOString().slice(0, 10)) {
        ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'La date limite doit être aujourd’hui ou plus tard.' });
      }
    }
    if (d.startDate && d.endDate && d.endDate < d.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'La date limite doit suivre la date de début.' });
    }
  });

export const updateFundSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  description: z.string().trim().max(400).optional(),
  targetAmount: z.number().int().nonnegative().optional(),
  endDate: isoDate.optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  status: z.enum(['active', 'closed']).optional(),
});

/** « Construction du parking » → « CONSTRUCTION_DU_PARKING » (ASCII, sans accents) */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 40);
}

const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (from: string, to: string) =>
  Math.ceil((new Date(`${to}T23:59:59`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000);

/** Indicateurs d'une quête : progression vers l'objectif et délai restant */
export function campaignProgress(fund: Record<string, any>, collected: number) {
  if (fund.kind !== 'campaign') return null;
  const target = fund.target_amount || 0;
  const daysLeft = fund.end_date ? daysBetween(today(), fund.end_date) - 1 : null;
  const reached = target > 0 && collected >= target;
  const state = fund.status === 'closed' ? 'closed' : reached ? 'reached' : daysLeft !== null && daysLeft < 0 ? 'expired' : 'active';
  return {
    target,
    collected,
    remaining: Math.max(0, target - collected),
    percentage: target > 0 ? Math.round((collected / target) * 1000) / 10 : 0,
    daysLeft,
    state,
  };
}

export async function fundRoutes(app: FastifyInstance) {
  // Le Protocole n'a aucun accès aux compartiments financiers
  app.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/api/finance/funds')) return;
    await authenticateRequest(request, reply);
    if (reply.sent) return;
    if (isProtocolRole(request.user?.role)) {
      reply.status(403).send({ error: "Accès interdit : le département Protocole n'a pas accès aux données financières." });
    }
  });

  // ------------------------------------------------------------------ Détail d'un compartiment
  app.get('/api/finance/funds/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await ensureAdminAuth();
      const fund = await pb.collection('fund_accounts').getOne(id, { expand: 'revenue_category,created_by' });
      const filter = `fund_account = "${pbString(id)}"`;

      const [transactions, allocations, expenses] = await Promise.all([
        pb.collection('fund_transactions').getFullList({ filter, sort: '-created' }),
        pb.collection('fund_allocations').getFullList({ filter, sort: '-created', expand: 'financial_entry,financial_entry.category' }),
        pb.collection('expenses').getFullList({ filter, sort: '-created', expand: 'category,requested_by' }),
      ]);

      const sumBy = (type: string) => transactions.filter((t) => t.type === type).reduce((s, t) => s + (t.amount || 0), 0);
      const credits = sumBy('credit_entry');
      const debits = sumBy('debit_expense');
      const transfersIn = sumBy('transfer_in');
      const transfersOut = sumBy('transfer_out');
      const balance = fund.current_balance || 0;
      // Part du solde non justifiée par une écriture (solde d'ouverture saisi directement)
      const openingBalance = balance - (credits + transfersIn - debits - transfersOut);

      // Recettes reçues par ce compartiment (montant affecté + recette d'origine)
      const revenues = allocations.map((a) => {
        const entry = (a.expand as any)?.financial_entry || {};
        return {
          id: a.id,
          amount: a.amount,
          percentage: a.percentage,
          entryId: entry.id,
          entryNumber: entry.entry_number,
          grossAmount: entry.amount,
          donorName: entry.donor_name || '',
          paymentMethod: entry.payment_method,
          collectedAt: entry.collected_at || a.created,
          category: entry.expand?.category?.name || '',
        };
      });

      // Meilleurs donateurs : cumul des montants affectés à ce compartiment
      const donors = new Map<string, { name: string; total: number; count: number; lastAt: string }>();
      for (const r of revenues) {
        const name = r.donorName.trim() || 'Anonyme / Collecte';
        const key = name.toLowerCase();
        const cur = donors.get(key) || { name, total: 0, count: 0, lastAt: '' };
        cur.total += r.amount || 0;
        cur.count += 1;
        if (String(r.collectedAt) > cur.lastAt) cur.lastAt = String(r.collectedAt);
        donors.set(key, cur);
      }
      const named = Array.from(donors.values()).filter((d) => d.name !== 'Anonyme / Collecte');
      const topDonors = Array.from(donors.values()).sort((a, b) => b.total - a.total).slice(0, 10);

      // Tendance mensuelle sur 6 mois (entrées / sorties)
      const now = new Date();
      const monthly = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const inMonth = transactions.filter((t) => String(t.created).startsWith(key));
        monthly.push({
          key,
          label: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
          credits: inMonth.filter((t) => t.direction === 'credit').reduce((s, t) => s + (t.amount || 0), 0),
          debits: inMonth.filter((t) => t.direction === 'debit').reduce((s, t) => s + (t.amount || 0), 0),
        });
      }

      const paid = expenses.filter((e) => e.status === 'paid');
      const committed = expenses.filter((e) => ['pending_approval', 'approved'].includes(e.status));

      return reply.send({
        fund: {
          id: fund.id,
          code: fund.code,
          name: fund.name,
          description: fund.description,
          kind: fund.kind || 'permanent',
          status: fund.status || 'active',
          isRestricted: fund.is_restricted,
          color: fund.color || '',
          targetAmount: fund.target_amount || 0,
          startDate: fund.start_date || '',
          endDate: fund.end_date || '',
          created: fund.created,
          createdBy: (fund.expand as any)?.created_by?.name || '',
          revenueCategory: (fund.expand as any)?.revenue_category
            ? { id: (fund.expand as any).revenue_category.id, name: (fund.expand as any).revenue_category.name }
            : null,
        },
        stats: {
          balance,
          totalIn: credits + transfersIn,
          totalOut: debits + transfersOut,
          revenues: credits,
          expensesPaid: debits,
          transfersIn,
          transfersOut,
          openingBalance,
          entriesCount: revenues.length,
          donorsCount: named.length,
          averageGift: revenues.length ? Math.round(credits / revenues.length) : 0,
          committedExpenses: committed.reduce((s, e) => s + (e.amount || 0), 0),
          paidExpensesCount: paid.length,
        },
        campaign: campaignProgress(fund, credits + transfersIn),
        monthly,
        topDonors,
        revenues: revenues.slice(0, 100),
        expenses: expenses.slice(0, 100).map((e) => ({
          id: e.id,
          number: e.expense_number,
          amount: e.amount,
          status: e.status,
          beneficiary: e.beneficiary,
          purpose: e.purpose,
          category: (e.expand as any)?.category?.name || e.category_name || '',
          requestedBy: (e.expand as any)?.requested_by?.name || '',
          date: e.paid_at || e.expense_date || e.created,
        })),
        transactions: transactions.slice(0, 150).map((t) => ({
          id: t.id,
          number: t.transaction_number,
          type: t.type,
          direction: t.direction,
          amount: t.amount,
          balanceAfter: t.balance_after,
          description: t.description,
          date: t.created,
        })),
      });
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de charger le compartiment.');
    }
  });

  // ------------------------------------------------------------------ Création (compartiment ou quête spontanée)
  app.post('/api/finance/funds', { preHandler: requireRoles(FUND_MANAGERS) }, async (request, reply) => {
    const parsed = createFundSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });
    const d = parsed.data;

    try {
      await ensureAdminAuth();
      // Code unique et lisible : QUETE_<NOM>_<AAMM> pour une quête, <NOM> pour un compartiment
      const stamp = today().slice(2, 7).replace('-', '');
      let base = d.kind === 'campaign' ? `QUETE_${slugify(d.name)}_${stamp}` : slugify(d.name);
      if (!base || base === 'QUETE__' + stamp) base = `FONDS_${Date.now()}`;
      let code = base;
      for (let i = 2; await pb.collection('fund_accounts').getFirstListItem(`code = "${pbString(code)}"`).catch(() => null); i++) {
        code = `${base}_${i}`;
      }

      const fund = await pb.collection('fund_accounts').create({
        code,
        name: d.name,
        description: d.description,
        current_balance: 0,
        is_restricted: d.kind === 'campaign' ? true : d.isRestricted,
        is_active: true,
        kind: d.kind,
        target_amount: d.targetAmount || 0,
        start_date: d.startDate || today(),
        end_date: d.endDate || '',
        status: 'active',
        color: d.color || '',
        created_by: request.user!.id,
      });

      // Catégorie de recette dédiée : 100 % affectée au nouveau compartiment, sans prélèvement
      const category = await pb.collection('financial_categories').create({
        code: code.toLowerCase(),
        name: d.kind === 'campaign' ? `Quête : ${d.name}` : `Don affecté : ${d.name}`,
        allocation_rule: 'direct_allocated',
        target_fund: fund.id,
        description: d.kind === 'campaign' ? `Quête spontanée — objectif ${d.targetAmount} FCFA avant le ${d.endDate}` : d.description || '',
        is_active: true,
      });
      const saved = await pb.collection('fund_accounts').update(fund.id, { revenue_category: category.id });

      await createAuditLog({
        userId: request.user!.id,
        action: d.kind === 'campaign' ? 'create_campaign' : 'create_fund',
        collectionName: 'fund_accounts',
        recordId: fund.id,
        newValues: { code, name: d.name, kind: d.kind, targetAmount: d.targetAmount, endDate: d.endDate, categoryId: category.id },
      });

      return reply.status(201).send({ ...saved, revenueCategory: { id: category.id, name: category.name } });
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de créer le compartiment.');
    }
  });

  // ------------------------------------------------------------------ Modification / clôture / réouverture
  app.patch('/api/finance/funds/:id', { preHandler: requireRoles(FUND_MANAGERS) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateFundSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });
    const d = parsed.data;

    try {
      await ensureAdminAuth();
      const existing = await pb.collection('fund_accounts').getOne(id);
      if (d.status && (existing.kind || 'permanent') !== 'campaign') {
        return reply.status(400).send({ error: 'Seule une quête peut être clôturée ou rouverte.' });
      }
      if (d.status === 'active' && d.endDate === undefined && existing.end_date && existing.end_date < today()) {
        return reply.status(400).send({ error: 'Le délai est dépassé : indiquez une nouvelle date limite pour rouvrir la quête.' });
      }

      const payload = Object.fromEntries(
        Object.entries({
          name: d.name,
          description: d.description,
          target_amount: d.targetAmount,
          end_date: d.endDate,
          color: d.color,
          status: d.status,
        }).filter(([, v]) => v !== undefined)
      );
      const updated = await pb.collection('fund_accounts').update(id, payload);

      // Une quête clôturée n'accepte plus de recettes (catégorie désactivée), son solde reste en caisse
      if (d.status && existing.revenue_category) {
        await pb.collection('financial_categories').update(existing.revenue_category, { is_active: d.status === 'active' });
      }
      if (d.name && existing.revenue_category) {
        await pb.collection('financial_categories').update(existing.revenue_category, {
          name: (existing.kind === 'campaign' ? 'Quête : ' : 'Don affecté : ') + d.name,
        });
      }

      await createAuditLog({
        userId: request.user!.id,
        action: d.status === 'closed' ? 'close_campaign' : d.status === 'active' ? 'reopen_campaign' : 'update_fund',
        collectionName: 'fund_accounts',
        recordId: id,
        oldValues: { name: existing.name, target: existing.target_amount, endDate: existing.end_date, status: existing.status },
        newValues: payload,
      });

      return reply.send(updated);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de modifier le compartiment.');
    }
  });
}
