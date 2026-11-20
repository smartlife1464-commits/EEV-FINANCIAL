import React, { useState } from 'react';
import { BrandLogo } from '../components/common/Brand';
import { brandColor } from '../utils/brand';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { usePeriod } from '../context/PeriodContext';
import { formatFCFA, formatNumber, formatDate, timeAgo, currencyLabel } from '../utils/formatters';
import {
  Wallet,
  Users,
  UserPlus,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Coins,
  ChevronDown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Link } from 'react-router-dom';

export const LeaderDashboard: React.FC = () => {
  const { period, periodLabel, startDate, endDate } = usePeriod();

  const { data: overview, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard-overview', period, startDate, endDate],
    queryFn: () => api.getDashboardOverview(period, startDate, endDate),
  });

  const att = overview?.attendance;
  const fin = overview?.finance;
  const treasury = overview?.treasury;

  // Courbe des recettes de la période (données réelles agrégées par jour / semaine / mois)
  const sparklineData = (fin?.trend || []).map((t: any) => ({ name: t.label, value: t.revenues, expenses: t.expenses }));
  const revenueDelta = (fin?.revenues || 0) - (fin?.previousRevenues || 0);
  const peakRevenue = sparklineData.reduce((m: number, p: any) => Math.max(m, p.value), 0);

  // Répartition réelle de la fréquentation par programme
  const serviceDistribution = (att?.byServiceType || [])
    .filter((t: any) => t.total > 0)
    .map((t: any) => ({ name: t.type, value: t.percentage, total: t.total, count: t.count, color: t.color }));
  const servicesCount = att?.servicesCount || 0;
  const topType = att?.topServiceType;
  const generalFundDelta = (fin?.generalFundPaid || 0) - (fin?.previousGeneralFundPaid || 0);

  const signed = (n: number, suffix = '') => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatNumber(Math.abs(n))}${suffix}`;
  const trendClass = (n: number, favorableWhenUp = true) =>
    n === 0
      ? 'text-slate-500 dark:text-slate-400'
      : (n > 0) === favorableWhenUp
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-rose-500';

  const activityIcon = (type: string) =>
    type === 'entry' ? Coins : type === 'expense' ? Receipt : type === 'attendance' ? Users : FileCheck;

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-8 rounded-3xl border border-rose-500/30 bg-rose-500/10 text-center space-y-3">
        <p className="text-base font-black text-rose-600 dark:text-rose-300">Impossible de charger le tableau de bord</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{(error as Error)?.message}</p>
        <button onClick={() => refetch()} className="px-5 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-sm cursor-pointer">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* 1. HERO CARD — Grand bandeau de trésorerie avec graphique d'évolution doré éclatant */}
      <div className="relative overflow-hidden rounded-3xl p-7 md:p-9 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-amber-400/30 shadow-md card-hover-effect">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Bloc gauche : Icône + Chiffre majeur */}
          <div className="flex items-start sm:items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 p-4 flex items-center justify-center shrink-0 shadow-xl shadow-amber-400/25">
              <Wallet className="w-9 h-9 md:w-11 md:h-11" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Revenus totaux • Caisse consolidée
              </span>
              <div className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {isLoading ? '…' : formatFCFA(treasury?.consolidatedPhysicalBalance)}
              </div>
              <div className={`flex items-center gap-2 text-xs md:text-sm font-extrabold ${trendClass(revenueDelta)}`}>
                {revenueDelta >= 0 ? <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5" />}
                <span>
                  Recettes {periodLabel.toLowerCase()} : {formatFCFA(fin?.revenues)} ({signed(revenueDelta, ` ${currencyLabel()}`)} vs période précédente)
                </span>
              </div>
            </div>
          </div>

          {/* Bloc droit : Mini courbe dorée avec tag sommet */}
          <div className="flex-1 max-w-lg h-28 relative flex flex-col justify-end">
            <div className="absolute top-0 right-2 z-10">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md">
                {formatFCFA(fin?.revenues)}
              </span>
            </div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={brandColor()} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={brandColor()} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={brandColor()}
                    strokeWidth={3.5}
                    fillOpacity={1}
                    fill="url(#goldGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GRILLE DE 6 CARTES KPI (2 rangées de 3) — Éléments et typographies rehaussés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Carte 1 : Fidèles Présents */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNumber(att?.lastService?.totalAttendance)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Fidèles (Dernier Culte)
              </p>
              <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mt-1 truncate">
                {att?.lastService ? `${att.lastService.name} • ${formatDate(att.lastService.date)}` : 'Aucune fiche saisie'}
              </p>
            </div>
          </div>
        </div>

        {/* Carte 2 : Nouveaux Visiteurs */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
              <UserPlus className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNumber(att?.newVisitors)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Nouveaux visiteurs (période)
              </p>
              <p className={`text-xs font-extrabold mt-1 ${trendClass((att?.newVisitors || 0) - (att?.previousNewVisitors || 0))}`}>
                {signed((att?.newVisitors || 0) - (att?.previousNewVisitors || 0))} vs période précédente
              </p>
            </div>
          </div>
        </div>

        {/* Carte 3 : Cultes & Générations */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0 shadow-sm">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNumber(servicesCount)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Cultes tenus (période)
              </p>
              <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mt-1">
                {formatNumber(att?.periodTotal)} participants • moy. {formatNumber(att?.averagePerService)}
              </p>
            </div>
          </div>
        </div>

        {/* Carte 4 : Dépenses Réussies / Autorisées */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNumber(fin?.approvedCount)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Dépenses autorisées
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {(fin?.approvalRate || 0).toLocaleString('fr-FR')} % des arbitrages
              </p>
            </div>
          </div>
        </div>

        {/* Carte 5 : Dépenses Rejetées */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0 shadow-sm">
              <XCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNumber(fin?.rejectedCount)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Dépenses rejetées
              </p>
              <p className="text-xs font-extrabold text-rose-500 mt-1">
                {(fin?.rejectionRate || 0).toLocaleString('fr-FR')} % des arbitrages
                {overview?.pendingApprovalsCount ? ` • ${overview.pendingApprovalsCount} en attente` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Carte 6 : Recettes enregistrées */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNumber(fin?.entriesCount)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Recettes encaissées
              </p>
              <p className={`text-xs font-extrabold mt-1 ${trendClass((fin?.entriesCount || 0) - (fin?.previousEntriesCount || 0))}`}>
                {signed((fin?.entriesCount || 0) - (fin?.previousEntriesCount || 0))} vs période précédente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DEUX CARTES MOYENNES (Charges courantes & Solde de trésorerie disponible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Charges consommées (Fonds Général) */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex items-center justify-between card-hover-effect">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0 shadow-sm">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatFCFA(fin?.generalFundPaid)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Charges courantes payées (Fonds Général)
              </p>
              <p className={`text-xs font-extrabold mt-1 ${trendClass(generalFundDelta, false)}`}>
                {signed(generalFundDelta, ` ${currencyLabel()}`)} vs période précédente
              </p>
            </div>
          </div>
        </div>

        {/* Solde de trésorerie disponible */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-amber-400/25 shadow-sm flex items-center justify-between card-hover-effect">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 p-3.5 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/25">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-amber-500 uppercase tracking-wider">
                Solde de trésorerie disponible
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {formatFCFA(treasury?.generalFundFreeBalance)}
              </div>
              <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mt-1">
                Fonds Général libre, après {formatFCFA(treasury?.pendingCommitmentsTotal)} d’engagements
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BLOC ANALYTIQUE EN 3 COLONNES — Graphiques amples et aérés */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne 1 : Évolution des revenus */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col justify-between card-hover-effect">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Évolution des revenus
            </h2>
            <div className="relative">
              <span className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs font-bold text-amber-500">
                <span>{periodLabel}</span>
              </span>
            </div>
          </div>

          <div className="h-72 md:h-80 w-full mt-2 relative">
            <div className="absolute top-2 right-4 z-10">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md">
                Pic : {formatFCFA(peakRevenue)}
              </span>
            </div>
            {sparklineData.every((p: any) => !p.value) && (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400 z-0">
                Aucune recette enregistrée sur la période
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={brandColor()} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={brandColor()} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1_000_000 ? `${(val / 1_000_000).toLocaleString('fr-FR')}M` : `${val / 1000}k`)}
                />
                <Tooltip
                  formatter={(val: any) => [formatFCFA(Number(val)), 'Revenus']}
                  contentStyle={{
                    backgroundColor: '#091338',
                    border: '1px solid rgba(255, 188, 0, 0.4)',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={brandColor()}
                  strokeWidth={3.5}
                  fill="url(#chartGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Colonne 2 : Répartition des cultes */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col justify-between card-hover-effect">
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-4">
            Répartition des cultes
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6 my-auto">
            {/* Donut avec texte centré 120 Cultes */}
            <div className="w-52 h-52 relative flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(serviceDistribution.length ? serviceDistribution : [{ name: 'Aucun', value: 100, color: '#334155' }]).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white block">
                  {servicesCount}
                </span>
                <span className="text-xs text-slate-400 uppercase font-black tracking-wider">
                  Cultes
                </span>
              </div>
            </div>

            {/* Légende avec pourcentages */}
            <div className="flex-1 w-full space-y-2.5 text-sm">
              {serviceDistribution.length === 0 && (
                <p className="text-xs text-slate-400 font-semibold">Aucune fiche de présence sur la période.</p>
              )}
              {serviceDistribution.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne 3 : Activité récente — Liste élégante et lisible */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col justify-between card-hover-effect">
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-4">
            Activité récente
          </h2>

          <div className="space-y-3.5">
            {(overview?.recentActivity || []).length === 0 && (
              <p className="text-xs text-slate-400 font-semibold">Aucune activité récente.</p>
            )}
            {(overview?.recentActivity || []).map((a: any, idx: number) => {
              const Icon = activityIcon(a.type);
              const negative = ['Rejetée', 'Annulée'].includes(a.status);
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] text-sm">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate" title={a.title}>
                        {a.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {a.amount ? `${formatFCFA(a.amount)} • ` : ''}
                        {timeAgo(a.at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ml-2 border ${
                      negative
                        ? 'bg-rose-500/15 text-rose-500 border-rose-500/25'
                        : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. DERNIÈRE LIGNE (2 Blocs : Culte le plus fréquenté & Félicitations) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Programme le plus fréquenté */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 card-hover-effect">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-amber-400/35 shrink-0 relative flex items-center justify-center shadow-md">
              <BrandLogo className="w-14 h-14 object-contain" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">
                Programme le plus fréquenté
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {topType && topType.total > 0 ? topType.type : '—'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {topType && topType.total > 0
                  ? `${topType.percentage}% de la fréquentation de la période (moy. ${formatNumber(topType.average)} / culte)`
                  : 'Aucune donnée de fréquentation sur la période'}
              </p>
            </div>
          </div>

          <Link
            to="/attendance"
            className="px-5 py-3 rounded-2xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#16214A] dark:hover:bg-[#1E2C60] text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap"
          >
            Voir tous les cultes
          </Link>
        </div>

        {/* Félicitations ! — Bandeau de réussite avec barres ascendantes dorées */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-amber-400/30 shadow-sm flex items-center justify-between gap-5 card-hover-effect">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {(fin?.netCashFlow || 0) >= 0 ? 'Flux de trésorerie positif' : 'Point de vigilance'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {periodLabel} : {formatFCFA(fin?.revenues)} encaissés pour {formatFCFA(fin?.expensesPaid)} décaissés, soit un
                solde net de {formatFCFA(fin?.netCashFlow)}. Caisse consolidée : {formatFCFA(treasury?.consolidatedPhysicalBalance)}.
                {overview?.pendingApprovalsCount
                  ? ` ${overview.pendingApprovalsCount} dépense(s) (${formatFCFA(overview.pendingApprovalsTotalAmount)}) attendent votre arbitrage.`
                  : ''}
              </p>
              {overview?.pendingApprovalsCount ? (
                <Link to="/finance/approvals" className="inline-block mt-3 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black">
                  Arbitrer les dépenses
                </Link>
              ) : null}
            </div>
          </div>

          {/* Illustration barres ascendantes dorées */}
          <div className="hidden sm:flex items-end gap-1.5 h-16 shrink-0 pl-2">
            <div className="w-3 h-5 bg-amber-400/40 rounded-t-sm" />
            <div className="w-3 h-7 bg-amber-400/60 rounded-t-sm" />
            <div className="w-3 h-10 bg-amber-400/80 rounded-t-sm" />
            <div className="w-3 h-13 bg-amber-400 rounded-t-sm" />
            <div className="w-3 h-16 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-sm shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
};
