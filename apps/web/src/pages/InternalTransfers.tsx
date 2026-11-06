import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA } from '../utils/formatters';
import { ArrowLeftRight, CheckCircle2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const InternalTransfers: React.FC = () => {
  const navigate = useNavigate();

  const { data: funds = [] } = useQuery({
    queryKey: ['funds'],
    queryFn: () => api.getFunds(),
  });

  const [sourceFundId, setSourceFundId] = useState('fnd-gen');
  const [destinationFundId, setDestinationFundId] = useState('fnd-build');
  const [amount, setAmount] = useState<number>(20000);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sourceFund = funds.find((f: any) => f.id === sourceFundId);
  const destFund = funds.find((f: any) => f.id === destinationFundId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceFundId === destinationFundId) {
      alert('Le fonds source et le fonds destination doivent être distincts.');
      return;
    }
    if (!amount || amount <= 0) {
      alert('Le montant doit être supérieur à 0 FCFA.');
      return;
    }
    if (sourceFund && sourceFund.current_balance < amount) {
      alert(`Solde insuffisant dans le fonds source (${formatFCFA(sourceFund.current_balance)}).`);
      return;
    }

    setSubmitting(true);
    try {
      await api.createTransfer({
        sourceFundId,
        destinationFundId,
        amount,
        reason,
      });
      alert('Transfert interne enregistré avec succès !');
      navigate('/finance/treasury');
    } catch (err: any) {
      alert(err.message || 'Erreur lors du transfert.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/finance/treasury"
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Virement Analytique Inter-Fonds
          </h1>
          <p className="text-xs text-slate-500">
            Ajustement entre compartiments sans altération du solde physique consolidé de la caisse.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3 text-blue-900 dark:text-blue-300 text-xs">
        <AlertTriangle className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
        <div>
          <strong className="font-bold">Contrôle de Traçabilité :</strong> Cette opération crédite le compte destination et débite le compte source. Elle n'est PAS comptabilisée comme une nouvelle recette externe.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fonds Source */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Fonds Source (Débité) *
              </label>
              <select
                value={sourceFundId}
                onChange={(e) => setSourceFundId(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              >
                {funds.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({formatFCFA(f.current_balance)})
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-400 block">
                Disponible : {formatFCFA(sourceFund?.current_balance || 8500000)}
              </span>
            </div>

            {/* Fonds Destination */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Fonds Destination (Crédité) *
              </label>
              <select
                value={destinationFundId}
                onChange={(e) => setDestinationFundId(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              >
                {funds.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({formatFCFA(f.current_balance)})
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-400 block">
                Solde actuel : {formatFCFA(destFund?.current_balance || 2800000)}
              </span>
            </div>

            {/* Montant */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Montant du Transfert (FCFA) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-extrabold py-3 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Motif */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Motif & Justification de l’Arbitrage *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Soutien exceptionnel du fonds général pour l'achat de ciment auditorium..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end gap-4">
          <Link
            to="/finance/treasury"
            className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-900 bg-slate-100 dark:bg-slate-800"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-400/20 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{submitting ? 'Exécution...' : 'Exécuter le Transfert'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
