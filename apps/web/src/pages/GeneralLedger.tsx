import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import {
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Download,
  Filter,
  Search,
} from 'lucide-react';

export const GeneralLedger: React.FC = () => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.getTransactions(),
  });

  const getTypeBadge = (type: string, direction: string) => {
    switch (type) {
      case 'credit_entry':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
            <ArrowDownLeft className="w-3 h-3" />
            <span>Recette</span>
          </span>
        );
      case 'debit_expense':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/25">
            <ArrowUpRight className="w-3 h-3" />
            <span>Dépense</span>
          </span>
        );
      case 'transfer_in':
      case 'transfer_out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
            <ArrowLeftRight className="w-3 h-3" />
            <span>Transfert</span>
          </span>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const filtered = transactions.filter((tx: any) => {
    const matchesSearch =
      (tx.transaction_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' ||
      (filterType === 'credits' && tx.direction === 'credit') ||
      (filterType === 'debits' && tx.direction === 'debit') ||
      (filterType === 'transfers' && tx.type.startsWith('transfer'));

    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    window.open('/api/reports/export/csv', '_blank');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            <span>Grand Livre Comptable Immuable</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Traçabilité intégrale chronologique de tous les flux financiers de la caisse unique.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] hover:bg-slate-200 dark:hover:bg-[#1e2c63] text-slate-900 dark:text-white font-bold text-xs transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-500" />
          <span>Exporter Grand Livre (CSV)</span>
        </button>
      </div>

      {/* Barres de Recherche & Filtres */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par N° écriture, motif..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">Type de Flux :</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-2 px-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all">Toutes les écritures</option>
            <option value="credits">Recettes uniquement (Crédits)</option>
            <option value="debits">Dépenses uniquement (Débits)</option>
            <option value="transfers">Virements inter-fonds</option>
          </select>
        </div>
      </div>

      {/* Table Grand Livre */}
      <div className="bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#101C3D] text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-[#16214A]">
                <th className="py-4 px-6">N° Écriture</th>
                <th className="py-4 px-6">Date & Heure</th>
                <th className="py-4 px-6">Nature</th>
                <th className="py-4 px-6">Description / Réf</th>
                <th className="py-4 px-6">Mouvement</th>
                <th className="py-4 px-6 text-right">Solde Après</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#16214A]/70">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                    Aucune écriture comptable trouvée.
                  </td>
                </tr>
              ) : (
                filtered.map((tx: any) => {
                  const isCredit = tx.direction === 'credit';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-[#101C3D]/40 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-black text-slate-900 dark:text-white">
                        {tx.transaction_number || 'TX-2026-000001'}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(tx.created)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {getTypeBadge(tx.type, tx.direction)}
                      </td>
                      <td className="py-4 px-6 text-slate-900 dark:text-white font-medium max-w-sm">
                        {tx.description}
                      </td>
                      <td
                        className={`py-4 px-6 font-black whitespace-nowrap ${
                          isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isCredit ? '+' : '-'} {formatFCFA(tx.amount)}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-700 dark:text-slate-300 font-black text-right whitespace-nowrap">
                        {formatFCFA(tx.balance_after)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
