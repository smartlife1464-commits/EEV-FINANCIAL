import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { FundAccountCode } from '@eev/shared-types';
import { ArrowUpCircle, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
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
      <div className="flex items-center gap-4">
        <Link
          to="/finance/expenses"
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Demande d’Engagement de Dépense
          </h1>
          <p className="text-xs text-slate-500">
            La dépense sera soumise à l’approbation préalable du Leader Principal avant tout décaissement.
          </p>
        </div>
      </div>

      {/* Règle d'or de gestion */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900 dark:text-amber-300 text-xs">
        <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <strong className="font-bold">Règle Financière Non Négociable :</strong> Les charges courantes de fonctionnement (électricité, eau, transport, entretien, honoraires) sont exclusivement imputées sur les 80% du Fonds Général. Ne jamais imputer de charge courante sur les fonds affectés (Auditorium, Aide, Dîme des dîmes).
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
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
                  className="w-full text-3xl font-extrabold py-3 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-rose-400 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-rose-400/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-extrabold text-lg text-slate-400">
                  FCFA
                </span>
              </div>
            </div>

            {/* Bénéficiaire */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Bénéficiaire du Paiement *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: ENEO Cameroun, Prestataire sonorisation, etc."
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Catégorie de dépense */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Catégorie Budgétaire *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="expcat-elec">⚡ Électricité & Énergie</option>
                <option value="expcat-water">💧 Eau & Assainissement</option>
                <option value="expcat-transport">🚗 Transport & Déplacements</option>
                <option value="expcat-communication">📡 Communication & Médias</option>
                <option value="expcat-maintenance">🛠️ Entretien & Réparations</option>
                <option value="expcat-equipment">🎤 Matériel & Sonorisation</option>
              </select>
            </div>

            {/* Compartiment de fonds imputé */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Compartiment Analytique Imputé *
              </label>
              <select
                value={fundAccountId}
                onChange={(e) => setFundAccountId(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="fnd-gen">Fonds Général (80% Dîmes/Offrandes - Charges courantes)</option>
                <option value="fnd-aid">Aide Sociale (Assistance directe aux membres)</option>
                <option value="fnd-build">Construction Auditorium (Matériaux & BTP)</option>
                <option value="fnd-tithe">Dîme des Dîmes (Affectation pastorale)</option>
              </select>
            </div>

            {/* Justificatif / Facture */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Lien ou Numéro de Facture / Reçu
              </label>
              <input
                type="text"
                placeholder="Ex: Facture proforma N° 4092"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Motif détaillé */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Motif & Description Détaillée de la Dépense *
              </label>
              <textarea
                rows={3}
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Décrire précisément l'objet de la dépense pour le Leader..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4">
          <Link
            to="/finance/expenses"
            className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-900 bg-slate-100 dark:bg-slate-800"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/20 flex items-center gap-2"
          >
            <ArrowUpCircle className="w-5 h-5" />
            <span>{submitting ? 'Enregistrement...' : 'Soumettre pour Autorisation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

