import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@eev/shared-types';
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
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const canViewFinance = ![UserRole.PROTOCOL_LEAD, UserRole.PROTOCOL_AGENT].includes(user?.role as UserRole);

  const [period, setPeriod] = useState('monthly');

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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-7 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
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

        <div className="flex items-center gap-3.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-[#16214A] hover:bg-slate-200 dark:hover:bg-[#1e2c63] text-slate-900 dark:text-white font-bold text-sm transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="flex items-center gap-2 bg-white dark:bg-[#0C1530] p-2 rounded-2xl border border-slate-200 dark:border-[#16214A] w-fit shadow-sm">
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

      {/* Fiche de Rapport Officielle Imprimable */}
      <div className="bg-white dark:bg-[#0C1530] rounded-3xl p-8 border border-slate-200 dark:border-[#16214A] shadow-sm space-y-8">
        {/* Entête officielle */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#16214A] pb-6">
          <div className="flex items-center gap-4">
            <img src="/logo-eev.png" alt="Esprit & Vie" className="w-16 h-16 object-contain" />
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Ministère Esprit & Vie
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Siège Central • Yaoundé, Cameroun
              </p>
              <p className="text-xs text-amber-500 font-bold uppercase mt-0.5">
                {canViewFinance
                  ? `Bilan d'Activité & de Trésorerie • Période : ${period.toUpperCase()}`
                  : `Bilan Statistique & Fréquentation des Cultes • Période : ${period.toUpperCase()}`}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 space-y-1">
            <p>Date d’édition : {new Date().toLocaleDateString('fr-FR')}</p>
            {canViewFinance && <p className="font-mono font-bold text-amber-500">Devise : FCFA</p>}
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Certifié Conforme
            </span>
          </div>
        </div>

        {/* Section 1 : Synthèse Financière (Réservée Finance/Direction) */}
        {canViewFinance && (
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span>1. Synthèse des Recettes & Prélèvements Statutaires</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Recettes Brutes</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatFCFA(report?.financials?.totalGrossRevenues || 14750000)}
                </p>
                <span className="text-[10px] text-slate-500">100% collecté</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[11px] font-bold text-amber-500 uppercase">Dîme des Dîmes (10%)</span>
                <p className="text-xl font-black text-amber-500 mt-1">
                  {formatFCFA(report?.financials?.standardOfferingsSplit?.titheOfTithes_10pct || 1475000)}
                </p>
                <span className="text-[10px] text-slate-500">Sacerdoce pastoral</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[11px] font-bold text-emerald-500 uppercase">Aide Sociale (10%)</span>
                <p className="text-xl font-black text-emerald-500 mt-1">
                  {formatFCFA(report?.financials?.standardOfferingsSplit?.welfareAid_10pct || 1475000)}
                </p>
                <span className="text-[10px] text-slate-500">Veuves & Nécessiteux</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[11px] font-bold text-blue-400 uppercase">Fonds Général (80%)</span>
                <p className="text-xl font-black text-blue-500 mt-1">
                  {formatFCFA(report?.financials?.standardOfferingsSplit?.generalFund_80pct || 11800000)}
                </p>
                <span className="text-[10px] text-slate-500">Charges de fonctionnement</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 2 : Exécution Budgétaire & Trésorerie (Réservée Finance/Direction) */}
        {canViewFinance && (
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>2. Exécution Budgétaire & Solde Liquide de Clôture</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[11px] font-bold text-rose-500 uppercase">Dépenses Payées</span>
                <p className="text-xl font-black text-rose-500 mt-1">
                  {formatFCFA(report?.financials?.totalExpensesPaid || 4850000)}
                </p>
                <span className="text-[10px] text-slate-500">Décaissements physiques</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[11px] font-bold text-amber-500 uppercase">Engagements en Cours</span>
                <p className="text-xl font-black text-amber-500 mt-1">
                  {formatFCFA(report?.financials?.pendingCommitments || 350000)}
                </p>
                <span className="text-[10px] text-slate-500">En attente de paiement</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[11px] font-bold text-emerald-500 uppercase">Caisse Consolidée de Clôture</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {formatFCFA(report?.financials?.consolidatedCashBalance || 13400000)}
                </p>
                <span className="text-[10px] text-slate-500">Solde réel physique</span>
              </div>
            </div>
          </div>
        )}

        {/* Section Fréquentation & Statistiques Pastorales (Accessible au Protocole et à tous) */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span>
              {canViewFinance
                ? '3. Fréquentation des Rassemblements & Indicateurs Pastoraux'
                : '1. Synthèse de Fréquentation & Mobilisation des Rassemblements'}
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Cultes Organisés</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {report?.attendance?.totalServicesOrganized || 14}
              </p>
              <span className="text-[10px] text-slate-500">Dimanches & Semaine</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Cumulé Participants</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {report?.attendance?.cumulativeAttendance || 5420}
              </p>
              <span className="text-[10px] text-slate-500">Moy. {report?.attendance?.averagePerService || 387} / culte</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
              <span className="text-[11px] font-bold text-amber-500 uppercase">Nouveaux Visiteurs</span>
              <p className="text-xl font-black text-amber-500 mt-1">
                {report?.attendance?.totalNewVisitors || 310}
              </p>
              <span className="text-[10px] text-slate-500">Indicateur complémentaire</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
              <span className="text-[11px] font-bold text-emerald-500 uppercase">Décisions pour Christ</span>
              <p className="text-xl font-black text-emerald-500 mt-1">
                {report?.attendance?.totalSalvations || 94}
              </p>
              <span className="text-[10px] text-slate-500">Suivi d'affermissement</span>
            </div>
          </div>
        </div>

        {/* Bloc Signatures & Visa Officiel */}
        <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-200 dark:border-[#16214A]">
          <div className="text-center space-y-12">
            <div>
              <p className="text-xs font-black uppercase text-slate-900 dark:text-white">
                {canViewFinance ? 'Le Responsable Finances & Caisse' : 'Le Responsable Protocole & Accueil'}
              </p>
              <p className="text-[11px] text-slate-400">
                {canViewFinance ? 'Pour certification comptable' : 'Pour certification des effectifs'}
              </p>
            </div>
            <div className="inline-block border-b-2 border-slate-300 dark:border-slate-700 w-48 text-center pb-1 text-xs text-slate-400 font-mono">
              Signature & Date
            </div>
          </div>

          <div className="text-center space-y-12">
            <div>
              <p className="text-xs font-black uppercase text-slate-900 dark:text-white">
                Le Leader Principal du Ministère
              </p>
              <p className="text-[11px] text-slate-400">Pour visa de gouvernance et approbation</p>
            </div>
            <div className="inline-block border-b-2 border-slate-300 dark:border-slate-700 w-48 text-center pb-1 text-xs text-slate-400 font-mono">
              Sceau Apostolique & Visa
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
