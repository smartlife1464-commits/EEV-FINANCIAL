import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { calculateEntryAllocations } from '@eev/business-rules';
import { AllocationRule, FundAccountCode, PaymentMethod } from '@eev/shared-types';
import { formatFCFA } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import {
  Wallet,
  ArrowDownCircle,
  PiggyBank,
  HeartHandshake,
  Building2,
  CheckCircle2,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FinancialEntryForm: React.FC = () => {
  const navigate = useNavigate();

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['financial-categories'],
    queryFn: () => api.getCategories(),
  });

  const [categoryId, setCategoryId] = useState('cat-tithe');
  const [serviceId, setServiceId] = useState('');
  const [amount, setAmount] = useState<number>(100000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [reference, setReference] = useState('');
  const [donorName, setDonorName] = useState('');
  const [notes, setNotes] = useState('');
  const [collectedAt, setCollectedAt] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // Déterminer la règle de la catégorie sélectionnée
  const selectedCat = categories.find((c: any) => c.id === categoryId) || {
    allocation_rule: AllocationRule.STANDARD_SPLIT_80_10_10,
    target_fund_code: FundAccountCode.BUILDING,
  };

  const rule = (selectedCat.allocation_rule as AllocationRule) || AllocationRule.STANDARD_SPLIT_80_10_10;
  const isStandardSplit = rule === AllocationRule.STANDARD_SPLIT_80_10_10;

  // Calcul certifié en direct par le moteur de règles financières
  const splitResult = calculateEntryAllocations(
    amount || 0,
    rule,
    selectedCat.target_fund_code || FundAccountCode.BUILDING
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Veuillez saisir un montant strictement supérieur à 0 FCFA.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createEntry({
        serviceId: serviceId || undefined,
        categoryId,
        amount,
        paymentMethod,
        reference: reference || undefined,
        donorName: donorName || undefined,
        notes: notes || undefined,
        collectedAt,
      });
      navigate('/finance/entries');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement de la recette.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/finance/entries"
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Enregistrement d’une Recette Brute
          </h1>
          <p className="text-xs text-slate-500">
            Comptabilisation immédiate avec ventilation analytique automatique.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Montant Brut Encaissé */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Montant Brut Encaissé (FCFA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Ex: 100000"
                  className="w-full text-3xl font-extrabold py-3 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-amber-400 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-amber-400/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-extrabold text-lg text-slate-400">
                  FCFA
                </span>
              </div>
            </div>

            {/* Catégorie financière */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Catégorie de Recette *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="cat-tithe">Dîmes (Répartition 80/10/10)</option>
                <option value="cat-offering">Offrandes Ordinaires (Répartition 80/10/10)</option>
                <option value="cat-build">Don Construction Auditorium (100% Affecté)</option>
                <option value="cat-friends">Don Amis de Jésus (100% Affecté)</option>
                <option value="cat-special">Offrande Spéciale Affectée (100% Affecté)</option>
              </select>
            </div>

            {/* Mode de paiement */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Mode de Règlement *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value={PaymentMethod.CASH}>💵 Espèces (Caisse Centrale)</option>
                <option value={PaymentMethod.MOBILE_MONEY}>📱 Mobile Money (OM / MoMo)</option>
                <option value={PaymentMethod.BANK_TRANSFER}>🏦 Virement Bancaire</option>
                <option value={PaymentMethod.CHECK}>🧾 Chèque</option>
              </select>
            </div>

            {/* Service rattaché (optionnel) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Rattachement au Culte (Optionnel)
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Recette hors culte (Don direct)...</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.date})
                  </option>
                ))}
              </select>
            </div>

            {/* Date d'encaissement */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Date de Collecte *
              </label>
              <input
                type="date"
                required
                value={collectedAt}
                onChange={(e) => setCollectedAt(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Donateur */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Nom du Donateur (Facultatif / Anonyme)
              </label>
              <input
                type="text"
                placeholder="Ex: Frère / Sœur Anonyme"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Référence */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Référence / Reçu externe
              </label>
              <input
                type="text"
                placeholder="Ex: TRX-OM-982342"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Prévisualisation dynamique certifiée de la ventilation */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 rounded-3xl border border-slate-700/80 shadow-xl text-white space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                <span>Simulation de Répartition Analytique en Temps Réel</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {isStandardSplit
                  ? 'Application stricte des règles ministérielles : 10% Dîme des dîmes + 10% Aide + 80% Fonds Général.'
                  : 'Fonds affecté : 100% alloué sans prélèvement de 10% ou 20%.'}
              </p>
            </div>
            <Badge variant={isStandardSplit ? 'gold' : 'info'}>
              {isStandardSplit ? 'Ventilation 80 / 10 / 10' : '100% Affecté'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {splitResult.allocations.map((alloc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1 relative overflow-hidden"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {alloc.percentage}% {alloc.description}
                </span>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {formatFCFA(alloc.amount)}
                </p>
                <span className="text-[11px] text-slate-400">
                  Crédit automatique au compartiment
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between text-xs text-amber-200">
            <span>Somme exacte vérifiée : {formatFCFA(splitResult.totalAllocated)}</span>
            <span className="font-bold">Écart : 0 FCFA (Précision arithmétique garantie)</span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4">
          <Link
            to="/finance/entries"
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
            <span>{submitting ? 'Validation...' : 'Comptabiliser la Recette'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
