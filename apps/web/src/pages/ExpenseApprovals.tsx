import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatFCFA, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import {
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  ShieldCheck,
  Building2,
  Wallet,
  X,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

export const ExpenseApprovals: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const canDecide = hasPermission('canApproveExpense');
  const queryClient = useQueryClient();
  const { data: expenses = [], isLoading, refetch } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.getExpenses(),
  });

  const { data: treasury } = useQuery({
    queryKey: ['treasury-overview'],
    queryFn: () => api.getTreasuryOverview(),
  });

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingExpense, setRejectingExpense] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingExpenses = expenses.filter((e: any) => e.status === 'pending_approval');
  const totalPendingAmount = pendingExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  const handleApprove = async (id: string) => {
    if (!confirm('Confirmez-vous l’approbation de cette dépense pour paiement par la caisse ?')) return;

    setProcessingId(id);
    try {
      await api.approveExpense(id, 'approve');
      toast.success('Dépense approuvée', { description: 'Elle peut désormais être payée par la caisse.' });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l’approbation');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingExpense || !rejectionReason.trim()) return;

    setProcessingId(rejectingExpense.id);
    try {
      await api.approveExpense(rejectingExpense.id, 'reject', rejectionReason.trim());
      setRejectingExpense(null);
      setRejectionReason('');
      toast.success('Dépense rejetée', { description: 'Le motif a été notifié et archivé dans la piste d’audit.' });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du rejet');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              Centre d’Autorisation des Décaissements
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Validation souveraine et arbitrage des dépenses par le Leader Principal avant tout paiement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold">
            {pendingExpenses.length} dépense(s) en attente • Total : {formatFCFA(totalPendingAmount)}
          </div>
        </div>
      </div>

      {/* État de trésorerie disponible */}
      <div className="p-5 rounded-3xl bg-[#091338] border border-[#16214A] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-black">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Solde Libre du Fonds Général (80%)
            </span>
            <span className="text-xl font-black text-white">
              {formatFCFA(treasury?.generalFundFreeBalance ?? 0)}
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-300">
          Les décaissements autorisés seront prélevés sur cette disponibilité réelle de la caisse.
        </div>
      </div>

      {/* Liste des Dépenses en attente */}
      {pendingExpenses.length === 0 ? (
        <div className="bg-white dark:bg-[#0C1530] rounded-3xl p-12 text-center border border-slate-200 dark:border-[#16214A] shadow-sm">
          <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Toutes les dépenses ont été arbitrées
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Aucun décaissement n’est actuellement en attente d’autorisation. La trésorerie est à jour.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingExpenses.map((expense: any) => (
            <div
              key={expense.id}
              className="bg-white dark:bg-[#0C1530] rounded-3xl p-6 border border-slate-200 dark:border-[#16214A] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2.5 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#070D22] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#16214A]">
                    {expense.expense_number || '—'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                    En attente d'accord
                  </span>
                  <span className="text-xs text-slate-400">
                    Soumise le {formatDate(expense.created)}
                    {expense.requested_by?.name ? ` par ${expense.requested_by.name}` : ''}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {expense.purpose}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Bénéficiaire :{' '}
                    <strong className="text-slate-900 dark:text-slate-200 font-bold">
                      {expense.beneficiary}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Catégorie :{' '}
                    <strong className="text-slate-900 dark:text-slate-200 font-bold">
                      {expense.category?.name || 'Fonctionnement'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Fonds imputé :{' '}
                    <strong className="text-amber-500 font-bold">
                      {expense.fund_account?.name || 'Fonds Général'}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-6">
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Montant Demandé
                  </span>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {formatFCFA(expense.amount)}
                  </span>
                </div>

                {(() => {
                  const ownRequest = expense.requested_by === user?.id || expense.requested_by?.id === user?.id;
                  if (!canDecide) {
                    return <span className="text-xs font-bold text-slate-400">Consultation seule</span>;
                  }
                  if (ownRequest) {
                    return (
                      <span className="max-w-[220px] text-xs font-bold text-amber-600 dark:text-amber-400 text-right">
                        Vous êtes l’auteur de cette demande : l’auto-approbation est interdite.
                      </span>
                    );
                  }
                  return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRejectingExpense(expense)}
                    disabled={processingId === expense.id}
                    className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 transition-all cursor-pointer"
                    title="Rejeter la dépense"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleApprove(expense.id)}
                    disabled={processingId === expense.id}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{processingId === expense.id ? 'Validation...' : 'Approuver le Paiement'}</span>
                  </button>
                </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Motif de Rejet */}
      {rejectingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => {
                setRejectingExpense(null);
                setRejectionReason('');
              }}
              className="absolute right-4 top-4 p-2 rounded-xl bg-slate-100 dark:bg-[#16214A] text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-rose-500">
              <XCircle className="w-6 h-6" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Motif du Rejet
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Veuillez indiquer la raison du rejet pour la dépense{' '}
              <strong className="text-slate-900 dark:text-white">
                {rejectingExpense.expense_number} ({formatFCFA(rejectingExpense.amount)})
              </strong>. Le motif sera archivé dans le grand livre et visible par le responsable finances.
            </p>

            <form onSubmit={confirmReject} className="space-y-4">
              <textarea
                required
                rows={3}
                placeholder="Ex: Devis trop élevé / Pièce justificative manquante / Report budgétaire..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingExpense(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={processingId === rejectingExpense.id || !rejectionReason.trim()}
                  className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirmer le Rejet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
