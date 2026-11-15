import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { PeriodSelector } from '../../components/analytics/PeriodSelector';
import { usePeriod } from '../../context/PeriodContext';
import { MetricCard } from '../../components/analytics/MetricCard';
import {
  Users,
  UserPlus,
  HeartHandshake,
  TrendingUp,
  CalendarDays,
  Sparkles,
  BarChart3,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

export const AttendanceAnalytics: React.FC = () => {
  const { period, startDate: customStart, endDate: customEnd, setPeriod: handlePeriodChange } = usePeriod();
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month' | 'quarter'>('week');

  // Séries affichées / masquées
  const [showMen, setShowMen] = useState(true);
  const [showWomen, setShowWomen] = useState(true);
  const [showYouth, setShowYouth] = useState(true);
  const [showChildren, setShowChildren] = useState(true);
  const [showTotal, setShowTotal] = useState(true);

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-analytics', period, customStart, customEnd],
    queryFn: () => api.getAttendanceAnalytics(period, customStart, customEnd),
  });

  const { data: trends = [] } = useQuery({
    queryKey: ['attendance-trends', granularity],
    queryFn: () => api.getAttendanceTrends(granularity),
  });


  const handleExportCSV = () => {
    api.exportAnalyticsCsv('attendance', period, customStart, customEnd).catch((err) => toast.error('Export impossible', { description: err.message }));
  };

  const summary = attendanceData?.summary;
  const records = attendanceData?.records;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            <span>Analyses Approfondies de la Fréquentation</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Démographie certifiée, moyennes par service validé, taux de nouveaux visiteurs et records pastoraux.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PeriodSelector
            selectedPeriod={period}
            onPeriodChange={handlePeriodChange}
            activeRangeLabel={attendanceData?.range?.label}
          />

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] hover:bg-slate-200 dark:hover:bg-[#1e2c63] text-slate-900 dark:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-500" />
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
          className="px-4 py-2 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-sm flex items-center gap-2 shrink-0"
        >
          <Users className="w-4 h-4" />
          <span>Analyses de Fréquentation</span>
        </Link>
        <Link
          to="/analytics/finance"
          className="px-4 py-2 rounded-2xl bg-white dark:bg-[#0C1530] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#16214A] font-bold text-xs flex items-center gap-2 shrink-0 transition-all"
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Analyses Financières</span>
        </Link>
      </div>

      {/* 4 Cartes Clés Fréquentation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Présences Période
            </span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {summary?.grandTotal?.toLocaleString('fr-FR') ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            Sur {summary?.servicesCount || 4} cultes officiellement validés
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Moyenne par Culte Validé
            </span>
            <CalendarDays className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-500">
            {summary?.averagePerService ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            Divisé strictement par le nombre de cultes
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
              Nouveaux Visiteurs
            </span>
            <UserPlus className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-500">
            {summary?.totalNewVisitors ?? 0}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            Taux d'accueil : {summary?.visitorRate || 5.8}% (Indicateur isolé)
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pink-500">
              Décisions pour Christ
            </span>
            <HeartHandshake className="w-5 h-5 text-pink-500" />
          </div>
          <div className="text-3xl font-black text-pink-500">
            {summary?.totalSalvations ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            Orientés vers la classe de baptême
          </p>
        </div>
      </div>

      {/* A. GRAPHIQUE ÉVOLUTION MULTI-SÉRIES AVEC TOGGLES DE SÉRIES */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Évolution de la Fréquentation par Catégorie</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Suivi dynamique des séries démographiques avec filtre granulaire.
            </p>
          </div>

          {/* Granularité */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#070D22] p-1.5 rounded-2xl border border-slate-200 dark:border-[#16214A]">
            {[
              { id: 'day', label: 'Jour' },
              { id: 'week', label: 'Semaine' },
              { id: 'month', label: 'Mois' },
              { id: 'quarter', label: 'Trimestre' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setGranularity(g.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${granularity === g.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles des séries */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#16214A]">
          <span className="text-[11px] font-bold text-slate-400 mr-2">Afficher :</span>

          <button
            onClick={() => setShowTotal(!showTotal)}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${showTotal
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-[#16214A] text-slate-400 line-through'
              }`}
          >
            <span>Total Participants</span>
          </button>

          <button
            onClick={() => setShowWomen(!showWomen)}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${showWomen
                ? 'bg-pink-600 text-white'
                : 'bg-slate-100 dark:bg-[#16214A] text-slate-400 line-through'
              }`}
          >
            <span>Femmes</span>
          </button>

          <button
            onClick={() => setShowMen(!showMen)}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${showMen
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-[#16214A] text-slate-400 line-through'
              }`}
          >
            <span>Hommes</span>
          </button>

          <button
            onClick={() => setShowYouth(!showYouth)}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${showYouth
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-100 dark:bg-[#16214A] text-slate-400 line-through'
              }`}
          >
            <span>Jeunes</span>
          </button>

          <button
            onClick={() => setShowChildren(!showChildren)}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${showChildren
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-[#16214A] text-slate-400 line-through'
              }`}
          >
            <span>Enfants</span>
          </button>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <XAxis dataKey="period" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#091338', borderColor: '#16214A', borderRadius: 16 }}
              />
              <Legend />
              {showTotal && (
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Participants"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              )}
              {showWomen && (
                <Line
                  type="monotone"
                  dataKey="women"
                  name="Femmes"
                  stroke="#EC4899"
                  strokeWidth={2}
                />
              )}
              {showMen && (
                <Line
                  type="monotone"
                  dataKey="men"
                  name="Hommes"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              )}
              {showYouth && (
                <Line
                  type="monotone"
                  dataKey="youth"
                  name="Jeunes"
                  stroke="#FFBC00"
                  strokeWidth={2}
                />
              )}
              {showChildren && (
                <Line
                  type="monotone"
                  dataKey="children"
                  name="Enfants"
                  stroke="#10B981"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* B. & E. COMPARAISON PAR TYPE DE CULTE & CLASSEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>Comparaison des Rassemblements (Dimanches vs Semaine)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fréquentation moyenne et cumulée par type de service.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData?.serviceTypeComparison || []}>
                <XAxis dataKey="type" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#091338', borderColor: '#16214A', borderRadius: 16 }}
                />
                <Bar dataKey="average" name="Moyenne par Culte" fill="#FFBC00" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tableau récapitulatif */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#070D22] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-[#16214A]">
                  <th className="py-3 px-4">Type de Rassemblement</th>
                  <th className="py-3 px-4 text-center">Nombre Organisé</th>
                  <th className="py-3 px-4 text-center">Moyenne par Culte</th>
                  <th className="py-3 px-4 text-right">Total Période</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#16214A]/70">
                {(attendanceData?.serviceTypeComparison || []).map((row: any) => (
                  <tr key={row.code}>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {row.type}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {row.count} cultes
                    </td>
                    <td className="py-3 px-4 text-center font-black text-amber-500">
                      {row.average} fidèles
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                      {row.total.toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* F. RECORDS & PERFORMANCES PASTORALES */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-amber-500">
            <Award className="w-5 h-5" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Records & Performances
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-500">
                Meilleure Fréquentation Enregistrée
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {records?.best?.total} fidèles
              </p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {records?.best?.service}
              </p>
              <span className="text-[10px] text-slate-400 block">
                Date : {records?.best?.date}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
              <span className="text-[10px] font-black uppercase text-blue-500">
                Record de Nouveaux Visiteurs
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                35 visiteurs
              </p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Culte d’Onction & Sainte Cène (08/11/2026)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">
                Plus Faible Participation
              </span>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                {records?.lowest?.total} fidèles
              </p>
              <p className="text-xs text-slate-500">
                {records?.lowest?.service} ({records?.lowest?.date})
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

