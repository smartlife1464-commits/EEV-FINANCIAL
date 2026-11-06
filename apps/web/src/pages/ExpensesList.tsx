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
  Filter,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ExpensesList: React.FC = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payingExpenseId, setPayingExpenseId] = useState<string | null>(null);

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
        return <Badge variant="warning">En attente d'approbation</Badge>;
      case 'approved':
        return <Badge variant="info">Approuvée (Prête pour décaissement)</Badge>;
      case 'paid':
        return <Badge variant="success">Décaissement Payé</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejetée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6 text-rose-500" />
            <span>Gestion des Dépenses & Décaissements</span>
          </h1>
          <p className="text-xs text-slate-500">
            Suivi complet du cycle à 3 étapes : Enregistrement → Approbation du Leader → Décaissement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/finance/expenses/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Engager une Dépense</span>
          </Link>
        </div>
      </div>

      {/* Filtres de statut */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
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
                ? 'bg-slate-900 text-amber-400 dark:bg-amber-400 dark:text-slate-950 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tableau des dépenses */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6">Numéro</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Motif / Justification</th>
                <th className="py-4 px-6">Bénéficiaire</th>
                <th className="py-4 px-6">Fonds Imputé</th>
                <th className="py-4 px-6">Montant</th>
                <th className="py-4 px-6">Statut</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {exp.expense_number || 'DEP-2026-00001'}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(exp.created)}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-900 dark:text-white max-w-xs">
                    {exp.purpose}
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                    {exp.beneficiary}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500">
                    Fonds Général
                  </td>
                  <td className="py-4 px-6 font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {formatFCFA(exp.amount)}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    {getStatusBadge(exp.status)}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    {exp.status === 'approved' && canPay ? (
                      <button
                        disabled={payingExpenseId === exp.id}
                        onClick={() => handlePay(exp)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 ml-auto shadow-sm"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Payer / Décaisser</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

