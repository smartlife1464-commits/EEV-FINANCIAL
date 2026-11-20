import React, { useState } from 'react';
import { BrandLogo, BrandName } from '../components/common/Brand';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2 as ValidateIcon, XCircle as RejectIcon } from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { WhatsAppReportShareModal, WhatsAppServiceReportData } from '../components/documents/WhatsAppReportShareModal';
import { exportElementToPdf } from '../utils/exportToPdf';
import {
  ClipboardList,
  Plus,
  Printer,
  X,
  CheckCircle2,
  Search,
  Download,
  Filter,
  Copy,
  Calendar,
  Clock,
  Eye,
  UserCheck,
  MessageCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useMinistry } from '../hooks/useMinistry';
import { toast } from 'sonner';

export const AttendanceList: React.FC = () => {
  const navigate = useNavigate();
  const { ministry, letterheadLine } = useMinistry();

  const { data: sheets = [], isLoading, refetch } = useQuery({
    queryKey: ['attendance-sheets'],
    queryFn: () => api.getAttendance(),
  });
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canValidate = hasPermission('canValidateAttendance');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Validation à 4 yeux : le Responsable Protocole valide ou renvoie une fiche soumise par un agent
  const handleDecision = async (sheet: any, decision: 'validate' | 'reject') => {
    let reason: string | undefined;
    if (decision === 'reject') {
      reason = window.prompt('Motif du rejet (communiqué à l’auteur de la fiche) :')?.trim();
      if (!reason) return;
    }
    setProcessingId(sheet.id);
    try {
      await api.validateAttendance(sheet.id, decision, reason);
      toast.success(decision === 'validate' ? 'Fiche validée et verrouillée' : 'Fiche renvoyée pour correction');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-dashboard'] });
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'Action impossible');
    } finally {
      setProcessingId(null);
    }
  };

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => api.getServiceTypes(),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSheet, setSelectedSheet] = useState<any | null>(null);
  const [whatsAppReportData, setWhatsAppReportData] = useState<WhatsAppServiceReportData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const getProgramName = (sheet: any) => {
    if (sheet.service_type?.name) return sheet.service_type.name;
    const found = serviceTypes.find((st: any) => st.slug === sheet.service_type_slug);
    if (found) return found.name;
    return sheet.service?.name || sheet.service_name || 'Culte';
  };

  const handleOpenWhatsApp = (sheet: any) => {
    setWhatsAppReportData({
      serviceName: getProgramName(sheet),
      serviceDate: sheet.service_date || sheet.date || sheet.created,
      totalAttendance: sheet.total_attendance || 0,
      menCount: sheet.men_count || 0,
      womenCount: sheet.women_count || 0,
      youthCount: sheet.youth_count || 0,
      childrenCount: sheet.children_count || 0,
      newVisitorsCount: sheet.new_visitors_count || 0,
      salvationsCount: sheet.salvations_count || 0,
      capacityRate: sheet.capacity_rate || undefined,
      responsibleName: sheet.responsible_user?.name || sheet.expand?.responsible_user?.name,
    });
  };

  const filteredSheets = sheets.filter((sheet: any) => {
    const pName = getProgramName(sheet).toLowerCase();
    const matchesSearch =
      pName.includes(searchTerm.toLowerCase()) ||
      (sheet.responsible_user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sheet.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === 'all' ||
      sheet.service_type_slug === selectedType ||
      sheet.service?.service_type === selectedType;

    const matchesStatus = statusFilter === 'all' || sheet.status === statusFilter;

    const sheetDate = sheet.service_date || sheet.created?.split('T')[0] || sheet.date;
    const matchesStartDate = !startDate || sheetDate >= startDate;
    const matchesEndDate = !endDate || sheetDate <= endDate;

    return matchesSearch && matchesType && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const totalFilteredAttendance = filteredSheets.reduce((sum: number, s: any) => sum + (s.total_attendance || 0), 0);
  const totalFilteredVisitors = filteredSheets.reduce((sum: number, s: any) => sum + (s.new_visitors_count || 0), 0);

  const handleDuplicate = (sheet: any) => {
    const params = new URLSearchParams({
      slug: sheet.service_type_slug || '',
      men: String(sheet.men_count || 0),
      women: String(sheet.women_count || 0),
      youth: String(sheet.youth_count || 0),
      children: String(sheet.children_count || 0),
      visitors: String(sheet.new_visitors_count || 0),
    });
    navigate(`/attendance/new?${params.toString()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!selectedSheet) return;
    setIsDownloading(true);
    try {
      const prog = getProgramName(selectedSheet).replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = (selectedSheet.service_date || selectedSheet.date || '').replace(/[^0-9]/g, '');
      await exportElementToPdf('printable-attendance', {
        filename: `Fiche_Frequentation_${prog}_${dateStr || 'Culte'}.pdf`,
        orientation: 'landscape',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            Validée
          </span>
        );
      case 'submitted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Soumise
          </span>
        );
      case 'draft':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
            Brouillon
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-500 border border-rose-500/30">
            Rejetée
          </span>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-7 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-amber-500" />
            <span>Fiches de Fréquentation & Statistiques</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Historique complet des fiches de présence renseignées par le Protocole pour les 7 programmes officiels.
          </p>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={() => api.exportAnalyticsCsv('attendance').catch((err) => toast.error('Export impossible', { description: err.message }))}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-[#16214A] hover:bg-slate-200 dark:hover:bg-[#1e2c63] text-slate-800 dark:text-slate-200 font-bold text-sm transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>Exporter CSV</span>
          </button>
          <Link
            to="/attendance/new"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Saisir une Fiche</span>
          </Link>
        </div>
      </div>

      {/* Barre de Filtres Multiples */}
      <div className="p-7 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-amber-500" />
          <span>Filtres de consultation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Recherche texte */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher culte, responsable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Filtre Programme (7 types) */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">Tous les 7 programmes</option>
              {serviceTypes.map((st: any) => (
                <option key={st.slug} value={st.slug}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date de début */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Date de fin */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Statut */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">Tous les statuts</option>
              <option value="validated">Validées</option>
              <option value="submitted">Soumises</option>
              <option value="draft">Brouillons</option>
              <option value="rejected">Rejetées</option>
            </select>
          </div>
        </div>

        {/* Totaux filtrés */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-[#16214A]">
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-500 text-xs font-black">
              Total participants filtrés : {totalFilteredAttendance}
            </span>
            <span className="px-4 py-2 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-black">
              Nouveaux visiteurs : +{totalFilteredVisitors}
            </span>
          </div>

          <span className="text-xs font-semibold text-slate-400">
            {filteredSheets.length} fiche(s) répertoriée(s)
          </span>
        </div>
      </div>

      {/* Tableau des fiches */}
      <div className="bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#080E25] text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-[#16214A]">
                <th className="py-4 px-6">Programme</th>
                <th className="py-4 px-6">Date & Heures</th>
                <th className="py-4 px-6">Hommes</th>
                <th className="py-4 px-6">Femmes</th>
                <th className="py-4 px-6">Jeunes</th>
                <th className="py-4 px-6">Enfants</th>
                <th className="py-4 px-6 font-bold text-amber-500">Total Participants</th>
                <th className="py-4 px-6 font-bold text-blue-500">Nouveaux Visiteurs</th>
                <th className="py-4 px-6">Statut</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#16214A]">
              {filteredSheets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                    Aucune fiche de fréquentation ne correspond aux filtres appliqués.
                  </td>
                </tr>
              ) : (
                filteredSheets.map((sheet: any) => {
                  const sDate = sheet.service_date || sheet.created?.split('T')[0] || sheet.date;
                  return (
                    <tr key={sheet.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {getProgramName(sheet)}
                        </span>
                        {sheet.responsible_user?.name && (
                          <span className="text-[11px] text-slate-400">
                            Resp: {sheet.responsible_user.name}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(sDate)}</div>
                        <div className="text-[10px] text-slate-400">
                          {sheet.start_time || '09:00'} - {sheet.end_time || '12:00'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">{sheet.men_count}</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">{sheet.women_count}</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">{sheet.youth_count}</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">{sheet.children_count}</td>
                      <td className="py-4 px-6 font-black text-slate-900 dark:text-white text-base">
                        <span className="px-2.5 py-1 rounded-xl bg-amber-400/10 text-amber-500 font-black">
                          {sheet.total_attendance}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400">
                        +{sheet.new_visitors_count}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">{getStatusBadge(sheet.status)}</td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {canValidate && sheet.status === 'submitted' && (sheet.submitted_by?.id || sheet.submitted_by) !== user?.id && (
                            <>
                              <button
                                onClick={() => handleDecision(sheet, 'validate')}
                                disabled={processingId === sheet.id}
                                title="Valider et verrouiller la fiche"
                                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <ValidateIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDecision(sheet, 'reject')}
                                disabled={processingId === sheet.id}
                                title="Renvoyer la fiche pour correction"
                                className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <RejectIcon className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleOpenWhatsApp(sheet)}
                            title="Partager le Bilan du Culte sur WhatsApp"
                            className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedSheet(sheet)}
                            title="Consulter / Imprimer"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16214A] dark:hover:bg-[#1E2C60] text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(sheet)}
                            title="Dupliquer comme brouillon"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16214A] dark:hover:bg-[#1E2C60] text-amber-500 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Fiche de Fréquentation Imprimable Officielle Standardisée A4 Paysage */}
      {selectedSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:p-0 print:m-0 print:bg-white print:static select-none">
          <div className="printable-modal-box bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
            {/* Boutons d'action haut (masqués à l'impression / PDF) */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#16214A] flex items-center justify-between bg-slate-50/70 dark:bg-[#091338]/80 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-sm text-slate-900 dark:text-white">
                    Fiche Officielle de Fréquentation du Culte
                  </p>
                  <p className="text-[11px] font-mono text-amber-500 font-bold">
                    {getProgramName(selectedSheet)} • {formatDate(selectedSheet.service_date || selectedSheet.date)} • Format A4 Paysage
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenWhatsApp(selectedSheet)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                  title="Générer la synthèse WhatsApp pour le Pasteur"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Partager WhatsApp</span>
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-black text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  title="Télécharger directement en PDF A4 Paysage"
                >
                  <Download className="w-4 h-4 text-amber-400 dark:text-amber-500" />
                  <span>{isDownloading ? 'Génération...' : 'Télécharger PDF'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer (A4 Paysage)</span>
                </button>
                <button
                  onClick={() => setSelectedSheet(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corps Officiel A4 de la Fiche de Fréquentation Standardisé */}
            <div
              id="printable-attendance"
              className="printable-document a4-landscape-document p-8 sm:p-10 overflow-y-auto space-y-5 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible"
            >
              {/* En-tête Institutionnel Standardisé */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shrink-0">
                    <BrandLogo className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="font-black text-lg tracking-wider text-slate-950 uppercase">
                      <BrandName upper />
                    </h1>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                      Direction du Protocole & Accueil • Suivi des Rassemblements
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {letterheadLine}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs space-y-1">
                  <p className="font-mono font-bold text-slate-950">
                    FICHE N° ATT-{selectedSheet.id ? selectedSheet.id.substring(0, 8).toUpperCase() : 'REC'}
                  </p>
                  <p className="text-slate-600">
                    Date du culte : <strong className="text-slate-950">{formatDate(selectedSheet.service_date || selectedSheet.date)}</strong>
                  </p>
                  <p className="text-slate-600">
                    Horaire : <span className="font-mono">{selectedSheet.start_time || '09:00'} - {selectedSheet.end_time || '12:00'}</span>
                  </p>
                  <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                    ★ REGISTRE OFFICIEL CERTIFIÉ
                  </span>
                </div>
              </div>

              {/* Titre et Service */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    Programme / Culte
                  </span>
                  <p className="text-base font-black text-slate-900">
                    {getProgramName(selectedSheet)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    Agent du Protocole Référent
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedSheet.recorded_by_name || 'Équipe Protocole'}
                  </p>
                </div>
              </div>

              {/* 1. Comptabilisation des Participants Exclusifs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    1. Répartition Exclusive des Participants
                  </span>
                  <span className="text-[10px] text-slate-500 italic">
                    Chaque participant est compté dans une et une seule catégorie
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Hommes</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{selectedSheet.men_count}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Femmes</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{selectedSheet.women_count}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Jeunes</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{selectedSheet.youth_count}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Enfants</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{selectedSheet.children_count}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-400 text-slate-950 text-center font-black border border-amber-500 shadow-sm flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">Total Général</span>
                    <p className="text-2xl font-black">{selectedSheet.total_attendance}</p>
                    <span className="text-[8px] font-normal opacity-80">(Formule vérifiée)</span>
                  </div>
                </div>
              </div>

              {/* 2. Indicateurs Analytiques Complémentaires */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  2. Indicateurs Analytiques & Moisson Pastorale (Non additionnés au total physique)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase">⭐ Nouveaux Visiteurs (Première Fois)</span>
                      <p className="text-[11px] text-blue-600">À orienter vers la cellule d'intégration pastorale</p>
                    </div>
                    <p className="text-2xl font-black text-blue-900">{selectedSheet.new_visitors_count}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">✝️ Décisions pour Christ / Conversions</span>
                      <p className="text-[11px] text-emerald-600">Âmes réconciliées avec Dieu durant le culte</p>
                    </div>
                    <p className="text-2xl font-black text-emerald-900">{selectedSheet.salvations_count || 0}</p>
                  </div>
                </div>
              </div>

              {selectedSheet.notes && (
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <strong className="text-slate-900">Observations & Faits Marquants : </strong>
                  <span className="text-slate-700">{selectedSheet.notes}</span>
                </div>
              )}

              {/* Blocs de Signatures Standardisés */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-slate-900 text-xs">
                <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between h-24 bg-white">
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-500">
                      1. Agent du Protocole (Saisie & Comptage)
                    </p>
                    <p className="font-bold text-[11px] text-slate-900">
                      {selectedSheet.recorded_by_name || 'Agent de Service'}
                    </p>
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Signature & Visa</p>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between h-24 bg-white">
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-500">
                      2. Responsable du Protocole / Pasteur de Culte (Validation)
                    </p>
                    <p className="font-bold text-[11px] text-slate-900">
                      Gouvernance Ecclésiastique
                    </p>
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Signature & Date</p>
                </div>
              </div>

              {/* Pied de Page Officiel Standardisé */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-500 font-medium">
                <span><BrandName /> — Département du Protocole & Accueil • Registre Officiel de Fréquentation</span>
                <span>Document Officiel Certifié • Format A4 Paysage • Page 1/1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Partage WhatsApp Officiel du Bilan de Culte */}
      <WhatsAppReportShareModal
        data={whatsAppReportData}
        onClose={() => setWhatsAppReportData(null)}
      />
    </div>
  );
};
