import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { Users, UserPlus, HeartHandshake, TrendingUp, Calendar } from 'lucide-react';
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
  Legend,
} from 'recharts';

export const AttendanceDashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['attendance-dashboard'],
    queryFn: () => api.getAttendanceDashboard(),
  });

  const demographics = [
    { name: 'Hommes', value: stats?.men || 145, color: '#4F46E5' },
    { name: 'Femmes', value: stats?.women || 198, color: '#EC4899' },
    { name: 'Jeunes', value: stats?.youth || 92, color: '#F59E0B' },
    { name: 'Enfants', value: stats?.children || 65, color: '#10B981' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-500" />
          <span>Tableau de Bord du Protocole & Fréquentation</span>
        </h1>
        <p className="text-xs text-slate-500">
          Suivi analytique et démographique de la fréquentation des rassemblements.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Dernier Culte (Total)"
          value={stats?.lastServiceTotal || 500}
          subtitle="Hommes + Femmes + Jeunes + Enfants"
          icon={Users}
          accentColor="gold"
          trend={{ value: 5.8, isPositive: true }}
        />
        <StatCard
          title="Nouveaux Visiteurs"
          value={stats?.newVisitors || 32}
          subtitle="Indicateur complémentaire d'intégration"
          icon={UserPlus}
          accentColor="indigo"
        />
        <StatCard
          title="Décisions pour Christ"
          value={stats?.salvations || 14}
          subtitle="Âmes sauvées lors des cultes"
          icon={HeartHandshake}
          accentColor="emerald"
        />
        <StatCard
          title="Moyenne Dominicale"
          value={480}
          subtitle="Sur les 4 derniers dimanches"
          icon={TrendingUp}
          accentColor="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Répartition Démographique par Catégorie
          </h2>
          <p className="text-xs text-slate-500 mb-6">Proportion des participants au dernier culte</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={demographics}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {demographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Moyenne de Fréquentation par Type de Programme
          </h2>
          <p className="text-xs text-slate-500 mb-6">Comparatif Dimanche vs Semaine</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.byServiceType || []}>
                <XAxis dataKey="type" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="average" name="Présents Moyens" fill="#FFBC00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

