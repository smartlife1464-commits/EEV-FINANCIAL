import React, { useState } from 'react';
import { brandColor } from '../../utils/brand';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatFCFA } from '../../utils/formatters';
import { PeriodSelector } from '../../components/analytics/PeriodSelector';
import { usePeriod } from '../../context/PeriodContext';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Coins,
  ShieldAlert,
  ShieldCheck,
  Building2,
  PieChart as PieIcon,
  Download,
  BarChart3,
  Users,
  PiggyBank,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const FinancialAnalytics: React.FC = () => {
  const { period, startDate: customStart, endDate: customEnd, setPeriod: handlePeriodChange } = usePeriod();

  const { data: finData, isLoading } = useQuery({
    queryKey: ['financial-analytics', period, customStart, customEnd],
    queryFn: () => api.getFinancialAnalytics(period, customStart, customEnd),
  });

  const handleExportCSV = () => {
    api.exportAnalyticsCsv('finance', period, customStart, customEnd).catch((err) => toast.error('Export impossible', { description: err.message }));
  };

  const revenues = finData?.revenues;
  const expenses = finData?.expenses;
  const treasury = finData?.treasury;

  const SPLIT_COLORS = [brandColor(), '#6366F1', '#10B981', '#EC4899', '#0EA5E9', '#F97316'];
  const splitData: { name: string; amount: number; color: string; percentage: number }[] = (revenues?.splitBreakdown || []).map((l: any, i: number) => ({
    name: `${l.label} (${l.percentage}%)`,
    amount: l.amount,
    color: SPLIT_COLORS[i % SPLIT_COLORS.length],
    percentage: l.percentage,
  }));
  const splitLabel = (revenues?.splitBreakdown || []).map((l: any) => l.percentage).join(' / ');

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-500" />
            <span>Analyses Approfondies des Finances & Trésorerie</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ventilation automatique des recettes ordinaires, suivi des fonds affectés, analyse des décaissements et équilibre de caisse.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PeriodSelector
            selectedPeriod={period}
            onPeriodChange={handlePeriodChange}
            activeRangeLabel={finData?.range?.label}
          />

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] hover:bg-slate-200 dark:hover:bg-[#1e2c63] text-slate-900 dark:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Onglets */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#16214A] pb-3 overflow-x-auto">
        <Link
          to="/analytics"
          className="px-4 py-2 rounded-2xl bg-white dark:bg-[#0C1530] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#16214A] font-bold text-xs flex items-center gap-2 shrink-0 transition-all"
        >
          <BarChart3 className="w-4 h-4 text-amber-500" />
          <span>Vue Globale KPI</span>
        </Link>
        <Link
          to="/analytics/attendance"
          className="px-4 py-2 rounded-2xl bg-white dark:bg-[#0C1530] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#16214A] font-bold text-xs flex items-center gap-2 shrink-0 transition-all"
        >
          <Users className="w-4 h-4 text-blue-500" />
          <span>Analyses de Fréquentation</span>
        </Link>
        <Link
          to="/analytics/finance"
          className="px-4 py-2 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-sm flex items-center gap-2 shrink-0"
        >
          <Wallet className="w-4 h-4" />
          <span>Analyses Financières</span>
        </Link>
      </div>

      {/* Règle d'or de gestion */}
      <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-amber-900 dark:text-amber-300 text-xs">
        <ShieldCheck className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <strong className="font-bold">Principe de Gestion Statutaire :</strong> Les recettes ordinaires (dîmes et offrandes ordinaires) sont soumises à la clé de ventilation de l’église. Les dons affectés sont alloués à <strong>100% sans aucun prélèvement</strong>. Les charges courantes de fonctionnement sont supportées par le <strong>compartiment de fonctionnement</strong>.
        </div>
      </div>

      {/* 4 Cartes Clés Financières */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
              Recettes Brutes Période
            </span>
            <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatFCFA(revenues?.totalGross ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400">
            Dîmes, offrandes et dons affectés
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Recettes Ordinaires Combinées
            </span>
            <Coins className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500">
            {formatFCFA(revenues?.ordinaryCombined ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400">
            Base exacte de la ventilation
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
              Décaissements Réels Payés
            </span>
            <ArrowUpCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatFCFA(expenses?.paid ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400">
            Seules sorties réelles de liquidités
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
              Dons affectés
            </span>
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-500">
            {formatFCFA(revenues?.designated?.total ?? 0)}
          </div>
          <p className="text-[11px] text-emerald-500 font-bold">
            100% alloué (0% de prélèvement)
          </p>
        </div>
      </div>

      {/* C. VENTILATION AUTOMATIQUE & DONS AFFECTÉS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventilation */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#16214A] pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span>Ventilation automatique {splitLabel}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculée sur les recettes ordinaires ({formatFCFA(revenues?.ordinaryCombined ?? 0)}).
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-500 border border-amber-400/30">
              Statutaire
            </span>
          </div>

          <div className="space-y-3">
            {splitData.map((item) => (
              <div
                key={item.name}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {formatFCFA(item.amount)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-[#16214A] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* E. ANALYSE DES DÉPENSES PAR CATÉGORIE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#16214A] pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-rose-500" />
                <span>Répartition des Dépenses de Fonctionnement</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Imputées par défaut sur le compartiment de fonctionnement.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/25">
              Total : {formatFCFA(expenses?.paid ?? 0)}
            </span>
          </div>

          <div className="space-y-3">
            {(expenses?.byCategory || []).map((cat: any) => (
              <div
                key={cat.name}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {formatFCFA(cat.amount)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-[#16214A] text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ÉVOLUTION HISTORIQUE MENSUELLE DES RECETTES ET DES DÉPENSES */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <span>Évolution des Flux Financiers & Excédent Net de Caisse</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historique des dîmes, offrandes et sorties réelles de trésorerie.
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={finData?.monthlyTrends || []}>
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(val: any) => formatFCFA(Number(val))}
                contentStyle={{ backgroundColor: '#091338', borderColor: '#16214A', borderRadius: 16 }}
              />
              <Legend />
              <Bar dataKey="tithes" name="Dîmes" fill={brandColor()} radius={[6, 6, 0, 0]} />
              <Bar dataKey="offerings" name="Offrandes Ordinaires" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="designated" name="Dons affectés" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="paidExpenses" name="Dépenses Payées" fill="#F43F5E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

