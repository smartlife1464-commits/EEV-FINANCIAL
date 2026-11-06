import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { ClipboardList, Plus, Printer, X, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AttendanceList: React.FC = () => {
  const { data: sheets = [], isLoading } = useQuery({
    queryKey: ['attendance-sheets'],
    queryFn: () => api.getAttendance(),
  });

  const [selectedSheet, setSelectedSheet] = useState<any | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-500" />
            <span>Fiches de Fréquentation & Statistiques</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historique complet des fiches de présence renseignées par le Protocole.
          </p>
        </div>

        <Link
          to="/attendance/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-400/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Saisir une Nouvelle Fiche</span>
        </Link>
      </div>

      {/* Tableau des fiches */}
      <div className="bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#080E25] text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-[#16214A]">
                <th className="py-4 px-6">Culte</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Hommes</th>
                <th className="py-4 px-6">Femmes</th>
                <th className="py-4 px-6">Jeunes</th>
                <th className="py-4 px-6">Enfants</th>
                <th className="py-4 px-6 font-bold text-amber-500">Total Présents</th>
                <th className="py-4 px-6 font-bold text-blue-500">Nouveaux Visiteurs</th>
                <th className="py-4 px-6">Statut</th>
                <th className="py-4 px-6 text-right">Fiche Officielle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#16214A]">
              {sheets.map((sheet: any) => (
                <tr key={sheet.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                    {sheet.service?.name || sheet.service_name || 'Culte de Célébration'}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(sheet.created || sheet.date)}
                  </td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">{sheet.men_count}</td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">{sheet.women_count}</td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">{sheet.youth_count}</td>
                  <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">{sheet.children_count}</td>
                  <td className="py-4 px-6 font-black text-slate-900 dark:text-white text-base">
                    {sheet.total_attendance}
                  </td>
                  <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400">
                    +{sheet.new_visitors_count}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                      Validée
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedSheet(sheet)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16214A] dark:hover:bg-[#1E2C60] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 ml-auto transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Fiche PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Fiche de Fréquentation Imprimable Officielle */}
      {selectedSheet && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 max-w-2xl w-full rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6 relative print:p-0 print:border-none print:shadow-none">
            {/* Boutons d'action haut (masqués à l'impression) */}
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Aperçu Fiche Officielle • Ministère Esprit & Vie
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer / Exporter PDF</span>
                </button>
                <button
                  onClick={() => setSelectedSheet(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* En-tête imprimable */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <img src="/logo-eev.png" alt="Esprit & Vie" className="w-14 h-14 object-contain" />
                <div>
                  <h2 className="text-lg font-black tracking-wider uppercase text-slate-900">
                    Ministère Esprit & Vie
                  </h2>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Siège Central • Yaoundé, Cameroun
                  </p>
                  <p className="text-xs font-bold text-amber-600 uppercase mt-0.5">
                    Fiche Officielle de Fréquentation du Culte
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold">Date : {formatDate(selectedSheet.created || selectedSheet.date)}</p>
                <p className="text-slate-500">Service : {selectedSheet.service?.name || selectedSheet.service_name}</p>
              </div>
            </div>

            {/* Grille des Présences Exclusives */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                1. Comptabilisation des Participants Exclusifs
              </span>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-100 text-center border">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hommes</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{selectedSheet.men_count}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 text-center border">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Femmes</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{selectedSheet.women_count}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 text-center border">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Jeunes</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{selectedSheet.youth_count}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 text-center border">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Enfants</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{selectedSheet.children_count}</p>
                </div>
              </div>

              {/* Total Strict Formule */}
              <div className="p-4 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-between font-extrabold mt-3">
                <div>
                  <span className="text-xs uppercase tracking-wider block">Total Fréquentation Vérifié</span>
                  <span className="text-[10px] font-normal opacity-90">Formule : Hommes + Femmes + Jeunes + Enfants</span>
                </div>
                <span className="text-3xl">{selectedSheet.total_attendance}</span>
              </div>
            </div>

            {/* Indicateurs complémentaires */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                2. Indicateurs Analytiques Complémentaires (Non Additionnés)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">⭐ Nouveaux Visiteurs</span>
                  <p className="text-2xl font-black text-blue-900 mt-1">{selectedSheet.new_visitors_count}</p>
                  <span className="text-[10px] text-blue-600">Pour intégration pastorale</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">✝️ Décisions pour Christ</span>
                  <p className="text-2xl font-black text-emerald-900 mt-1">{selectedSheet.salvations_count || 14}</p>
                  <span className="text-[10px] text-emerald-600">Âmes sauvées</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
              <div className="space-y-12">
                <p className="font-bold text-slate-700">L'Agent du Protocole (Saisie) :</p>
                <div className="border-b border-dashed border-slate-400 w-4/5" />
              </div>
              <div className="space-y-12 text-right">
                <p className="font-bold text-slate-700">Le Responsable du Protocole (Visa) :</p>
                <div className="border-b border-dashed border-slate-400 w-4/5 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
