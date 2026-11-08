import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { usePeriod } from '../context/PeriodContext';
import { formatFCFA } from '../utils/formatters';
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
  const { period, periodLabel } = usePeriod();

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview', period],
    queryFn: () => api.getDashboardOverview(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-list'],
    queryFn: () => api.getExpenses(),
  });

  // Données de tendance pour la courbe dorée (inspirée du screenshot officiel)
  const sparklineData = [
    { name: '1 Mai', value: 800000 },
    { name: '8 Mai', value: 1200000 },
    { name: '15 Mai', value: 1750000 },
    { name: '22 Mai', value: 2100000 },
    { name: '31 Mai', value: 2500000 },
  ];

  // Donut chart de répartition des cultes
  const serviceDistribution = [
    { name: 'Dimanche', value: 42, color: '#3B82F6' },
    { name: 'Mardi', value: 25, color: '#FFBC00' },
    { name: 'Jeudi', value: 15, color: '#8B5CF6' },
    { name: 'Réunions spéciales', value: 10, color: '#06B6D4' },
    { name: 'Autres', value: 8, color: '#64748B' },
  ];

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
                {formatFCFA(overview?.treasury?.consolidatedPhysicalBalance || 14750000)}
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                <span>+2 500 000 FCFA par rapport au mois dernier</span>
              </div>
            </div>
          </div>

          {/* Bloc droit : Mini courbe dorée avec tag sommet */}
          <div className="flex-1 max-w-lg h-28 relative flex flex-col justify-end">
            <div className="absolute top-0 right-2 z-10">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md">
                +2 500 000 FCFA
              </span>
            </div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFBC00" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#FFBC00" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#FFBC00"
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
                500
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Fidèles (Dernier Culte)
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ↗ +35 ce mois
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
                32
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Nouveaux (30j)
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ↗ +30 ce mois
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
                120
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Cultes & Générations
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ↗ +120 ce mois
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
                112
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Dépenses Autorisées
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                93,3% de réussite
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
                8
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Échouées / Rejetées
              </p>
              <p className="text-xs font-extrabold text-rose-500 mt-1">
                ↘ 6,7% d'échec
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
                600
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Dîmes & Dons Encaissés
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ↗ +600 ce mois
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
                480 000 FCFA
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Charges courantes payées (Fonds Général)
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ↗ +480 000 FCFA ce mois
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
                {formatFCFA(overview?.treasury?.generalFundFreeBalance || 8150000)}
              </div>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ↗ +2 500 000 FCFA ce mois
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
                2 500 000 F
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFBC00" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#FFBC00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
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
                  stroke="#FFBC00"
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
                    {serviceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white block">
                  120
                </span>
                <span className="text-xs text-slate-400 uppercase font-black tracking-wider">
                  Cultes
                </span>
              </div>
            </div>

            {/* Légende avec pourcentages */}
            <div className="flex-1 w-full space-y-2.5 text-sm">
              {serviceDistribution.map((item, idx) => (
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
            {/* Activité 1 */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] text-sm">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    Nouvelle recette 2 500 000 FCFA
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Il y a 2 minutes</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 shrink-0 ml-2">
                Réussi
              </span>
            </div>

            {/* Activité 2 */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] text-sm">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    Dépense ajoutée 75 000 FCFA
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Il y a 15 minutes</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 shrink-0 ml-2">
                Réussi
              </span>
            </div>

            {/* Activité 3 */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] text-sm">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    Nouveau culte ajouté
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Il y a 32 minutes</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-400 border border-blue-500/25 shrink-0 ml-2">
                Nouveau
              </span>
            </div>

            {/* Activité 4 */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] text-sm">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    Dépense approuvée 50 000 FCFA
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Il y a 1 heure</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 shrink-0 ml-2">
                Réussi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DERNIÈRE LIGNE (2 Blocs : Culte le plus fréquenté & Félicitations) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Programme le plus fréquenté */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 card-hover-effect">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-amber-400/35 shrink-0 relative flex items-center justify-center shadow-md">
              <img
                src="/logo-eev.png"
                alt="Autel Culte Dominical"
                className="w-14 h-14 object-contain"
              />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">
                Programme le plus fréquenté
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Culte Dominical
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                42% de la fréquentation globale du ministère
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
                Félicitations !
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Vous avez atteint 14 750 000 FCFA de trésorerie consolidée ce mois-ci. Continuez comme ça, vous êtes sur la bonne voie ! 🎉
              </p>
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
