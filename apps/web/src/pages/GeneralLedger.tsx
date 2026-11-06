import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { BookOpen, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';

export const GeneralLedger: React.FC = () => {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.getTransactions(),
  });

  const getTypeBadge = (type: string, direction: string) => {
    switch (type) {
      case 'credit_entry':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3" />
            <span>Recette</span>
          </Badge>
        );
      case 'debit_expense':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Dépense</span>
          </Badge>
        );
      case 'transfer_in':
      case 'transfer_out':
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3" />
            <span>Transfert</span>
          </Badge>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-500" />
          <span>Grand Livre Comptable Immuable</span>
        </h1>
        <p className="text-xs text-slate-500">
          Traçabilité intégrale chronologique de tous les mouvements de fonds.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6">N° Écriture</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Description / Réf</th>
                <th className="py-4 px-6">Mouvement</th>
                <th className="py-4 px-6 text-right">Solde Après</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((tx: any) => {
                const isCredit = tx.direction === 'credit';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {tx.transaction_number || 'TX-2026-000001'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(tx.created)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {getTypeBadge(tx.type, tx.direction)}
                    </td>
                    <td className="py-4 px-6 text-slate-900 dark:text-white font-medium max-w-sm">
                      {tx.description}
                    </td>
                    <td
                      className={`py-4 px-6 font-extrabold whitespace-nowrap ${
                        isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isCredit ? '+' : '-'} {formatFCFA(tx.amount)}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-700 dark:text-slate-300 font-bold text-right whitespace-nowrap">
                      {formatFCFA(tx.balance_after)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

