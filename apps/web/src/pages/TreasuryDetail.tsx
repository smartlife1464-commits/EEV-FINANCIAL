import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import {
  Wallet,
  PiggyBank,
  HeartHandshake,
  Building2,
  ArrowLeftRight,
  ShieldAlert,
  Coins,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TreasuryDetail: React.FC = () => {
  const { data: treasury, isLoading } = useQuery({
    queryKey: ['treasury-overview'],
    queryFn: () => api.getTreasuryOverview(),
  });

  const physicalBalance = treasury?.consolidatedPhysicalBalance || 14750000;
  const freeBalance = treasury?.generalFundFreeBalance || 8150000;
  const pendingCommitments = treasury?.pendingCommitmentsTotal || 350000;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            <span>Trésorerie Consolidée & Compartiments Analytiques</span>
          </h1>
          <p className="text-xs text-slate-500">
            Une caisse physique unique avec compartimentation analytique rigoureuse.
          </p>
        </div>

        <Link
          to="/finance/transfers"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs shadow-md transition-all"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Effectuer un Transfert Analytique</span>
        </Link>
      </div>

      {/* Note d'intégrité */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900 dark:text-amber-300 text-xs">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <strong className="font-bold">Principe d'Intégrité de la Caisse Unique :</strong> Le ministère ne dispose que d'une seule caisse physique consolidée (espèces / comptes bancaires / mobile money). Tout transfert entre compartiments analytiques ne modifie en aucun cas le solde global de la caisse.
        </div>
      </div>

      {/* 3 Métriques Majeures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-400/20">
          <span className="text-xs font-bold uppercase tracking-wider opacity-80 block">
            Caisse Physique Consolidée Réelle
          </span>
          <p className="text-3xl font-black mt-2">{formatFCFA(physicalBalance)}</p>
          <span className="text-xs font-medium opacity-90 mt-1 block">
            Totalité des fonds liquides sous la responsabilité du ministère
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Fonds Général Libre d'Engagement
          </span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {formatFCFA(freeBalance)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            Montant disponible pour nouvelles dépenses de fonctionnement
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">
            Engagements en Attente de Décaissement
          </span>
          <p className="text-3xl font-black text-rose-600 mt-2">
            {formatFCFA(pendingCommitments)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            Dépenses autorisées par le Leader mais non encore payées
          </span>
        </div>
      </div>

      {/* Détail de chaque compartiment */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Situation Détaillée des Compartiments Analytiques
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Fonds Général (80% Dîmes & Offrandes)
              </span>
              <Badge variant="neutral">Ordinaire</Badge>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {formatFCFA(8500000)}
            </p>
            <p className="text-xs text-slate-500">
              Seul compartiment finançant les charges courantes (électricité, loyers, entretien, transport, matériel).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-amber-800 dark:text-amber-300">
                Dîme des Dîmes (10% Dîmes & Offrandes)
              </span>
              <Badge variant="gold">Affecté / Réservé</Badge>
            </div>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300">
              {formatFCFA(1450000)}
            </p>
            <p className="text-xs text-slate-500">
              Prélèvement obligatoire de 10% sur le brut. Compartiment réservé à l’onction sacerdotale et pastorale.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                Aide Sociale & Secours (10% Dîmes & Offrandes)
              </span>
              <Badge variant="success">Affecté / Réservé</Badge>
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {formatFCFA(1300000)}
            </p>
            <p className="text-xs text-slate-500">
              Prélèvement obligatoire de 10% sur le brut. Exclusivement alloué aux orphelins, veuves et secours d’urgence.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-indigo-800 dark:text-indigo-300">
                Fonds Construction Auditorium (100% Affecté)
              </span>
              <Badge variant="info">Fonds Spécial</Badge>
            </div>
            <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
              {formatFCFA(2800000)}
            </p>
            <p className="text-xs text-slate-500">
              Alimenté à 100% par les dons dédiés à l'auditorium. Aucun prélèvement automatique de 10% ou 20%.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-pink-500/5 border border-pink-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-pink-800 dark:text-pink-300">
                Fonds Amis de Jésus (100% Affecté)
              </span>
              <Badge variant="neutral">Partenaires</Badge>
            </div>
            <p className="text-2xl font-black text-pink-700 dark:text-pink-300">
              {formatFCFA(700000)}
            </p>
            <p className="text-xs text-slate-500">
              Dédié aux actions d'évangélisation et d'impact des partenaires affiliés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
