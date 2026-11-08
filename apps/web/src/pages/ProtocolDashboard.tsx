import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
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
  const { period, periodLabel } = usePeriod();
  const [whatsAppReportData, setWhatsAppReportData] = useState<WhatsAppServiceReportData | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['attendance-dashboard', period],
    queryFn: () => api.getAttendanceDashboard(),
  });

  const { data: sheets = [] } = useQuery({
    queryKey: ['attendance-sheets'],
    queryFn: () => api.getAttendance(),
  });

  const handleShareLastServiceWhatsApp = () => {
    const latestSheet = sheets[0];
    setWhatsAppReportData({
      serviceName: latestSheet?.service?.name || latestSheet?.service_name || 'Culte Dominical',
      serviceDate: latestSheet?.service_date || latestSheet?.date || new Date().toISOString(),
      totalAttendance: latestSheet?.total_attendance || stats?.lastServiceTotal || 500,
      menCount: latestSheet?.men_count || stats?.men || 145,
      womenCount: latestSheet?.women_count || stats?.women || 198,
      youthCount: latestSheet?.youth_count || stats?.youth || 92,
      childrenCount: latestSheet?.children_count || stats?.children || 65,
      newVisitorsCount: latestSheet?.new_visitors_count || stats?.newVisitors || 32,
      salvationsCount: latestSheet?.salvations_count || stats?.salvations || 4,
      capacityRate: latestSheet?.capacity_rate || stats?.occupancyRate || 88,
      responsibleName: latestSheet?.responsible_user?.name || 'Responsable Protocole',
    });
  };

  // Tendance de fréquentation dominicale sur le mois (courbe dorée)
  const attendanceTrendData = [
    { name: '11 Oct', total: 420 },
    { name: '18 Oct', total: 445 },
    { name: '25 Oct', total: 480 },
    { name: '01 Nov', total: 500 },
    { name: '08 Nov', total: 525 },
  ];

  // Répartition Démographique stricte (Hommes, Femmes, Jeunes, Enfants)
  const demographicsData = [
    { name: 'Hommes', value: stats?.men || 145, color: '#3B82F6' },
    { name: 'Femmes', value: stats?.women || 198, color: '#EC4899' },
    { name: 'Jeunes', value: stats?.youth || 92, color: '#FFBC00' },
    { name: 'Enfants', value: stats?.children || 65, color: '#10B981' },
  ];

  const totalDemographics = demographicsData.reduce((acc, curr) => acc + curr.value, 0);

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
                Affluence Globale • Dernier Culte Dominical
              </span>
              <div className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                <span>{stats?.lastServiceTotal || 500}</span>
                <span className="text-xl md:text-2xl font-bold text-amber-500">Fidèles</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                <span>+35 participants vs culte précédent (+7,5% de croissance)</span>
              </div>
            </div>
          </div>

          {/* Bloc droit : Mini courbe dorée d'affluence */}
          <div className="flex-1 max-w-lg h-28 relative flex flex-col justify-end">
            <div className="absolute top-0 right-2 z-10">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md">
                Pic : 525 Fidèles
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
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
                {stats?.lastServiceTotal || 500}
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
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0 shadow-sm">
              <UserPlus className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats?.newVisitors || 32}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Nouveaux Visiteurs (30j)
              </p>
              <p className="text-xs font-extrabold text-blue-500 mt-1">
                ↗ +30 accueillis ce mois
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

        {/* Carte 4 : Fiches Validées */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm hover:border-amber-400/40 card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {sheets.filter((s: any) => s.status === 'validated').length || 18}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Fiches Certifiées Conformes
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                100% de complétude
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
                {stats?.salvations || 14}
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
                93,3%
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Taux de Rétention Visiteurs
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                Standard ministériel d'excellence
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
                486 Fidèles
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Moyenne par Culte Validé (Dimanches & Semaine)
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ↗ +7,5% par rapport au mois précédent
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
                500 / 600 Places
              </div>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                83,3% de taux d'occupation des sièges
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
                500 Présents
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
                  {totalDemographics}
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
                    {item.value} ({Math.round((item.value / totalDemographics) * 100)}%)
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
            {/* Activité 1 */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] text-sm">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Church className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    Culte Dominical validé (500 fidèles)
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
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    8 Nouveaux visiteurs accueillis
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
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    2 Décisions pour Christ enregistrées
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
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    Fiche Enseignement Mardi soumise
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
                Culte Dominical
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                42% de la fréquentation globale du ministère
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
                Félicitations au Département Protocole !
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Excellente mobilisation ! L'assemblée a franchi le cap des 500 fidèles avec 32 nouveaux visiteurs ce mois-ci. Continuez l'évangélisation et l'accueil d'excellence ! 🎉
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

