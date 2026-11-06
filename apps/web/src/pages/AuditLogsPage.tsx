import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { History, ShieldAlert, User, Terminal } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.getAuditLogs(),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-500" />
          <span>Journal d’Audit & Sécurité Immuable</span>
        </h1>
        <p className="text-xs text-slate-500">
          Traçabilité inviolable de chaque création, modification, autorisation et transaction financière.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6">Date & Heure</th>
                <th className="py-4 px-6">Utilisateur</th>
                <th className="py-4 px-6">Action Réalisée</th>
                <th className="py-4 px-6">Entité Concernée</th>
                <th className="py-4 px-6">Détails / Motif</th>
                <th className="py-4 px-6 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 text-xs text-slate-500 font-mono whitespace-nowrap">
                    {formatDate(log.created)}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                    {log.user?.name || log.userName || 'Système'}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs uppercase font-bold text-amber-600 dark:text-amber-400">
                    {log.action}
                  </td>
                  <td className="py-4 px-6 text-xs font-mono text-slate-600 dark:text-slate-300">
                    {log.collection_name} ({log.record_id?.slice(0, 8)})
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                    {log.reason || 'Opération certifiée par la gouvernance'}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <Badge variant="success">Scellé</Badge>
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

