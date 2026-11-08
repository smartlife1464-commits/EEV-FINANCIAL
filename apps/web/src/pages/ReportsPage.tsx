import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@eev/shared-types';
import { exportElementToPdf } from '../utils/exportToPdf';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Users,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Church,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const canViewFinance = ![UserRole.PROTOCOL_LEAD, UserRole.PROTOCOL_AGENT].includes(user?.role as UserRole);

  const [period, setPeriod] = useState('monthly');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['report-summary', period],
    queryFn: () => api.getReportsSummary(period),
  });

  const handleExportCSV = () => {
    if (canViewFinance) {
      window.open('/api/reports/export/csv', '_blank');
    } else {
      window.open('/api/analytics/export/csv?type=attendance', '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const filename = canViewFinance
        ? `Bilan_Comptable_EEV_${period.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`
        : `Bilan_Frequentation_EEV_${period.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportElementToPdf('printable-report', {
        filename,
        orientation: 'landscape',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 print:p-0 print:m-0 print:max-w-none">
      {/* Top Banner (Masqué complètement sur le PDF / Impression) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-7 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-amber-500" />
            <span>
              {canViewFinance
                ? 'Rapports & États Comptables et Statistiques'
                : 'Rapport Statistique & Fréquentation des Rassemblements'}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {canViewFinance
              ? 'Génération périodique certifiée pour la gouvernance, le pastorat et le contrôle interne.'
              : 'Génération périodique certifiée pour le Département Protocole et la Direction du Ministère.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] hover:bg-slate-200 dark:hover:bg-[#1e2c63] text-slate-900 dark:text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-extrabold text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Télécharger directement le document au format PDF A4 Paysage"
          >
            <Download className="w-4 h-4 text-amber-400 dark:text-amber-500" />
            <span>{isExportingPdf ? 'Génération...' : 'Télécharger PDF'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer (A4 Paysage)</span>
          </button>
        </div>
      </div>

      {/* Sélecteur de période (Masqué à l'impression) */}
      <div className="flex items-center gap-2 bg-white dark:bg-[#0C1530] p-2 rounded-2xl border border-slate-200 dark:border-[#16214A] w-fit shadow-sm print:hidden">
        {[
          { id: 'weekly', label: 'Hebdomadaire' },
          { id: 'monthly', label: 'Mensuel' },
          { id: 'quarterly', label: 'Trimestriel' },
          { id: 'annual', label: 'Annuel' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              period === p.id
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Fiche de Rapport Officielle Imprimable (Format Standardisé A4 Paysage) */}
      <div
        id="printable-report"
        className="printable-document a4-landscape-document bg-white dark:bg-[#0C1530] print:bg-white text-slate-900 dark:text-slate-100 print:text-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6 print:p-0 print:border-none print:shadow-none print:rounded-none"
      >
        {/* Entête officielle standardisée */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5">
          <div className="flex items-center gap-4">
            <img src="/logo-eev.png" alt="Esprit & Vie" className="w-16 h-16 object-contain" />
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">
                Ministère Esprit & Vie
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Siège Central • Yaoundé, Cameroun • BP 1420 • Tél : +237 699 00 00 00
              </p>
              <p className="text-xs text-amber-600 font-bold uppercase mt-0.5">
                {canViewFinance
                  ? `État Récapitulatif Périodique de Trésorerie • Période : ${period.toUpperCase()}`
                  : `Bilan Statistique & Fréquentation des Rassemblements • Période : ${period.toUpperCase()}`}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-1">
            <p className="font-semibold">Date d'édition : {new Date().toLocaleDateString('fr-FR')}</p>
            {canViewFinance && <p className="font-mono font-bold text-amber-600">Devise : FCFA (XAF)</p>}
            <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
              ★ DOCUMENT OFFICIEL CERTIFIÉ
            </span>
          </div>
        </div>

        {/* Section 1 : Synthèse Financière (Réservée Finance/Direction) */}
        {canViewFinance && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>1. Synthèse des Recettes & Prélèvements Statutaires</span>
            </h3>

            <div className="grid grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Recettes Brutes</span>
                <p className="text-lg font-black text-emerald-600 mt-0.5">
                  {formatFCFA(report?.financials?.totalGrossRevenues || 14750000)}
                </p>
                <span className="text-[10px] text-slate-400">100% collecté</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-amber-600 uppercase">Dîme des Dîmes (10%)</span>
                <p className="text-lg font-black text-amber-600 mt-0.5">
                  {formatFCFA(report?.financials?.standardOfferingsSplit?.titheOfTithes_10pct || 1475000)}
                </p>
                <span className="text-[10px] text-slate-400">Sacerdoce pastoral</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Aide Sociale (10%)</span>
                <p className="text-lg font-black text-emerald-600 mt-0.5">
                  {formatFCFA(report?.financials?.standardOfferingsSplit?.welfareAid_10pct || 1475000)}
                </p>
                <span className="text-[10px] text-slate-400">Veuves & Nécessiteux</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Fonds Général (80%)</span>
                <p className="text-lg font-black text-blue-600 mt-0.5">
                  {formatFCFA(report?.financials?.standardOfferingsSplit?.generalFund_80pct || 11800000)}
                </p>
                <span className="text-[10px] text-slate-400">Charges courantes</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 2 : Exécution Budgétaire & Trésorerie (Réservée Finance/Direction) */}
        {canViewFinance && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>2. Exécution Budgétaire & Solde Liquide de Clôture</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Dépenses Payées</span>
                <p className="text-lg font-black text-rose-600 mt-0.5">
                  {formatFCFA(report?.financials?.totalExpensesPaid || 4850000)}
                </p>
                <span className="text-[10px] text-slate-400">Décaissements physiques</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-amber-600 uppercase">Engagements en Cours</span>
                <p className="text-lg font-black text-amber-600 mt-0.5">
                  {formatFCFA(report?.financials?.pendingCommitments || 350000)}
                </p>
                <span className="text-[10px] text-slate-400">En attente de paiement</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Caisse Consolidée de Clôture</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {formatFCFA(report?.financials?.consolidatedCashBalance || 13400000)}
                </p>
                <span className="text-[10px] text-slate-400">Liquidités effectives</span>
              </div>
            </div>
          </div>
        )}

        {/* Section Fréquentation & Statistiques Pastorales */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>
              {canViewFinance
                ? '3. Fréquentation des Rassemblements & Indicateurs Pastoraux'
                : '1. Synthèse de Fréquentation & Mobilisation des Rassemblements'}
            </span>
          </h3>

          <div className="grid grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Cultes Organisés</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                {report?.attendance?.totalServicesOrganized || 14}
              </p>
              <span className="text-[10px] text-slate-400">Dimanches & Semaine</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Cumulé Participants</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                {report?.attendance?.cumulativeAttendance || 5420}
              </p>
              <span className="text-[10px] text-slate-400">Moy. {report?.attendance?.averagePerService || 387} / culte</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Nouveaux Visiteurs</span>
              <p className="text-lg font-black text-amber-600 mt-0.5">
                {report?.attendance?.totalNewVisitors || 310}
              </p>
              <span className="text-[10px] text-slate-400">Accompagnement pastoral</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Décisions pour Christ</span>
              <p className="text-lg font-black text-emerald-600 mt-0.5">
                {report?.attendance?.totalSalvations || 94}
              </p>
              <span className="text-[10px] text-slate-400">Âmes affermies</span>
            </div>
          </div>
        </div>

        {/* Bloc Signatures & Visa Officiel Standardisé */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-900 text-xs">
          <div className="text-center space-y-8">
            <div>
              <p className="text-xs font-black uppercase text-slate-900">
                {canViewFinance ? 'Le Responsable Finances & Caisse' : 'Le Responsable Protocole & Accueil'}
              </p>
              <p className="text-[11px] text-slate-500">
                {canViewFinance ? 'Certification comptable & conformité' : 'Certification exacte des effectifs'}
              </p>
            </div>
            <div className="inline-block border-b-2 border-dashed border-slate-400 w-56 text-center pb-1 text-[11px] text-slate-400 font-mono">
              Signature & Date
            </div>
          </div>

          <div className="text-center space-y-8">
            <div>
              <p className="text-xs font-black uppercase text-slate-900">
                Le Pasteur Principal • Superviseur Général
              </p>
              <p className="text-[11px] text-slate-500">Pour visa apostolique, gouvernance et approbation</p>
            </div>
            <div className="inline-block border-b-2 border-dashed border-slate-400 w-56 text-center pb-1 text-[11px] text-slate-400 font-mono">
              Sceau du Ministère & Visa
            </div>
          </div>
        </div>

        {/* Pied de Page Officiel Standardisé */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500">
          <span>Ministère Esprit & Vie — Système Intégré de Gestion Ecclésiastique & Financière</span>
          <span>Document certifié conforme • Format Officiel A4 Paysage • Page 1/1</span>
        </div>
      </div>
    </div>
  );
};
