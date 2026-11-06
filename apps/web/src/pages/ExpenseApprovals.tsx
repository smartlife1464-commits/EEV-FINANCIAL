import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { CheckCircle2, XCircle, FileText, AlertCircle, ShieldCheck } from 'lucide-react';

export const ExpenseApprovals: React.FC = () => {
  const { data: expenses = [], isLoading, refetch } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.getExpenses(),
  });

  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingExpenses = expenses.filter((e: any) => e.status === 'pending_approval');

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await api.approveExpense(id, 'approve');
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’approbation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Veuillez indiquer le motif du rejet :');
    if (!reason) return;
    setProcessingId(id);
    try {
      await api.approveExpense(id, 'reject', reason);
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du rejet');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Centre d’Autorisation des Décaissements
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Réservé à la validation formelle et souveraine du Leader Principal.
          </p>
        </div>
        <Badge variant={pendingExpenses.length > 0 ? 'warning' : 'success'}>
          {pendingExpenses.length} dépense(s) en attente
        </Badge>
      </div>

      {pendingExpenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Toutes les dépenses sont arbitrées
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Aucun décaissement n’est actuellement en attente d’autorisation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingExpenses.map((expense: any) => (
            <div
              key={expense.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {expense.expense_number || 'DEP-2026-00001'}
                  </span>
                  <Badge variant="warning">En attente d'accord</Badge>
                  <span className="text-xs text-slate-400">
                    Soumise le {formatDate(expense.created)}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {expense.purpose}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>
                    Bénéficiaire :{' '}
                    <strong className="text-slate-900 dark:text-slate-200">{expense.beneficiary}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Compartiment imputé :{' '}
                    <strong className="text-slate-900 dark:text-slate-200">
                      Fonds Général (Fonctionnement)
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatFCFA(expense.amount)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={processingId === expense.id}
                    onClick={() => handleApprove(expense.id)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approuver le décaissement</span>
                  </button>

                  <button
                    disabled={processingId === expense.id}
                    onClick={() => handleReject(expense.id)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rejeter</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
