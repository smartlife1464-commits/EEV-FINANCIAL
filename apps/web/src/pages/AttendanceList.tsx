import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { ClipboardList, Plus, Users, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AttendanceList: React.FC = () => {
  const { data: sheets = [], isLoading } = useQuery({
    queryKey: ['attendance-sheets'],
    queryFn: () => api.getAttendance(),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-500" />
            <span>Fiches de Fréquentation & Statistiques</span>
          </h1>
          <p className="text-xs text-slate-500">
            Historique complet des fiches de présence renseignées par le Protocole.
          </p>
        </div>

        <Link
          to="/attendance/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Saisir une Nouvelle Fiche</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6">Culte</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Hommes</th>
                <th className="py-4 px-6">Femmes</th>
                <th className="py-4 px-6">Jeunes</th>
                <th className="py-4 px-6">Enfants</th>
                <th className="py-4 px-6 font-bold text-amber-500">Total Participants</th>
                <th className="py-4 px-6 font-bold text-blue-500">Nouveaux Visiteurs</th>
                <th className="py-4 px-6 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sheets.map((sheet: any) => (
                <tr key={sheet.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                    {sheet.service?.name || sheet.service_name || 'Culte Dominical'}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(sheet.created || sheet.date)}
                  </td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{sheet.men_count}</td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{sheet.women_count}</td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{sheet.youth_count}</td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{sheet.children_count}</td>
                  <td className="py-4 px-6 font-black text-slate-900 dark:text-white text-base">
                    {sheet.total_attendance}
                  </td>
                  <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400">
                    +{sheet.new_visitors_count}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <Badge variant="success">Validée</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
