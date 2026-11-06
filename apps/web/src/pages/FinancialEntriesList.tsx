import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { ArrowDownCircle, Plus, Calendar, CreditCard, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FinancialEntriesList: React.FC = () => {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['financial-entries'],
    queryFn: () => api.getEntries(),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowDownCircle className="w-6 h-6 text-emerald-500" />
            <span>Journal des Recettes Encaissées</span>
          </h1>
          <p className="text-xs text-slate-500">
            Historique certifié des dîmes, offrandes ordinaires et dons affectés.
          </p>
        </div>

        <Link
          to="/finance/entries/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer une Recette</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6">Numéro</th>
                <th className="py-4 px-6">Date de Collecte</th>
                <th className="py-4 px-6">Catégorie</th>
                <th className="py-4 px-6">Donateur / Référence</th>
                <th className="py-4 px-6">Règlement</th>
                <th className="py-4 px-6">Montant Brut</th>
                <th className="py-4 px-6 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {entries.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {entry.entry_number || 'REC-2026-00001'}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(entry.collected_at)}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                    {entry.category?.name || 'Dîmes & Offrandes Ordinaires'}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500">
                    {entry.donor_name || 'Assemblée Générale'}
                    {entry.reference ? ` (${entry.reference})` : ''}
                  </td>
                  <td className="py-4 px-6 text-xs font-medium uppercase text-slate-600 dark:text-slate-300">
                    {entry.payment_method}
                  </td>
                  <td className="py-4 px-6 font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatFCFA(entry.amount)}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <Badge variant="success">Comptabilisée</Badge>
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

