import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { FundAccountCode } from '@eev/shared-types';
import { formatFCFA } from '../utils/formatters';
import { ArrowUpCircle, CheckCircle2, ArrowLeft, AlertCircle, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ExpenseForm: React.FC = () => {
  const navigate = useNavigate();

  const { data: funds = [] } = useQuery({
    queryKey: ['funds'],
    queryFn: () => api.getFunds(),
  });

  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => api.getExpenseCategories(),
  });

  const [categoryId, setCategoryId] = useState('expcat-elec');
  const [fundAccountId, setFundAccountId] = useState('fnd-gen');
  const [amount, setAmount] = useState<number>(50000);
  const [beneficiary, setBeneficiary] = useState('');
  const [purpose, setPurpose] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Solde disponible dans le fonds sélectionné
  const selectedFund = funds.find((f: any) => f.id === fundAccountId) || {
    name: 'Fonds Général (80%)',
    current_balance: 8500000,
  };

  const isFundRestricted = selectedFund.code && selectedFund.code !== 'GENERAL';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Veuillez saisir un montant strictement supérieur à 0 FCFA.');
      return;
    }
    if (!beneficiary.trim() || !purpose.trim()) {
      alert('Le bénéficiaire et le motif sont obligatoires.');
      return;
    }
    if (amount > (selectedFund.current_balance || 0)) {
      alert(`Le montant demandé (${formatFCFA(amount)}) dépasse le solde disponible dans le fonds (${formatFCFA(selectedFund.current_balance || 0)}).`);
      return;
    }

    setSubmitting(true);
    try {
      await api.createExpense({
        categoryId,
        fundAccountId,
        amount,
        beneficiary,
        purpose,
        receiptUrl: receiptUrl || undefined,
      });
      navigate('/finance/expenses');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de la dépense.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex items-center gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <Link
          to="/finance/expenses"
          className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6 text-rose-500" />
            <span>Demande d’Engagement de Dépense</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Toute dépense est enregistrée au statut 'En attente' et requiert l'accord préalable du Leader Principal.
          </p>
        </div>
      </div>

      {/* Règle d'or de gestion */}
      <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-amber-900 dark:text-amber-300 text-xs">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <strong className="font-bold">Règle Financière Non Négociable :</strong> Les charges courantes de fonctionnement (électricité, eau, sonorisation, transport, honoraires, loyer) sont exclusivement imputées sur les <strong>80% du Fonds Général</strong>. Les fonds affectés (Auditorium, Aide sociale, Dîme des dîmes) ne supportent aucune charge d'exploitation.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[#0C1530] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Montant de la dépense */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Montant Requis (FCFA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Ex: 50000"
                  className="w-full text-3xl font-black py-4 px-5 bg-slate-50 dark:bg-[#070D22] border-2 border-rose-500/80 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-rose-500/20"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-base text-rose-500">
                  FCFA
                </span>
              </div>
            </div>

            {/* Compartiment budgétaire imputé */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Compartiment Imputé *
              </label>
              <select
                value={fundAccountId}
                onChange={(e) => setFundAccountId(e.target.value)}
                required
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              >
                {funds.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name} (Solde : {formatFCFA(f.current_balance)})
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">Solde disponible :</span>
                <span className="font-extrabold text-amber-500">
                  {formatFCFA(selectedFund.current_balance || 0)}
                </span>
              </div>
            </div>

            {/* Catégorie de dépense */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Ligne Budgétaire / Nature *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="expcat-elec">Électricité & Énergie</option>
                <option value="expcat-water">Eau & Assainissement</option>
                <option value="expcat-trans">Transport & Logistique</option>
                <option value="expcat-comm">Communication & Médias</option>
                <option value="expcat-rep">Entretien & Réparations</option>
                <option value="expcat-mat">Matériel & Sonorisation</option>
              </select>
            </div>

            {/* Bénéficiaire */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Bénéficiaire du Paiement *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Prestataire Sonorisation / Société ENEO Cameroun / Responsable logistique"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Motif détaillé */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Motif & Justification Détaillée *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Expliquez la nécessité de la dépense pour le ministère..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Justificatif / Facture */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Référence / Numéro de Facture Proforma ou Reçu
              </label>
              <input
                type="text"
                placeholder="Ex: FACT-2026-0892 ou Réf devis prestataire"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4">
          <Link
            to="/finance/expenses"
            className="px-6 py-3 rounded-2xl font-bold text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-[#16214A] transition-all"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-2xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Transmission...' : 'Soumettre à l’Accord du Leader'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
