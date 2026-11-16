import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatNumber, formatDate, formatVariation } from '../utils/formatters';
import { usePeriod } from '../context/PeriodContext';
import { WhatsAppReportShareModal, WhatsAppServiceReportData } from '../components/documents/WhatsAppReportShareModal';
import {
  Users,
  UserPlus,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  ClipboardList,
  Church,
  Calendar,
  ChevronDown,
  Clock,
  Award,
  MessageCircle,
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

export const ProtocolDashboard: React.FC = () => {
  const { period, periodLabel, startDate, endDate } = usePeriod();
  const [whatsAppReportData, setWhatsAppReportData] = useState<WhatsAppServiceReportData | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['attendance-dashboard', period, startDate, endDate],
    queryFn: () => api.getAttendanceDashboard(period, startDate, endDate),
  });

  const { data: sheets = [] } = useQuery({
    queryKey: ['attendance-sheets'],
    queryFn: () => api.getAttendance(),
  });

  const last = stats?.lastService;
  const summary = stats?.period_summary;
  const sheetTypeName = (s: any) => s?.expand?.service_type?.name || s?.service_type_slug || 'Culte';

  const handleShareLastServiceWhatsApp = () => {
    const latestSheet: any = sheets[0];
    if (!latestSheet) return;
    setWhatsAppReportData({
      serviceName: sheetTypeName(latestSheet),
      serviceDate: latestSheet.service_date,
      totalAttendance: latestSheet.total_attendance || 0,
      menCount: latestSheet.men_count || 0,
      womenCount: latestSheet.women_count || 0,
      youthCount: latestSheet.youth_count || 0,
      childrenCount: latestSheet.children_count || 0,
      newVisitorsCount: latestSheet.new_visitors_count || 0,
      salvationsCount: latestSheet.salvations_count || 0,
      capacityRate: stats?.occupancyRate ?? undefined,
      responsibleName: latestSheet.expand?.responsible_user?.name || latestSheet.expand?.submitted_by?.name || 'Responsable Protocole',
    });
  };

  // Évolution réelle de l'affluence sur la période sélectionnée
  const attendanceTrendData = (stats?.trend || []).map((t: any) => ({ name: t.label, total: t.total, newVisitors: t.newVisitors }));
  const peak = attendanceTrendData.reduce((m: number, p: any) => Math.max(m, p.total), 0);

  // Répartition démographique stricte de la période (Hommes, Femmes, Jeunes, Enfants)
  const demoByName = (name: string) => (stats?.demographics || []).find((d: any) => d.name === name)?.count || 0;
  const demographicsData = [
    { name: 'Hommes', value: demoByName('Hommes'), color: '#3B82F6' },
    { name: 'Femmes', value: demoByName('Femmes'), color: '#EC4899' },
    { name: 'Jeunes', value: demoByName('Jeunes'), color: '#FFBC00' },
    { name: 'Enfants', value: demoByName('Enfants'), color: '#10B981' },
  ];
  const totalDemographics = demographicsData.reduce((acc, curr) => acc + curr.value, 0);

  const topType = [...(stats?.byServiceType || [])].sort((a: any, b: any) => b.total - a.total)[0];
  const validatedCount = sheets.filter((s: any) => s.status === 'validated').length;
  const submittedCount = sheets.filter((s: any) => s.status === 'submitted').length;
  // Comparaison pertinente : précédent culte du MÊME programme (et non la fiche précédente quelconque)
  const previousSheet: any = sheets.slice(1).find((sh: any) => sh.service_type_slug === (sheets[0] as any)?.service_type_slug);
  const lastDelta = last && previousSheet ? last.total - (previousSheet.total_attendance || 0) : 0;
  const visitorRate = summary?.grandTotal ? Math.round((summary.totalNewVisitors / summary.grandTotal) * 1000) / 10 : 0;
  const statusLabel: Record<string, string> = { draft: 'Brouillon', submitted: 'Soumise', validated: 'Validée', rejected: 'Rejetée' };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* 1. HERO CARD PROTOCOLE — Grand bandeau d'affluence avec courbe dorée éclatante */}
      <div className="relative overflow-hidden rounded-3xl p-7 md:p-9 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-amber-400/30 shadow-md card-hover-effect">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Bloc gauche : Icône Église/Protocole + Chiffre majeur */}
          <div className="flex items-start sm:items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 p-4 flex items-center justify-center shrink-0 shadow-xl shadow-amber-400/25">
              <Church className="w-9 h-9 md:w-11 md:h-11" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Affluence • Dernier culte enregistré
              </span>
              <div className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                <span>{formatNumber(stats?.lastServiceTotal)}</span>
                <span className="text-xl md:text-2xl font-bold text-amber-500">Fidèles</span>
              </div>
              <div className={`flex items-center gap-2 text-xs md:text-sm font-extrabold ${lastDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                <span>
                  {last
                    ? `${last.serviceTypeName} du ${formatDate(last.date)}${previousSheet ? ` • ${lastDelta >= 0 ? '+' : ''}${lastDelta} vs ${formatDate(previousSheet.service_date)}` : ''}`
                    : 'Aucune fiche de présence enregistrée'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloc droit : Mini courbe dorée d'affluence */}
          <div className="flex-1 max-w-lg h-28 relative flex flex-col justify-end">
            <div className="absolute top-0 right-2 z-10">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md">
                Pic : {formatNumber(peak)} participants
              </span>
            </div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrendData}>
                  <defs>
                    <linearGradient id="goldAttendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFBC00" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#FFBC00" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#FFBC00"
                    strokeWidth={3.5}
                    fillOpacity={1}
                    fill="url(#goldAttendanceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Barre d'action rapide Protocole */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Transmission immédiate :
            </span>
            <button
              onClick={handleShareLastServiceWhatsApp}
              disabled={sheets.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Transmettre le Bilan au Pasteur (WhatsApp)</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/attendance/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
            >
              <span>+ Nouvelle Fiche</span>
            </Link>
            <Link
              to="/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
              <span>Journal des fiches</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. GRILLE DE 6 CARTES KPI DU PROTOCOLE (100% Présences, Visiteurs et Âmes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Carte 1 : Fidèles Présents */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNumber(summary?.grandTotal)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Participants cumulés (période)
              </p>
              <p className={`text-xs font-extrabold mt-1 ${(summary?.totalVariation?.difference || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {formatVariation(summary?.totalVariation?.percentage)} vs période précédente
              </p>
            </div>
          </div>
        </div>

        {/* Carte 2 : Nouveaux Visiteurs */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0 shadow-sm">
              <UserPlus className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNumber(summary?.totalNewVisitors)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Nouveaux visiteurs (période)
              </p>
              <p className="text-xs font-extrabold text-blue-500 mt-1">
                {formatVariation(summary?.visitorsVariation?.percentage)} vs période précédente
              </p>
            </div>
          </div>
        </div>

        {/* Carte 3 : Cultes & Rassemblements */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNumber(summary?.servicesCount)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Cultes enregistrés (période)
              </p>
              <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mt-1">
                {periodLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Carte 4 : Fiches Validées */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {validatedCount}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Fiches validées
              </p>
              <p className={`text-xs font-extrabold mt-1 ${submittedCount ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {submittedCount ? `${submittedCount} fiche(s) en attente de validation` : 'Aucune fiche en attente'}
              </p>
            </div>
          </div>
        </div>

        {/* Carte 5 : Décisions pour Christ */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0 shadow-sm">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNumber(summary?.totalSalvations)}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Décisions pour Christ
              </p>
              <p className="text-xs font-extrabold text-rose-500 mt-1">
                Âmes sauvées & affermies
              </p>
            </div>
          </div>
        </div>

        {/* Carte 6 : Taux d'Accueil & Rétention */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {visitorRate.toLocaleString('fr-FR')} %
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Taux de nouveaux visiteurs
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                Visiteurs / participants de la période
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DEUX CARTES MOYENNES (Moyenne par Culte Validé & Taux de Remplissage Sanctuaire) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Moyenne par Culte */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex items-center justify-between card-hover-effect">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0 shadow-sm">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNumber(summary?.averagePerService)} participants
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Moyenne par culte (période)
              </p>
              <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mt-1">
                Total ÷ nombre de cultes enregistrés
              </p>
            </div>
          </div>
        </div>

        {/* Taux de Remplissage Sanctuaire */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-amber-400/25 shadow-sm flex items-center justify-between card-hover-effect">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 p-3.5 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/25">
              <Church className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-amber-500 uppercase tracking-wider">
                Capacité d'Accueil du Sanctuaire
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {stats?.venueCapacity ? `${formatNumber(stats?.lastServiceTotal)} / ${formatNumber(stats.venueCapacity)} places` : 'Non configurée'}
              </div>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats?.venueCapacity
                  ? `${stats.occupancyRate}% de taux d'occupation au dernier culte`
                  : 'Définir VENUE_CAPACITY côté serveur pour suivre le taux d’occupation'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BLOC ANALYTIQUE EN 3 COLONNES — Visibilité pastorale et opérationnelle complète */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne 1 : Évolution de la Fréquentation */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col justify-between card-hover-effect">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Évolution de l'affluence
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
                Pic : {formatNumber(peak)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrendData} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartAttendanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFBC00" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#FFBC00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} Fidèles`, 'Présents']}
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
                  dataKey="total"
                  stroke="#FFBC00"
                  strokeWidth={3.5}
                  fill="url(#chartAttendanceGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Colonne 2 : Répartition Démographique Exclusif */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col justify-between card-hover-effect">
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-4">
            Répartition Démographique
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6 my-auto">
            {/* Donut avec texte centré 500 Fidèles */}
            <div className="w-52 h-52 relative flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographicsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {demographicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white block">
                  {formatNumber(totalDemographics)}
                </span>
                <span className="text-xs text-slate-400 uppercase font-black tracking-wider">
                  Fidèles
                </span>
              </div>
            </div>

            {/* Légende avec fidèles et pourcentages */}
            <div className="flex-1 w-full space-y-2.5 text-sm">
              {demographicsData.map((item, idx) => (
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
                    {formatNumber(item.value)} ({totalDemographics ? Math.round((item.value / totalDemographics) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne 3 : Activité récente du Protocole */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col justify-between card-hover-effect">
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-4">
            Activité récente du Protocole
          </h2>

          <div className="space-y-3.5">
            {sheets.length === 0 && <p className="text-xs text-slate-400 font-semibold">Aucune fiche saisie pour le moment.</p>}
            {sheets.slice(0, 4).map((sh: any) => (
              <div key={sh.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] text-sm">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {sheetTypeName(sh)} — {formatNumber(sh.total_attendance)} participants
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(sh.service_date)} • {sh.new_visitors_count || 0} visiteur(s) • {sh.salvations_count || 0} décision(s)
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ml-2 border ${
                    sh.status === 'validated'
                      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                      : sh.status === 'rejected'
                      ? 'bg-rose-500/15 text-rose-500 border-rose-500/25'
                      : 'bg-amber-400/15 text-amber-500 border-amber-400/25'
                  }`}
                >
                  {statusLabel[sh.status] || sh.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. DERNIÈRE LIGNE (2 Blocs : Programme le plus fréquenté & Félicitations Protocole) */}
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
                {topType && topType.total > 0 ? topType.type : '—'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {topType && topType.total > 0
                  ? `${topType.percentage}% de la fréquentation de la période (moy. ${formatNumber(topType.average)})`
                  : 'Aucune donnée sur la période'}
              </p>
            </div>
          </div>

          <Link
            to="/attendance/new"
            className="px-5 py-3 rounded-2xl text-sm font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 transition-all shadow-md shadow-amber-400/20 whitespace-nowrap"
          >
            Saisir une fiche
          </Link>
        </div>

        {/* Félicitations ! — Bandeau d'encouragement pastoral pour le Protocole */}
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-amber-400/30 shadow-sm flex items-center justify-between gap-5 card-hover-effect">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                Bilan du Département Protocole
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {summary?.servicesCount
                  ? `${periodLabel} : ${formatNumber(summary.grandTotal)} participants sur ${summary.servicesCount} culte(s), ${formatNumber(summary.totalNewVisitors)} nouveaux visiteurs accueillis et ${formatNumber(summary.totalSalvations)} décision(s) pour Christ. Merci pour votre service !`
                  : `Aucune fiche enregistrée pour « ${periodLabel} ». Pensez à saisir les fiches après chaque culte.`}
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

      {/* Modal Partage WhatsApp Bilan de Culte */}
      <WhatsAppReportShareModal
        data={whatsAppReportData}
        onClose={() => setWhatsAppReportData(null)}
      />
    </div>
  );
};

