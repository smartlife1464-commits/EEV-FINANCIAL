import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { UserRole, ExpenseStatus, PaymentMethod } from '@eev/shared-types';
import {
  ArrowUpCircle,
  Plus,
  DollarSign,
  Printer,
  X,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ExpensesList: React.FC = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payingExpenseId, setPayingExpenseId] = useState<string | null>(null);
  const [voucherExpense, setVoucherExpense] = useState<any | null>(null);

  const { data: expenses = [], isLoading, refetch } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.getExpenses(),
  });

  const canPay = [UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.ADMIN].includes(user?.role as UserRole);

  const handlePay = async (expense: any) => {
    const method = prompt('Mode de paiement (cash, bank_transfer, mobile_money) :', 'cash');
    if (!method) return;
    const ref = prompt('Référence de paiement (facultatif) :', '');

    setPayingExpenseId(expense.id);
    try {
      await api.payExpense(expense.id, method as PaymentMethod, ref || undefined);
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du décaissement');
    } finally {
      setPayingExpenseId(null);
    }
  };

  const filtered = expenses.filter((e: any) => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
            En attente d'accord
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
            Approuvée
          </span>
        );
      case 'paid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
            Décaissement Payé
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/25">
            Rejetée
          </span>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6 text-rose-500" />
            <span>Gestion des Dépenses & Décaissements</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi complet : Enregistrement → Accord du Leader → Décaissement par la caisse.
          </p>
        </div>

        <Link
          to="/finance/expenses/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Engager une Dépense</span>
        </Link>
      </div>

      {/* Filtres de statut */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Toutes les dépenses' },
          { id: 'pending_approval', label: 'En attente d’accord' },
          { id: 'approved', label: 'Approuvées' },
          { id: 'paid', label: 'Payées' },
          { id: 'rejected', label: 'Rejetées' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === f.id
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                : 'bg-white dark:bg-[#0C1530] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#16214A]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tableau des dépenses */}
      <div className="bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#080E25] text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-[#16214A]">
                <th className="py-4 px-6">Numéro</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Motif / Justification</th>
                <th className="py-4 px-6">Bénéficiaire</th>
                <th className="py-4 px-6">Fonds Imputé</th>
                <th className="py-4 px-6">Montant</th>
                <th className="py-4 px-6">Statut</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#16214A]">
              {filtered.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {exp.expense_number || 'DEP-2026-00001'}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(exp.created)}
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white max-w-xs">
                    {exp.purpose}
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium">
                    {exp.beneficiary}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500">
                    Fonds Général
                  </td>
                  <td className="py-4 px-6 font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {formatFCFA(exp.amount)}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    {getStatusBadge(exp.status)}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setVoucherExpense(exp)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16214A] dark:hover:bg-[#1E2C60] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors"
                        title="Imprimer Bon de Décaissement"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Bon</span>
                      </button>

                      {exp.status === 'approved' && canPay && (
                        <button
                          disabled={payingExpenseId === exp.id}
                          onClick={() => handlePay(exp)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Payer</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Bon de Décaissement Imprimable Officiel */}
      {voucherExpense && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 max-w-xl w-full rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6 relative print:p-0 print:border-none print:shadow-none">
            {/* Barre haute non imprimée */}
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Bon de Décaissement Officiel
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le Bon</span>
                </button>
                <button
                  onClick={() => setVoucherExpense(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* En-tête officiel du bon */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <img src="/logo-eev.png" alt="Esprit & Vie" className="w-14 h-14 object-contain" />
                <div>
                  <h2 className="text-base font-black uppercase text-slate-900">
                    Ministère Esprit & Vie
                  </h2>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Service de Gestion Financière & Caisse
                  </p>
                  <p className="text-xs font-bold text-rose-600 uppercase mt-0.5">
                    BON DE DÉCAISSEMENT & SORTIE DE FONDS
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-mono font-bold text-slate-900">{voucherExpense.expense_number || 'DEP-2026-00001'}</p>
                <p className="text-slate-500">Date : {formatDate(voucherExpense.created)}</p>
              </div>
            </div>

            {/* Détails du paiement */}
            <div className="p-4 rounded-2xl bg-slate-100 border space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500 font-bold uppercase">Bénéficiaire :</span>
                <span className="font-extrabold text-slate-900">{voucherExpense.beneficiary}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500 font-bold uppercase">Motif / Justification :</span>
                <span className="font-medium text-slate-900 max-w-xs text-right">{voucherExpense.purpose}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500 font-bold uppercase">Fonds Débité :</span>
                <span className="font-bold text-slate-900">Fonds Général (80% Fonctionnement)</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span className="text-slate-700 font-bold uppercase">Montant Net Décaissé :</span>
                <span className="font-black text-rose-600 text-base">{formatFCFA(voucherExpense.amount)}</span>
              </div>
            </div>

            {/* Visa Leader et Signature Caissier */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
              <div className="space-y-12">
                <p className="font-bold text-slate-700">Autorisation du Leader Principal :</p>
                <div className="border border-emerald-500 bg-emerald-50 text-emerald-800 p-2 rounded-lg text-center font-bold">
                  ✓ ACCORD ACCORDÉ
                </div>
              </div>
              <div className="space-y-12 text-right">
                <p className="font-bold text-slate-700">Signature Caissier & Décharge :</p>
                <div className="border-b border-dashed border-slate-400 w-4/5 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
