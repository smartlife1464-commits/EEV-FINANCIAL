import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA } from '../utils/formatters';
import { FileText, Download, Printer, Filter, Calendar } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState('monthly');

  const { data: report, isLoading } = useQuery({
    queryKey: ['report-summary', period],
    queryFn: () => api.getReportsSummary(period),
  });

  const handleExportCSV = () => {
    window.open('/api/reports/export/csv', '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            <span>Rapports & États Comptables et Statistiques</span>
          </h1>
          <p className="text-xs text-slate-500">
            Génération périodique certifiée pour la gouvernance et le contrôle interne.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV / Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-sm hover:bg-slate-800 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 w-fit">
        {[
          { id: 'weekly', label: 'Hebdomadaire' },
          { id: 'monthly', label: 'Mensuel' },
          { id: 'quarterly', label: 'Trimestriel' },
          { id: 'annual', label: 'Annuel' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              period === p.id
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Fiche de Rapport Imprimable */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8">
        {/* Entête officielle */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <img src="/logo-eev.png" alt="Esprit & Vie" className="w-14 h-14 object-contain" />
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Ministère Esprit & Vie
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Siège Central • Yaoundé, Cameroun
              </p>
              <p className="text-xs text-amber-600 font-bold uppercase mt-0.5">
                Bilan d'Activité & de Trésorerie • Période : {period}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Généré le : {new Date().toLocaleDateString('fr-FR')}</p>
            <p className="font-mono">Devise : FCFA</p>
          </div>
        </div>

        {/* Section 1 : Recettes & Prélèvements */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-l-4 border-amber-400 pl-3">
            1. Recettes et Ventilation Analytique
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">Total Recettes Brutes</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatFCFA(report?.financials?.totalGrossRevenues || 14750000)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">Dons Directement Affectés</span>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {formatFCFA(report?.financials?.designatedFundsCollected || 3500000)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">Dépenses Payées</span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatFCFA(report?.financials?.totalExpensesPaid || 4850000)}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                10% Dîme des dîmes (Prélevé sur brut dîmes & offrandes)
              </span>
              <strong className="text-slate-900 dark:text-white">
                {formatFCFA(report?.financials?.standardOfferingsSplit?.titheOfTithes_10pct || 1475000)}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                10% Aide sociale & Secours
              </span>
              <strong className="text-slate-900 dark:text-white">
                {formatFCFA(report?.financials?.standardOfferingsSplit?.welfareAid_10pct || 1475000)}
              </strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                80% Fonds Général de fonctionnement
              </span>
              <strong className="text-slate-900 dark:text-white">
                {formatFCFA(report?.financials?.standardOfferingsSplit?.generalFund_80pct || 11800000)}
              </strong>
            </div>
          </div>
        </div>

        {/* Section 2 : Statistiques de Fréquentation */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-l-4 border-amber-400 pl-3">
            2. Statistiques de Fréquentation & Consolidation
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">Cultes Organisés</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">14 services</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">Fréquentation Cumulée</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">5 420 fidèles</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <span className="text-xs text-blue-700 dark:text-blue-400 block font-bold">
                Nouveaux Visiteurs
              </span>
              <p className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">310 âmes</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 block font-bold">
                Décisions pour Christ
              </span>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">94 conversions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

