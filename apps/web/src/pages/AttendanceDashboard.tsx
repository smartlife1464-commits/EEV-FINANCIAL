import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Users,
  UserPlus,
  HeartHandshake,
  TrendingUp,
  CalendarDays,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';

export const AttendanceDashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['attendance-dashboard'],
    queryFn: () => api.getAttendanceDashboard(),
  });

  const demographics = [
    { name: 'Hommes', value: stats?.men || 145, color: '#3B82F6' },
    { name: 'Femmes', value: stats?.women || 198, color: '#EC4899' },
    { name: 'Jeunes', value: stats?.youth || 92, color: '#FFBC00' },
    { name: 'Enfants', value: stats?.children || 65, color: '#10B981' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            <span>Tableau de Bord du Protocole & Fréquentation</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Comptabilisation certifiée des fidèles et suivi pastoral des nouveaux visiteurs.
          </p>
        </div>

        <Link
          to="/attendance/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-400/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Saisir une Fiche de Présence</span>
        </Link>
      </div>

      {/* 4 Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-500 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats?.lastServiceTotal || 500}
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

        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats?.newVisitors || 32}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Nouveaux Visiteurs
              </p>
              <p className="text-[11px] font-bold text-blue-500 mt-0.5">
                Indicateur séparé
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-5 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats?.salvations || 14}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Décisions pour Christ
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Âmes sauvées
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
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                480
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Moyenne Dominicale
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ↗ +7,5% ce mois
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques Démographiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Répartition Démographique Exclusif
          </h2>
          <div className="flex items-center gap-6">
            <div className="w-44 h-44 relative flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographics}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {demographics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white block">
                  500
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Total
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 text-xs">
              {demographics.map((item, idx) => (
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
                    {item.value} fidèles
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-6 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Fréquentation par Type de Programme
          </h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.byServiceType || []}>
                <XAxis dataKey="type" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#091338',
                    border: '1px solid rgba(255, 188, 0, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="average" name="Présents Moyens" fill="#FFBC00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
