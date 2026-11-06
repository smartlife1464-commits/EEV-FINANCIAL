import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Plus,
  ArrowLeftRight,
  PieChart,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FinanceDashboard: React.FC = () => {
  const { data: fin } = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: () => api.getFinanceDashboard(),
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-500" />
            <span>Tableau de Bord du Département Finances</span>
          </h1>
          <p className="text-xs text-slate-500">
            Gestion opérationnelle de la caisse, des encaissements et des décaissements autorisés.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/finance/entries/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Recette</span>
          </Link>
          <Link
            to="/finance/expenses/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Dépense</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Recettes du Mois"
          value={formatFCFA(fin?.totalRevenueMonth || 3500000)}
          subtitle="Encaissé brut"
          icon={ArrowDownCircle}
          accentColor="emerald"
        />
        <StatCard
          title="Dépenses Payées"
          value={formatFCFA(fin?.totalExpensesMonth || 350000)}
          subtitle="Décaissements validés"
          icon={ArrowUpCircle}
          accentColor="rose"
        />
        <StatCard
          title="Flux Net Mensuel"
          value={formatFCFA(fin?.netCashFlow || 3150000)}
          subtitle="Excédent net de la période"
          icon={TrendingUp}
          accentColor="indigo"
        />
        <StatCard
          title="Solde Caisse Consolidée"
          value={formatFCFA(fin?.consolidatedCash || 14750000)}
          subtitle="Espèces & Banques consolidés"
          icon={Wallet}
          accentColor="gold"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Rappels & Opérations Récentes
        </h2>
        <p className="text-xs text-slate-500">
          Chaque recette de dîme et d'offrande ordinaire génère automatiquement les écritures 80% Fonds Général, 10% Dîme des dîmes, et 10% Aide sociale.
        </p>
        <div className="pt-2 flex gap-4">
          <Link
            to="/finance/treasury"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Consulter les compartiments analytiques
          </Link>
          <Link
            to="/finance/transfers"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Effectuer un transfert interne
          </Link>
        </div>
      </div>
    </div>
  );
};
