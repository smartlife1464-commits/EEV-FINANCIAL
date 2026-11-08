import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { DonationReceiptModal, DonationReceiptData } from '../components/documents/DonationReceiptModal';
import {
  ArrowDownCircle,
  Plus,
  Calendar,
  CreditCard,
  User,
  Printer,
  X,
  Receipt,
  FileCheck,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FinancialEntriesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [receiptEntry, setReceiptEntry] = useState<any | null>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['financial-entries'],
    queryFn: () => api.getEntries(),
  });

  const filteredEntries = entries.filter((entry: any) => {
    const matchesSearch =
      (entry.entry_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.donor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || (entry.category?.id || entry.category_id) === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalFilteredAmount = filteredEntries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowDownCircle className="w-6 h-6 text-emerald-500" />
            <span>Journal des Recettes Encaissées</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historique certifié des dîmes, offrandes ordinaires et dons affectés avec ventilation automatique.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open('/api/analytics/export/csv?type=finance', '_blank')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] hover:bg-slate-200 dark:hover:bg-[#1e2c63] text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>Exporter CSV</span>
          </button>
          <Link
            to="/finance/entries/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer une Recette</span>
          </Link>
        </div>
      </div>

      {/* Barres de Recherche & Filtres */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par N° reçu, donateur, référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">Catégorie :</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all">Toutes les catégories</option>
            <option value="cat-tithe">Dîmes (80/10/10)</option>
            <option value="cat-offering">Offrandes Ordinaires (80/10/10)</option>
            <option value="cat-build">Don Auditorium (100%)</option>
            <option value="cat-friends">Amis de Jésus (100%)</option>
            <option value="cat-special">Offrande Spéciale (100%)</option>
          </select>
          <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black whitespace-nowrap">
            Total : {formatFCFA(totalFilteredAmount)}
          </span>
        </div>
      </div>

      {/* Table des Recettes */}
      <div className="bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#101C3D] text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-[#16214A]">
                <th className="py-4 px-6">Numéro</th>
                <th className="py-4 px-6">Date de Collecte</th>
                <th className="py-4 px-6">Catégorie</th>
                <th className="py-4 px-6">Donateur / Réf</th>
                <th className="py-4 px-6">Règlement</th>
                <th className="py-4 px-6">Montant Brut</th>
                <th className="py-4 px-6 text-center">Ventilation</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#16214A]/70">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                    Aucune recette trouvée correspondant aux critères.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-[#101C3D]/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-black text-slate-900 dark:text-white">
                      {entry.entry_number || 'REC-2026-00001'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(entry.collected_at || entry.created)}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {entry.category?.name || 'Dîmes & Offrandes Ordinaires'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {entry.donor_name || 'Assemblée Générale'}
                      </span>
                      {entry.reference ? <span className="block text-[11px] text-slate-400 font-mono">Réf: {entry.reference}</span> : null}
                    </td>
                    <td className="py-4 px-6 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      {entry.payment_method === 'cash' ? '💵 Espèces' : entry.payment_method === 'mobile_money' ? '📱 Mobile Money' : entry.payment_method === 'bank_transfer' ? '🏦 Virement' : '🧾 Chèque'}
                    </td>
                    <td className="py-4 px-6 font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatFCFA(entry.amount)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-500 border border-amber-400/30">
                        {entry.category?.code === 'tithes' || entry.category?.code === 'offerings' ? '80/10/10' : '100% Affecté'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => setReceiptEntry(entry)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#16214A] hover:bg-amber-400 hover:text-slate-950 dark:hover:bg-amber-400 dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                        title="Imprimer le Reçu Officiel"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Reçu</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Reçu de Don & Dîme Officiel Certifié avec QR Code */}
      <DonationReceiptModal
        receipt={
          receiptEntry
            ? {
                id: receiptEntry.id,
                receiptNumber: receiptEntry.entry_number,
                donorName: receiptEntry.donor_name,
                donorPhone: receiptEntry.donor_phone,
                amount: receiptEntry.amount,
                date: receiptEntry.collected_at || receiptEntry.created,
                categoryName: receiptEntry.category?.name || 'Dîmes & Offrandes',
                serviceName: receiptEntry.service_attendance?.name || receiptEntry.service_name,
                paymentMethod: receiptEntry.payment_method,
                reference: receiptEntry.reference,
                notes: receiptEntry.notes,
              }
            : null
        }
        onClose={() => setReceiptEntry(null)}
      />
    </div>
  );
};
