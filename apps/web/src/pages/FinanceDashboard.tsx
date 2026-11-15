import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { usePeriod } from '../context/PeriodContext';
import { formatFCFA, formatVariation } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Plus,
  Coins,
  ShieldCheck,
  PiggyBank,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  BookOpen,
  FileText,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FinanceDashboard: React.FC = () => {
  const { period, periodLabel, startDate, endDate } = usePeriod();
  const { hasPermission } = useAuth();

  const { data: fin, isLoading, isError, error } = useQuery({
    queryKey: ['finance-dashboard', period, startDate, endDate],
    queryFn: () => api.getFinanceDashboard(period, startDate, endDate),
  });

  const fundBalance = (code: string) =>
    (fin?.funds || []).find((f: any) => f.account?.code === code)?.balance || 0;
  const pendingCount = fin?.pendingApprovalCount || 0;
  const val = (n: number | undefined) => (isLoading ? '…' : formatFCFA(n));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-7 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-emerald-500" />
            <span>Tableau de Bord du Département Finances</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Caisse consolidée unique, ventilation automatique 80/10/10 et décaissements autorisés.
          </p>
          <div className="mt-2.5">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-500 border border-amber-400/30">
              Période active : {periodLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          {hasPermission('canCreateFinancialEntry') && (
          <Link
            to="/finance/entries/new"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Recette</span>
          </Link>
          )}
          {hasPermission('canCreateExpense') && (
          <Link
            to="/finance/expenses/new"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Dépense</span>
          </Link>
          )}
        </div>
      </div>

      {isError && (
        <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-sm font-semibold">
          {(error as Error)?.message || 'Impossible de charger les indicateurs financiers.'}
        </div>
      )}

      {/* 4 Cartes Majeures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-3xl p-6 md:p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
              <ArrowDownCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {val(fin?.totalRevenueMonth)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Recettes de la période
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {fin?.entriesCount || 0} encaissement(s) • {formatVariation(fin?.revenueVariation?.percentage)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-6 md:p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0 shadow-sm">
              <ArrowUpCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {val(fin?.totalExpensesMonth)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Dépenses payées
              </p>
              <p className="text-xs font-extrabold text-rose-500 mt-1">
                Décaissements effectifs • {formatVariation(fin?.expensesVariation?.percentage)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-6 md:p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {val(fin?.netCashFlow)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Flux net de la période
              </p>
              <p className={`text-xs font-extrabold mt-1 ${(fin?.netCashFlow || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {(fin?.netCashFlow || 0) >= 0 ? 'Excédent net' : 'Déficit net'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-6 md:p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-amber-400/30 shadow-sm card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 p-3.5 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/20">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {val(fin?.consolidatedCash)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Caisse Consolidée
              </p>
              <p className="text-xs font-extrabold text-amber-500 mt-1">
                Solde réel physique unique
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compartiments analytiques */}
      <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Compartiments Analytiques de la Caisse
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Règle canonique d'affectation automatique 80% Général / 10% Dîme des Dîmes / 10% Social
            </p>
          </div>
          <Link
            to="/finance/treasury"
            className="text-sm font-bold text-amber-500 hover:text-amber-600"
          >
            Voir la trésorerie détaillée →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A]">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Fonds Général (80%)</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
              {formatFCFA(fundBalance('GENERAL'))}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">Finance 100% des charges d'exploitation</span>
          </div>

          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/25">
            <span className="text-xs font-black uppercase tracking-wider text-amber-500">Dîme des Dîmes (10%)</span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5">
              {formatFCFA(fundBalance('TITHE_OF_TITHES'))}
            </p>
            <span className="text-xs text-amber-500/80 mt-1 block">Fonds sacré réservé à la gouvernance</span>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/25">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-500">Aide Sociale (10%)</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
              {formatFCFA(fundBalance('WELFARE_AID'))}
            </p>
            <span className="text-xs text-emerald-500/80 mt-1 block">Secours, bienfaisance & assistance</span>
          </div>
        </div>
      </div>

      {/* Évolution recettes / dépenses sur la période */}
      <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <h2 className="text-base font-black text-slate-900 dark:text-white mb-4">
          Recettes et dépenses payées — {periodLabel}
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fin?.trend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B833" vertical={false} />
              <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => (v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1000}k`)} />
              <Tooltip formatter={(v: any, name: any) => [formatFCFA(Number(v)), name === 'revenues' ? 'Recettes' : 'Dépenses payées']} />
              <Bar dataKey="revenues" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Raccourcis Opérationnels & Contrôle */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Link
          to="/finance/approvals"
          className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] hover:border-amber-400/50 shadow-sm transition-all group flex items-center justify-between card-hover-effect"
        >
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Approbations</span>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {pendingCount} en attente
            </p>
            <span className="text-xs text-amber-500 font-bold group-hover:underline flex items-center gap-1">
              Examiner <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-400/15 text-amber-500 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </Link>

        <Link
          to="/finance/cash-closing"
          className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] hover:border-amber-400/50 shadow-sm transition-all group flex items-center justify-between card-hover-effect"
        >
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clôture Caisse</span>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              PV & Rapprochement
            </p>
            <span className="text-xs text-amber-500 font-bold group-hover:underline flex items-center gap-1">
              Ouvrir <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </Link>

        <Link
          to="/finance/treasury"
          className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] hover:border-amber-400/50 shadow-sm transition-all group flex items-center justify-between card-hover-effect"
        >
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trésorerie</span>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              Comptes & Caisse
            </p>
            <span className="text-xs text-amber-500 font-bold group-hover:underline flex items-center gap-1">
              Consulter <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <PiggyBank className="w-6 h-6" />
          </div>
        </Link>

        <Link
          to="/reports"
          className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] hover:border-amber-400/50 shadow-sm transition-all group flex items-center justify-between card-hover-effect"
        >
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rapports</span>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              Bilans & Exports
            </p>
            <span className="text-xs text-amber-500 font-bold group-hover:underline flex items-center gap-1">
              Générer <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </Link>
      </div>
    </div>
  );
};
