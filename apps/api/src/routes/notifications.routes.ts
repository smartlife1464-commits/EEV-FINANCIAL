import { FastifyInstance } from 'fastify';
import { PERMISSIONS_MATRIX } from '@eev/business-rules';
import { UserRole } from '@eev/shared-types';
import { authenticateRequest } from '../middleware/auth.js';
import { pb, ensureAdminAuth } from '../services/pocketbase.js';
import { isProtocolRole, sendServiceError } from '../utils/http.js';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  category: 'finances' | 'protocole' | 'reports' | 'system';
  severity: 'action' | 'warning' | 'info';
  badge: string;
  link: string;
  at: string;
}

const fcfa = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR')} FCFA`;
const today = () => new Date().toISOString().slice(0, 10);

/** Programmes réguliers attendus chaque semaine (jour JS : 0 = dimanche) */
const WEEKLY_PROGRAMS = [
  { slug: 'sunday_service_1', day: 0, name: '1er Service Dimanche' },
  { slug: 'tuesday_service', day: 2, name: 'Culte de Mardi' },
  { slug: 'thursday_service', day: 4, name: 'Culte de Jeudi' },
];

/**
 * Centre de notifications calculé en temps réel selon le rôle de l'utilisateur.
 * Aucune notification n'est stockée : chaque alerte reflète l'état actuel des données.
 */
export async function notificationRoutes(app: FastifyInstance) {
  app.get('/api/notifications', { preHandler: authenticateRequest }, async (request, reply) => {
    const user = request.user!;
    const perms = PERMISSIONS_MATRIX[user.role];
    const items: AppNotification[] = [];

    try {
      await ensureAdminAuth();
      const finance = !isProtocolRole(user.role);

      // 1. Arbitrages du Leader Principal
      if (perms.canApproveExpense) {
        const pending = await pb.collection('expenses').getFullList({ filter: `status = "pending_approval"`, sort: '-created' });
        for (const x of pending) {
          if (x.requested_by === user.id) continue; // pas d'auto-approbation
          items.push({
            id: `exp-pending-${x.id}`,
            title: `Dépense à arbitrer : ${x.expense_number}`,
            description: `${fcfa(x.amount)} — ${x.beneficiary} : ${x.purpose}`,
            category: 'finances',
            severity: 'action',
            badge: 'Arbitrage requis',
            link: '/finance/approvals',
            at: x.created,
          });
        }
        const occs = await pb.collection('fixed_expense_occurrences').getFullList({
          filter: `status = "pending" && due_date <= "${new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)}"`,
          expand: 'fixed_expense',
        });
        for (const o of occs) {
          const overdue = o.due_date < today();
          items.push({
            id: `occ-approve-${o.id}`,
            title: `${overdue ? 'Échéance en retard' : 'Échéance proche'} : ${(o.expand as any)?.fixed_expense?.name || 'Charge fixe'}`,
            description: `${fcfa(o.expected_amount)} à autoriser — échéance du ${o.due_date}.`,
            category: 'finances',
            severity: overdue ? 'warning' : 'action',
            badge: 'Charge fixe',
            link: '/finance/expenses',
            at: o.due_date,
          });
        }
      }

      // 2. Décaissements à exécuter (Finances / Caisse)
      if (perms.canPayExpense) {
        const approved = await pb.collection('expenses').getFullList({ filter: `status = "approved"`, sort: '-approved_at' });
        for (const x of approved) {
          items.push({
            id: `exp-pay-${x.id}`,
            title: `Paiement à exécuter : ${x.expense_number}`,
            description: `${fcfa(x.amount)} approuvés pour ${x.beneficiary}. Procéder au décaissement et éditer la pièce de caisse.`,
            category: 'finances',
            severity: 'action',
            badge: 'Décaissement',
            link: '/finance/expenses',
            at: x.approved_at || x.created,
          });
        }
        const approvedOccs = await pb.collection('fixed_expense_occurrences').getFullList({
          filter: `status = "approved"`,
          expand: 'fixed_expense',
        });
        for (const o of approvedOccs) {
          items.push({
            id: `occ-pay-${o.id}`,
            title: `Charge fixe à régler : ${(o.expand as any)?.fixed_expense?.name || 'Échéance'}`,
            description: `${fcfa(o.expected_amount)} autorisés — échéance du ${o.due_date}.`,
            category: 'finances',
            severity: o.due_date < today() ? 'warning' : 'action',
            badge: 'Décaissement',
            link: '/finance/expenses',
            at: o.approved_at || o.due_date,
          });
        }
      }

      // 3. Budgets en alerte (rôles financiers)
      if (finance && (perms.canCreateExpense || user.role === UserRole.AUDITOR)) {
        const budgets = await pb.collection('expense_budgets').getFullList({ filter: `status = "active"` });
        const expenses = await pb.collection('expenses').getFullList({ expand: 'category' });
        for (const b of budgets) {
          if (b.period_end && b.period_end < today()) continue;
          const used = expenses
            .filter((e) => {
              const name = String((e.expand as any)?.category?.name || e.category_name || '').toLowerCase();
              const day = String(e.paid_at || e.expense_date || e.created || '').slice(0, 10);
              return (
                name === String(b.category).toLowerCase() &&
                ['paid', 'approved', 'pending_approval'].includes(e.status) &&
                (!b.period_start || day >= b.period_start)
              );
            })
            .reduce((acc, e) => acc + (e.amount || 0), 0);
          const rate = b.amount ? Math.round((used / b.amount) * 100) : 0;
          if (rate >= (b.alert_threshold || 80)) {
            items.push({
              id: `budget-${b.id}-${rate >= 100 ? 'over' : 'alert'}`,
              title: `${rate >= 100 ? 'Budget dépassé' : 'Budget presque consommé'} : ${b.category}`,
              description: `${fcfa(used)} engagés sur ${fcfa(b.amount)} (${rate}%).`,
              category: 'finances',
              severity: rate >= 100 ? 'warning' : 'info',
              badge: 'Budget',
              link: '/finance/expenses',
              at: b.updated || b.created,
            });
          }
        }
      }

      // 4. Fiches de présence à valider (Responsable Protocole / Direction)
      if (perms.canValidateAttendance) {
        const submitted = await pb.collection('attendance_sheets').getFullList({ filter: `status = "submitted"`, sort: '-service_date' });
        for (const s of submitted) {
          if (s.submitted_by === user.id) continue; // contrôle à 4 yeux
          items.push({
            id: `att-validate-${s.id}`,
            title: `Fiche de présence à valider (${s.service_date})`,
            description: `${s.total_attendance} participants, ${s.new_visitors_count || 0} nouveaux visiteurs — ${s.service_type_slug}.`,
            category: 'protocole',
            severity: 'action',
            badge: 'Validation',
            link: '/attendance',
            at: s.created,
          });
        }
      }

      // 5. Fiches rejetées à corriger (auteur)
      if (perms.canSubmitAttendance) {
        const rejected = await pb.collection('attendance_sheets').getFullList({
          filter: `status = "rejected" && submitted_by = "${user.id}"`,
        });
        for (const s of rejected) {
          items.push({
            id: `att-rejected-${s.id}`,
            title: `Fiche rejetée à corriger (${s.service_date})`,
            description: s.notes || 'La fiche a été renvoyée par le Responsable Protocole.',
            category: 'protocole',
            severity: 'warning',
            badge: 'Correction',
            link: '/attendance',
            at: s.updated || s.created,
          });
        }

        // 6. Rappels : programmes réguliers des 7 derniers jours sans fiche saisie
        const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
        const recent = await pb.collection('attendance_sheets').getFullList({ filter: `service_date >= "${since}"` });
        for (let i = 1; i <= 7; i++) {
          const d = new Date(Date.now() - i * 864e5);
          const program = WEEKLY_PROGRAMS.find((p) => p.day === d.getDay());
          if (!program) continue;
          const day = d.toISOString().slice(0, 10);
          const done = recent.some((s) => s.service_date === day && String(s.service_type_slug).startsWith(program.slug.replace(/_1$/, '')));
          if (!done) {
            items.push({
              id: `att-missing-${program.slug}-${day}`,
              title: `Fiche manquante : ${program.name} du ${day.split('-').reverse().join('/')}`,
              description: 'Aucune fiche de fréquentation n’a été saisie pour ce culte régulier.',
              category: 'protocole',
              severity: 'info',
              badge: 'Rappel',
              link: '/attendance/new',
              at: `${day} 23:00:00.000Z`,
            });
          }
        }
      }

      // 7. Clôture de caisse hebdomadaire (Finances / Caisse)
      if (finance && perms.canPayExpense) {
        const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
        const closings = await pb.collection('cash_closings').getList(1, 1, { filter: `closing_date >= "${since}"` });
        if (closings.totalItems === 0) {
          items.push({
            id: `closing-missing-${since}`,
            title: 'Aucune clôture de caisse depuis 7 jours',
            description: 'Réalisez le billetage contradictoire et signez le procès-verbal de caisse.',
            category: 'finances',
            severity: 'info',
            badge: 'Contrôle',
            link: '/finance/cash-closing',
            at: new Date().toISOString(),
          });
        }
      }

      items.sort((a, b) => String(b.at).localeCompare(String(a.at)));
      return reply.send(items);
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de charger les notifications.');
    }
  });
}
