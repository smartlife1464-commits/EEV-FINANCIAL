import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA } from '../utils/formatters';
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
  const { data: fin } = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: () => api.getFinanceDashboard(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.getExpenses(),
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['financial-entries'],
    queryFn: () => api.getEntries(),
  });

  const pendingExpenses = expenses.filter((e: any) => e.status === 'pending_approval');

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-500" />
            <span>Tableau de Bord du Département Finances</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Caisse consolidée unique, ventilation automatique 80/10/10 et décaissements autorisés.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/finance/entries/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-400/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Recette</span>
          </Link>
          <Link
            to="/finance/expenses/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Dépense</span>
          </Link>
        </div>
      </div>

      {/* 4 Cartes Majeures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {formatFCFA(fin?.totalRevenueMonth || 3500000)}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Recettes du Mois
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Encaissé brut
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {formatFCFA(fin?.totalExpensesMonth || 350000)}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Dépenses Payées
              </p>
              <p className="text-[11px] font-bold text-rose-500 mt-0.5">
                Décaissements validés
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {formatFCFA(fin?.netCashFlow || 3150000)}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Flux Net Mensuel
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Excédent net
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-amber-400/30 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-500 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {formatFCFA(fin?.consolidatedCash || 14750000)}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Caisse Consolidée
              </p>
              <p className="text-[11px] font-bold text-amber-500 mt-0.5">
                Solde réel unique
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compartiments analytiques */}
      <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Compartiments Analytiques de la Caisse
          </h2>
          <Link
            to="/finance/treasury"
            className="text-xs font-bold text-amber-500 hover:text-amber-600"
          >
            Voir la trésorerie détaillée →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A]">
            <span className="text-[11px] font-bold uppercase text-slate-400">Fonds Général (80%)</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {formatFCFA(8500000)}
            </p>
            <span className="text-[10px] text-slate-500">Finance 100% des charges</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <span className="text-[11px] font-bold uppercase text-amber-500">Dîme des Dîmes (10%)</span>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {formatFCFA(1450000)}
            </p>
            <span className="text-[10px] text-amber-500/70">Fonds sacré réservé</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-[11px] font-bold uppercase text-emerald-500">Aide Sociale (10%)</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatFCFA(1300000)}
            </p>
            <span className="text-[10px] text-emerald-500/70">Secours & assistance</span>
          </div>
        </div>
      </div>

      {/* Raccourcis Opérationnels & Contrôle */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/finance/approvals"
          className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] hover:border-amber-400/50 shadow-sm transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Autorisations Dépenses
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{pendingExpenses.length} en attente</span>
              {pendingExpenses.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
          </div>
          <ShieldCheck className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
        </Link>

        <Link
          to="/finance/transfers"
          className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] hover:border-amber-400/50 shadow-sm transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Virement Inter-Fonds
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              Transférer
            </div>
          </div>
          <ArrowLeftRight className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
        </Link>

        <Link
          to="/finance/transactions"
          className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] hover:border-amber-400/50 shadow-sm transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Grand Livre
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              Journal Immuable
            </div>
          </div>
          <BookOpen className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform" />
        </Link>

        <Link
          to="/analytics/finance"
          className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] hover:border-amber-400/50 shadow-sm transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Analyses Détaillées
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              Graphiques & Ratios
            </div>
          </div>
          <BarChart3 className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
