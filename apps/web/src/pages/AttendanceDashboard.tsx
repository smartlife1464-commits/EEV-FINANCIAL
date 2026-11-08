import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Users,
  UserPlus,
  HeartHandshake,
  TrendingUp,
  Plus,
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-7 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-amber-500" />
            <span>Tableau de Bord du Protocole & Fréquentation</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Comptabilisation certifiée des fidèles et suivi pastoral des nouveaux visiteurs.
          </p>
        </div>

        <Link
          to="/attendance/new"
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-400/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Saisir une Fiche de Présence</span>
        </Link>
      </div>

      {/* 4 Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-3xl p-6 md:p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
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

        <div className="rounded-3xl p-6 md:p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0 shadow-sm">
              <UserPlus className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats?.newVisitors || 32}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Nouveaux Visiteurs
              </p>
              <p className="text-xs font-extrabold text-blue-500 mt-1">
                Indicateur séparé (non cumulé)
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-6 md:p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats?.salvations || 14}
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Décisions pour Christ
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                Âmes moissonnées
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-6 md:p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                480
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Moyenne Dominicale
              </p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ↗ +7,5% ce mois
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques Démographiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-5">
            Répartition Démographique Exclusif
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-52 h-52 relative flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographics}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
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
                <span className="text-3xl font-black text-slate-900 dark:text-white block">
                  500
                </span>
                <span className="text-xs text-slate-400 uppercase font-black tracking-wider">
                  Total
                </span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-3 text-sm">
              {demographics.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white">
                    {item.value} fidèles
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-7 bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-5">
            Fréquentation par Type de Programme
          </h2>
          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.byServiceType || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="type" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#091338',
                    border: '1px solid rgba(255, 188, 0, 0.4)',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="average" name="Présents Moyens" fill="#FFBC00" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
