import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import {
  History,
  ShieldAlert,
  User,
  Terminal,
  Search,
  Filter,
  Eye,
  X,
  ShieldCheck,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.getAuditLogs(),
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create_entry':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
            Recette Encaissée
          </span>
        );
      case 'approve_expense':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-500 border border-amber-400/30">
            Dépense Approuvée
          </span>
        );
      case 'pay_expense':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/25">
            Décaissement Payé
          </span>
        );
      case 'reject_expense':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-500 border border-rose-500/25">
            Dépense Rejetée
          </span>
        );
      case 'internal_transfer':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
            Virement Inter-Fonds
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/15 text-slate-400 border border-slate-500/25">
            {action}
          </span>
        );
    }
  };

  const filteredLogs = logs.filter((log: any) => {
    return (
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user?.name || log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.collection_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-500" />
            <span>Journal d’Audit & Sécurité Immuable</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Piste d'audit inviolable scellant chaque saisie, modification, autorisation et transaction financière.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Journal Scellé Cryptographiquement</span>
        </div>
      </div>

      {/* Barre de Recherche */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par action, utilisateur, motif..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          {filteredLogs.length} événement(s) archivé(s)
        </span>
      </div>

      {/* Table du Journal d'Audit */}
      <div className="bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#101C3D] text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-[#16214A]">
                <th className="py-4 px-6">Horodatage</th>
                <th className="py-4 px-6">Auteur</th>
                <th className="py-4 px-6">Action Réalisée</th>
                <th className="py-4 px-6">Table / Réf</th>
                <th className="py-4 px-6">Motif & Justification</th>
                <th className="py-4 px-6 text-right">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#16214A]/70">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                    Aucun journal d'audit ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-[#101C3D]/40 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {formatDate(log.created)}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {log.user?.name || log.userName || 'Système Sécurisé'}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-4 px-6 text-xs font-mono text-slate-600 dark:text-slate-300">
                      {log.collection_name} ({log.record_id?.slice(0, 8)})
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 max-w-sm truncate">
                      {log.reason || 'Opération certifiée par la gouvernance'}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#16214A] hover:bg-amber-400 hover:text-slate-950 dark:hover:bg-amber-400 dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspecter</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Inspecteur de Journal d'Audit */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute right-4 top-4 p-2 rounded-xl bg-slate-100 dark:bg-[#16214A] text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Événement Sécurisé #{selectedLog.id}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Horodaté le {formatDate(selectedLog.created)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Action :</span>
                <span className="font-bold text-amber-500 uppercase">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auteur :</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedLog.user?.name || selectedLog.userName || 'Système'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Collection :</span>
                <span className="font-mono text-slate-300">{selectedLog.collection_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ID Enregistrement :</span>
                <span className="font-mono text-slate-300">{selectedLog.record_id}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-[#16214A]">
                <span className="text-slate-400 block mb-1">Motif / Justification :</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedLog.reason || 'Aucun motif particulier spécifié.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-[#16214A] text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
