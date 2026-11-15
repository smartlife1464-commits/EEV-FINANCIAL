import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA } from '../utils/formatters';
import {
  ArrowLeftRight,
  CheckCircle2,
  ArrowLeft,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const InternalTransfers: React.FC = () => {
  const navigate = useNavigate();

  const { data: funds = [] } = useQuery({
    queryKey: ['funds'],
    queryFn: () => api.getFunds(),
  });

  const [sourceFundId, setSourceFundId] = useState('');
  const [destinationFundId, setDestinationFundId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Valeurs par défaut réelles (identifiants PocketBase) : Fonds Général → Construction Auditorium
  useEffect(() => {
    if (!funds.length) return;
    if (!sourceFundId) setSourceFundId((funds.find((f: any) => f.code === 'GENERAL') || funds[0]).id);
    if (!destinationFundId) setDestinationFundId((funds.find((f: any) => f.code === 'BUILDING') || funds[1] || funds[0]).id);
  }, [funds, sourceFundId, destinationFundId]);

  const sourceFund: any = funds.find((f: any) => f.id === sourceFundId) || { id: '', name: '—', current_balance: 0 };
  const destFund: any = funds.find((f: any) => f.id === destinationFundId) || { id: '', name: '—', current_balance: 0 };

  const sourceBalanceAfter = Math.max(0, (sourceFund.current_balance || 0) - (amount || 0));
  const destBalanceAfter = (destFund.current_balance || 0) + (amount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceFundId === destinationFundId) {
      toast.error('Le fonds source et le fonds destination doivent être strictement distincts.');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Le montant doit être strictement supérieur à 0 FCFA.');
      return;
    }
    if (sourceFund && sourceFund.current_balance < amount) {
      toast.error(`Solde insuffisant dans le fonds source (${formatFCFA(sourceFund.current_balance)}).`);
      return;
    }
    if (!reason.trim()) {
      toast.error('Le motif du transfert est obligatoire.');
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
      toast.success('Transfert interne enregistré avec succès !');
      navigate('/finance/treasury');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du transfert.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex items-center gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <Link
          to="/finance/treasury"
          className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-amber-500" />
            <span>Virement Analytique Inter-Fonds</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ajustement entre compartiments sans modification du solde consolidé physique de la caisse.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3.5 text-blue-900 dark:text-blue-300 text-xs">
        <ShieldCheck className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
        <div>
          <strong className="font-bold">Traçabilité & Équilibre :</strong> Cette opération crédite le compartiment destination et débite le compartiment source. Les deux écritures sont enregistrées de manière indélébile dans le Grand Livre.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[#0C1530] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          {/* Montant */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Montant à Transférer (FCFA) *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Ex: 100000"
                className="w-full text-3xl font-black py-4 px-5 bg-slate-50 dark:bg-[#070D22] border-2 border-amber-400/80 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-amber-400/20"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-base text-amber-500">
                FCFA
              </span>
            </div>
          </div>

          {/* Sélection Source & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Fonds Source (Débité) *
              </label>
              <select
                value={sourceFundId}
                onChange={(e) => setSourceFundId(e.target.value)}
                required
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              >
                {funds.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({formatFCFA(f.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Fonds Destination (Crédité) *
              </label>
              <select
                value={destinationFundId}
                onChange={(e) => setDestinationFundId(e.target.value)}
                required
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              >
                {funds.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({formatFCFA(f.current_balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Simulation Visuelle Avant / Après */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Impact Immédiat sur les Compartiments
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-[#0C1530] border border-rose-500/30">
                <span className="text-[10px] font-bold uppercase text-rose-500">Débit Source</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {sourceFund.name}
                </p>
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 dark:border-[#16214A]">
                  <span className="text-slate-400">Après virement :</span>
                  <span className="font-mono font-black text-rose-500">
                    {formatFCFA(sourceBalanceAfter)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#0C1530] border border-emerald-500/30">
                <span className="text-[10px] font-bold uppercase text-emerald-500">Crédit Destination</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {destFund.name}
                </p>
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 dark:border-[#16214A]">
                  <span className="text-slate-400">Après virement :</span>
                  <span className="font-mono font-black text-emerald-500">
                    {formatFCFA(destBalanceAfter)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Motif du transfert */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Motif & Décision du Virement *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ex: Décision pastorale n° 12 d'affectation complémentaire au projet Auditorium..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4">
          <Link
            to="/finance/treasury"
            className="px-6 py-3 rounded-2xl font-bold text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-[#16214A] transition-all"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-400/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Validation...' : 'Exécuter le Virement'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
