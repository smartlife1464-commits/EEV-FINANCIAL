import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import {
  Wallet,
  PiggyBank,
  HeartHandshake,
  Building2,
  ArrowLeftRight,
  ShieldAlert,
  Coins,
  ShieldCheck,
  TrendingUp,
  FileText,
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

  const fundsList = treasury?.funds || [
    {
      account: { code: 'GENERAL', name: 'Fonds Général (80% Dîmes/Offrandes)', isRestricted: false },
      balance: 8500000,
      percentageOfTotal: 57.6,
      description: 'Finance 100% des charges courantes du culte et de fonctionnement.',
    },
    {
      account: { code: 'TITHE_OF_TITHES', name: 'Dîme des Dîmes (10%)', isRestricted: true },
      balance: 1450000,
      percentageOfTotal: 9.8,
      description: 'Prélèvement sacerdotal statutaire réservé à la direction pastorale.',
    },
    {
      account: { code: 'WELFARE_AID', name: 'Aide Sociale & Secours (10%)', isRestricted: true },
      balance: 1300000,
      percentageOfTotal: 8.8,
      description: 'Prélèvement statutaire réservé aux secours, orphelins et personnes démunies.',
    },
    {
      account: { code: 'BUILDING', name: 'Construction Auditorium', isRestricted: true },
      balance: 2800000,
      percentageOfTotal: 19.0,
      description: 'Fonds affecté à 100% sans aucun prélèvement pour le futur grand temple.',
    },
    {
      account: { code: 'FRIENDS_OF_JESUS', name: 'Amis de Jésus (Missions)', isRestricted: true },
      balance: 700000,
      percentageOfTotal: 4.8,
      description: 'Fonds affecté à 100% pour les évangélisations et missions extérieures.',
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            <span>Trésorerie Consolidée & Compartiments Analytiques</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Une caisse physique unique liquide avec compartimentation analytique stricte et étanche.
          </p>
        </div>

        <Link
          to="/finance/transfers"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Effectuer un Virement Inter-Fonds</span>
        </Link>
      </div>

      {/* Note d'intégrité */}
      <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-amber-900 dark:text-amber-300 text-xs">
        <ShieldCheck className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <strong className="font-bold">Principe d'Intégrité de la Caisse Unique :</strong> Le ministère ne dispose que d'une seule caisse physique consolidée (espèces / comptes bancaires / mobile money). Tout transfert entre compartiments analytiques modifie l'affectation mais ne change en aucun cas le solde global de la caisse.
        </div>
      </div>

      {/* 3 Métriques Majeures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-400/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider opacity-80">
              Caisse Physique Réelle
            </span>
            <Wallet className="w-6 h-6 opacity-70" />
          </div>
          <p className="text-3xl font-black mt-3">{formatFCFA(physicalBalance)}</p>
          <span className="text-xs font-bold opacity-90 mt-2 block">
            Liquidités totales sous responsabilité du ministère
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Fonds Général Libre
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-3">
            {formatFCFA(freeBalance)}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block font-medium">
            Montant disponible pour nouvelles dépenses de fonctionnement
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-500">
              Engagements en Attente
            </span>
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-3">
            {formatFCFA(pendingCommitments)}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block font-medium">
            Dépenses autorisées par le Leader, prêtes pour décaissement
          </span>
        </div>
      </div>

      {/* Détail de chaque compartiment */}
      <div className="bg-white dark:bg-[#0C1530] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Situation Détaillée des Compartiments Analytiques
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ventilation mathématique des 14 750 000 FCFA dans les 5 comptes dédiés.
            </p>
          </div>
          <Link
            to="/finance/transactions"
            className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            <span>Grand Livre →</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fundsList.map((fund: any, idx: number) => {
            const isGeneral = fund.account.code === 'GENERAL';
            const isTithe = fund.account.code === 'TITHE_OF_TITHES';
            const isAid = fund.account.code === 'WELFARE_AID';
            const isBuilding = fund.account.code === 'BUILDING';

            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200/60 dark:bg-[#16214A] text-slate-700 dark:text-slate-300">
                      {fund.account.code}
                    </span>
                    <span className="text-xs font-black text-amber-500">
                      {fund.percentageOfTotal ? `${fund.percentageOfTotal}%` : ''}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                    {fund.account.name}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {fund.description || (isGeneral ? 'Finance les charges courantes' : 'Fonds réservé')}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#16214A]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Solde Actuel
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    {formatFCFA(fund.balance)}
                  </div>

                  {/* Barre visuelle de proportion */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-[#16214A] rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isGeneral
                          ? 'bg-amber-400'
                          : isTithe
                          ? 'bg-indigo-500'
                          : isAid
                          ? 'bg-emerald-500'
                          : isBuilding
                          ? 'bg-blue-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, fund.percentageOfTotal || 10))}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
