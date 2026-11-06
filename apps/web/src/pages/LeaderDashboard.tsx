import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
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
  TrendingUp,
  Receipt,
  FileCheck,
  Church,
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
  const [periodFilter, setPeriodFilter] = useState('30 derniers jours');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.getDashboardOverview(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-list'],
    queryFn: () => api.getExpenses(),
  });

  // Données de tendance pour la courbe dorée (inspirée du screenshot)
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
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* 1. HERO CARD — Grand bandeau de trésorerie avec graphique d'évolution doré */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-amber-400/25 shadow-sm transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Bloc gauche : Icône + Chiffre majeur */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 p-3.5 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/25">
              <Wallet className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Revenus totaux • Caisse consolidée
              </span>
              <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatFCFA(overview?.treasury?.consolidatedPhysicalBalance || 14750000)}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-4 h-4" />
                <span>+2 500 000 FCFA par rapport au mois dernier</span>
              </div>
            </div>
          </div>

          {/* Bloc droit : Mini courbe dorée avec tag sommet */}
          <div className="flex-1 max-w-md h-24 relative flex flex-col justify-end">
            <div className="absolute top-0 right-2 z-10">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 shadow-sm">
                +2 500 000 FCFA
              </span>
            </div>
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFBC00" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#FFBC00" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#FFBC00"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#goldGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GRILLE DE 6 CARTES KPI (2 rangées de 3) — Copie exacte de l'organisation visuelle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Carte 1 : Fidèles Présents */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-500 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                500
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Fidèles (Dernier Culte)
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ↗ +35 ce mois
              </p>
            </div>
          </div>
        </div>

        {/* Carte 2 : Nouveaux Visiteurs */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                32
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Nouveaux (30j)
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ↗ +30 ce mois
              </p>
            </div>
          </div>
        </div>

        {/* Carte 3 : Cultes & Générations */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                120
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Cultes & Générations
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ↗ +120 ce mois
              </p>
            </div>
          </div>
        </div>

        {/* Carte 4 : Dépenses Réussies / Autorisées */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                112
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Dépenses Autorisées
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                93,3% de réussite
              </p>
            </div>
          </div>
        </div>

        {/* Carte 5 : Dépenses Rejetées */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                8
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Échouées / Rejetées
              </p>
              <p className="text-[11px] font-bold text-rose-500 mt-0.5">
                ↘ 6,7% d'échec
              </p>
            </div>
          </div>
        </div>

        {/* Carte 6 : Recettes enregistrées */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                600
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Dîmes & Dons Encaissés
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ↗ +600 ce mois
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DEUX CARTES MOYENNES (Charges courantes & Solde de trésorerie disponible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Charges consommées (Fonds Général) */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                480 000 FCFA
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Charges courantes payées (Fonds Général)
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ↗ +480 ce mois
              </p>
            </div>
          </div>
        </div>

        {/* Solde de trésorerie disponible */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-amber-400/20 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 p-3 flex items-center justify-center shrink-0 shadow-md shadow-amber-400/20">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Solde de trésorerie disponible
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {formatFCFA(overview?.treasury?.generalFundFreeBalance || 8150000)}
              </div>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ↗ +2 500 000 FCFA ce mois
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BLOC ANALYTIQUE EN 3 COLONNES — Exactement comme le screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne 1 : Évolution des revenus */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Évolution des revenus
            </h2>
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-[11px] font-semibold text-slate-700 dark:text-slate-300"
              >
                <span>{periodFilter}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="h-52 w-full mt-2 relative">
            <div className="absolute top-2 right-4 z-10">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                2 500 000 F
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFBC00" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#FFBC00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatFCFA(Number(val)), 'Revenus']}
                  contentStyle={{
                    backgroundColor: '#091338',
                    border: '1px solid rgba(255, 188, 0, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#FFBC00"
                  strokeWidth={2.5}
                  fill="url(#chartGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Colonne 2 : Répartition des cultes */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Répartition des cultes
          </h2>

          <div className="flex items-center gap-4">
            {/* Donut avec texte centré 120 Cultes */}
            <div className="w-40 h-40 relative flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
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
                <span className="text-xl font-black text-slate-900 dark:text-white block">
                  120
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Cultes
                </span>
              </div>
            </div>

            {/* Légende avec pourcentages */}
            <div className="flex-1 space-y-2 text-xs">
              {serviceDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne 3 : Activité récente — Liste exacte avec badges "Réussi" / "Nouveau" */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Activité récente
          </h2>

          <div className="space-y-3.5">
            {/* Activité 1 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Nouvelle recette 2 500 000 FCFA
                  </p>
                  <p className="text-[10px] text-slate-400">Il y a 2 minutes</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                Réussi
              </span>
            </div>

            {/* Activité 2 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Dépense ajoutée 75 000 FCFA
                  </p>
                  <p className="text-[10px] text-slate-400">Il y a 15 minutes</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                Réussi
              </span>
            </div>

            {/* Activité 3 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Nouveau culte ajouté
                  </p>
                  <p className="text-[10px] text-slate-400">Il y a 32 minutes</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-400">
                Nouveau
              </span>
            </div>

            {/* Activité 4 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Dépense approuvée 50 000 FCFA
                  </p>
                  <p className="text-[10px] text-slate-400">Il y a 1 heure</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                Réussi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DERNIÈRE LIGNE (2 Blocs : Culte le plus fréquenté & Félicitations) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Style / Culte le plus utilisé */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-16 rounded-2xl overflow-hidden bg-slate-900 border border-amber-400/30 shrink-0 relative flex items-center justify-center">
              <img
                src="/logo-eev.png"
                alt="Autel Culte Dominical"
                className="w-12 h-12 object-contain"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Programme le plus fréquenté
              </span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">
                Culte Dominical
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                42% de la fréquentation globale
              </p>
            </div>
          </div>

          <Link
            to="/attendance"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#16214A] dark:hover:bg-[#1E2C60] text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap"
          >
            Voir tous les cultes
          </Link>
        </div>

        {/* Félicitations ! — Bandeau de réussite avec barres ascendantes dorées */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-amber-400/25 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                Félicitations !
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Vous avez atteint 14 750 000 FCFA de trésorerie consolidée ce mois-ci. Continuez comme ça, vous êtes sur la bonne voie ! 🎉
              </p>
            </div>
          </div>

          {/* Illustration barres ascendantes dorées */}
          <div className="hidden sm:flex items-end gap-1 h-14 shrink-0 pl-2">
            <div className="w-2.5 h-4 bg-amber-400/40 rounded-t-sm" />
            <div className="w-2.5 h-6 bg-amber-400/60 rounded-t-sm" />
            <div className="w-2.5 h-8 bg-amber-400/80 rounded-t-sm" />
            <div className="w-2.5 h-11 bg-amber-400 rounded-t-sm" />
            <div className="w-2.5 h-14 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-sm shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
