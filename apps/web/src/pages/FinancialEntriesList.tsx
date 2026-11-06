import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
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

      {/* Modal Reçu de Versement Officiel Imprimable */}
      {receiptEntry && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setReceiptEntry(null)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-100 dark:bg-[#16214A] text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Document imprimable officiel */}
            <div id="printable-receipt" className="space-y-6 text-slate-900 dark:text-white">
              {/* Header Officiel Ministère */}
              <div className="flex items-center justify-between border-b-2 border-amber-400 pb-4">
                <div className="flex items-center gap-3">
                  <img src="/logo-eev.png" alt="EEV Logo" className="w-12 h-12 object-contain" />
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Ministère Esprit & Vie
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Département des Finances & Comptabilité Analytique
                    </p>
                    <p className="text-[10px] text-amber-500 font-bold uppercase">
                      Siège Central • Yaoundé, Cameroun
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-500 font-mono text-xs font-black">
                    {receiptEntry.entry_number || 'REC-2026-00001'}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Émis le {formatDate(receiptEntry.collected_at || receiptEntry.created)}
                  </p>
                </div>
              </div>

              {/* Titre */}
              <div className="text-center">
                <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Reçu Officiel d'Encaissement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Attestation de réception de fonds au titre des dîmes, offrandes et dons chrétiens.
                </p>
              </div>

              {/* Détails de la transaction */}
              <div className="rounded-2xl p-5 bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Reçu de :</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {receiptEntry.donor_name || 'Assemblée Générale (Anonyme)'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Nature du versement :</span>
                  <span className="font-bold text-amber-500">
                    {receiptEntry.category?.name || 'Dîmes & Offrandes'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Mode de paiement :</span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase">
                    {receiptEntry.payment_method || 'CASH'}
                  </span>
                </div>
                {receiptEntry.reference && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Référence externe :</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {receiptEntry.reference}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-[#16214A] flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Montant Encaissé Brut :
                  </span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatFCFA(receiptEntry.amount)}
                  </span>
                </div>
              </div>

              {/* Ventilation légale */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400">
                <p className="font-bold">Ventilation analytique conforme aux statuts :</p>
                <p className="text-slate-400 mt-0.5">
                  Fonds Général (80%) pour les charges cultuelles • Dîme des dîmes (10%) réservée • Secours & Aide sociale (10%) pour les nécessiteux.
                </p>
              </div>

              {/* Bloc Signatures & Sceau */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 dark:border-[#16214A]">
                <div className="text-center space-y-8">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Le Donateur / Déposant</p>
                  <p className="text-[11px] font-mono text-slate-500">Pour acquit</p>
                </div>
                <div className="text-center space-y-8">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Le Caissier / Trésorier</p>
                  <div className="inline-block px-3 py-1 rounded-full border border-emerald-500/30 text-emerald-500 text-[10px] font-bold">
                    ✓ Reçu Conforme & Scellé
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Modal */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#16214A]">
              <button
                onClick={() => setReceiptEntry(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le Reçu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
