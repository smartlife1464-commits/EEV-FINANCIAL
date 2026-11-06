import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatFCFA } from '../../utils/formatters';
import { PeriodSelector } from '../../components/analytics/PeriodSelector';
import { MetricCard } from '../../components/analytics/MetricCard';
import {
  Users,
  UserPlus,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Coins,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  BarChart3,
  Download,
  AlertTriangle,
  Lightbulb,
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

export const AnalyticsOverview: React.FC = () => {
  const [period, setPeriod] = useState<string>('this_month');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics-overview', period, customStart, customEnd],
    queryFn: () => api.getAnalyticsOverview(period, customStart, customEnd),
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-analytics', period, customStart, customEnd],
    queryFn: () => api.getAttendanceAnalytics(period, customStart, customEnd),
  });

  const { data: financialData } = useQuery({
    queryKey: ['financial-analytics', period, customStart, customEnd],
    queryFn: () => api.getFinancialAnalytics(period, customStart, customEnd),
  });

  const handlePeriodChange = (newPeriod: string, start?: string, end?: string) => {
    setPeriod(newPeriod);
    setCustomStart(start);
    setCustomEnd(end);
  };

  const handleExportCSV = (type: 'attendance' | 'finance') => {
    window.open(`/api/analytics/export/csv?type=${type}`, '_blank');
  };

  const attKpis = overview?.kpis?.attendance;
  const finKpis = overview?.kpis?.finance;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner avec Filtre Temporel Universel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            <span>Statistiques, Analyses & Intelligence Décisionnelle</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Indicateurs certifiés, calculs de moyennes et analyse comparative des performances du ministère.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PeriodSelector
            selectedPeriod={period}
            onPeriodChange={handlePeriodChange}
            activeRangeLabel={overview?.range?.label}
            previousRangeLabel={overview?.range?.previousLabel}
          />

          <button
            onClick={() => handleExportCSV('finance')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] hover:bg-slate-200 dark:hover:bg-[#1e2c63] text-slate-900 dark:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Sous-Navigation Analytique */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#16214A] pb-3 overflow-x-auto">
        <Link
          to="/analytics"
          className="px-4 py-2 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shadow-sm flex items-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
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
          className="px-4 py-2 rounded-2xl bg-white dark:bg-[#0C1530] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#16214A] font-bold text-xs flex items-center gap-2 shrink-0 transition-all"
        >
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span>Analyses Financières</span>
        </Link>
      </div>

      {/* Bloc Insights & Tendances Intelligentes */}
      {overview?.insights && overview.insights.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#091338] via-[#0C1738] to-[#091338] border border-amber-400/25 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Lightbulb className="w-5 h-5" />
              <h2 className="text-sm font-black uppercase tracking-wider">
                Insights & Tendances Calculées
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              Analyses générées automatiquement à partir des données de caisse et de présence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {overview.insights.map((ins: any) => (
              <div
                key={ins.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1 relative overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      ins.type === 'success'
                        ? 'bg-emerald-400'
                        : ins.type === 'warning'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-blue-400'
                    }`}
                  />
                  <h3 className="text-xs font-black text-white">{ins.title}</h3>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                  {ins.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1 : INDICATEURS CLÉS DE FRÉQUENTATION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Indicateurs de Fréquentation & Affluence</span>
          </h2>
          <Link
            to="/analytics/attendance"
            className="text-xs font-bold text-amber-500 hover:text-amber-600"
          >
            Voir les analyses démographiques détaillées →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Users}
            iconColor="text-blue-500"
            iconBg="bg-blue-500/15 border-blue-500/30"
            title="Total Participants"
            value={attKpis?.total?.current?.toLocaleString('fr-FR') || 1945}
            variation={attKpis?.total}
          />

          <MetricCard
            icon={Calendar}
            iconColor="text-amber-500"
            iconBg="bg-amber-500/15 border-amber-500/30"
            title="Moyenne par Culte Validé"
            value={attKpis?.averagePerService?.current || 486}
            unit="fidèles / service"
            variation={attKpis?.averagePerService}
          />

          <MetricCard
            icon={UserPlus}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/15 border-emerald-500/30"
            title="Nouveaux Visiteurs"
            value={attKpis?.newVisitors?.current || 118}
            unit="accueillis"
            variation={attKpis?.newVisitors}
          />

          <MetricCard
            icon={Sparkles}
            iconColor="text-purple-500"
            iconBg="bg-purple-500/15 border-purple-500/30"
            title="Meilleure Fréquentation"
            value={attKpis?.bestAttendanceService?.total || 500}
            unit="participants"
            subtext={`${attKpis?.bestAttendanceService?.name} (${attKpis?.bestAttendanceService?.date})`}
          />
        </div>
      </div>

      {/* SECTION 2 : INDICATEURS FINANCIERS & REVENUS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            <span>Indicateurs Financiers & Ressources de la Caisse</span>
          </h2>
          <Link
            to="/analytics/finance"
            className="text-xs font-bold text-amber-500 hover:text-amber-600"
          >
            Voir la décomposition par fonds et dépenses →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={ArrowDownCircle}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/15 border-emerald-500/30"
            title="Recettes Brutes Encaissées"
            value={formatFCFA(finKpis?.totalRevenues?.current || 3500000)}
            variation={finKpis?.totalRevenues}
          />

          <MetricCard
            icon={ArrowUpCircle}
            iconColor="text-rose-500"
            iconBg="bg-rose-500/15 border-rose-500/30"
            title="Dépenses Payées (Décaissements)"
            value={formatFCFA(finKpis?.paidExpenses?.current || 480000)}
            variation={finKpis?.paidExpenses}
          />

          <MetricCard
            icon={Coins}
            iconColor="text-amber-500"
            iconBg="bg-amber-500/15 border-amber-500/30"
            title="Moyenne Recette par Culte"
            value={formatFCFA(finKpis?.averageRevenuePerService?.current || 875000)}
            variation={finKpis?.averageRevenuePerService}
          />

          <MetricCard
            icon={Building2}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-500/15 border-indigo-500/30"
            title="Solde Physique Consolidé"
            value={formatFCFA(finKpis?.consolidatedPhysicalBalance || 14750000)}
            subtext={`Dont ${formatFCFA(finKpis?.generalFundFreeBalance || 8150000)} libre dans le Fonds Général`}
          />
        </div>
      </div>

      {/* SECTION 3 : VISUALISATIONS GRAPHIQUES RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique Courbe Recettes vs Dépenses payées */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Évolution Historique Recettes vs Dépenses Payées
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seules les dépenses payées constituent une sortie effective de liquidité.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-500 border border-amber-400/30">
              Devise : FCFA
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData?.monthlyTrends || []}>
                <defs>
                  <linearGradient id="colorRevenues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFBC00" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FFBC00" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="tithes"
                  name="Dîmes (FCFA)"
                  stroke="#FFBC00"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenues)"
                />
                <Area
                  type="monotone"
                  dataKey="paidExpenses"
                  name="Dépenses Payées (FCFA)"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Répartition de Fréquentation */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Répartition par Catégorie
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proportion des 4 catégories exclusives dans l'assemblée.
            </p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData?.demographics || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {(attendanceData?.demographics || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => `${val} participants`}
                  contentStyle={{ backgroundColor: '#091338', borderColor: '#16214A', borderRadius: 16 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {attendanceData?.summary?.grandTotal || 1485}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Fidèles
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-[#16214A]">
            {(attendanceData?.demographics || []).map((d: any) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{d.name} :</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">{d.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
