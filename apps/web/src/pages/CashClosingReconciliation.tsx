import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { calculateCashReconciliation, CashCountBreakdown } from '@eev/business-rules';
import { formatFCFA, formatDate } from '../utils/formatters';
import { WhatsAppReportShareModal, WhatsAppServiceReportData } from '../components/documents/WhatsAppReportShareModal';
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
  History,
  Coins,
  Wallet,
  Calendar,
  X,
  Plus,
  Scale,
  FileText,
  MessageCircle,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportElementToPdf } from '../utils/exportToPdf';
import { useMinistry } from '../hooks/useMinistry';
import { toast } from 'sonner';

export const CashClosingReconciliation: React.FC = () => {
  const { ministry, letterheadLine } = useMinistry();
  const { data: treasury } = useQuery({
    queryKey: ['treasury-overview'],
    queryFn: () => api.getTreasuryOverview(),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices(),
  });

  const { data: pastClosings = [], refetch: refetchClosings } = useQuery({
    queryKey: ['cash-closings'],
    queryFn: () => api.getCashClosings(),
  });

  const theoreticalBalance = treasury?.consolidatedPhysicalBalance ?? 0;

  // Billetage state
  const [b10000, setB10000] = useState<number>(0);
  const [b5000, setB5000] = useState<number>(0);
  const [b2000, setB2000] = useState<number>(0);
  const [b1000, setB1000] = useState<number>(0);
  const [b500, setB500] = useState<number>(0);

  const [c500, setC500] = useState<number>(0);
  const [c100, setC100] = useState<number>(0);
  const [c50, setC50] = useState<number>(0);
  const [c25, setC25] = useState<number>(0);

  const [mobileMoney, setMobileMoney] = useState<number>(0);
  const [bankTransfers, setBankTransfers] = useState<number>(0);
  const [checks, setChecks] = useState<number>(0);

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedPV, setSelectedPV] = useState<any | null>(null);
  const [whatsAppReportData, setWhatsAppReportData] = useState<WhatsAppServiceReportData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!selectedPV) return;
    setIsDownloading(true);
    try {
      const pvRef = (selectedPV.closing_number || 'PV-CLOTURE').replace(/[^a-zA-Z0-9]/g, '_');
      await exportElementToPdf('printable-cash-closing', {
        filename: `PV_Cloture_Caisse_${pvRef}.pdf`,
        orientation: 'landscape',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareClosingWhatsApp = (closing: any) => {
    // Partage strictement financier : aucune donnée de fréquentation inventée
    setWhatsAppReportData({
      serviceName: closing.service_name || 'Caisse Générale',
      serviceDate: closing.date || closing.created || new Date().toISOString(),
      cashClosing: {
        pvNumber: closing.closing_number,
        theoreticalBalance: closing.theoretical_balance || 0,
        countedBalance: closing.counted_balance || 0,
        discrepancy: closing.discrepancy || 0,
        statusLabel: closing.status_label || closing.status,
      },
      responsibleName: closing.closed_by_name || 'Caissier Principal',
    });
  };

  const countBreakdown: CashCountBreakdown = {
    b10000,
    b5000,
    b2000,
    b1000,
    b500,
    c500,
    c100,
    c50,
    c25,
    mobileMoneyAmount: mobileMoney,
    bankTransfersAmount: bankTransfers,
    checksAmount: checks,
  };

  const reconciliation = calculateCashReconciliation(countBreakdown, theoreticalBalance);

  const handlePreFillJuste = () => {
    // Remplissage automatique pour démonstration d'une caisse juste
    setB10000(1000); // 10 000 000
    setB5000(600);   // 3 000 000
    setB2000(500);   // 1 000 000
    setB1000(500);   // 500 000
    setB500(200);    // 100 000
    setC500(200);    // 100 000
    setC100(300);    // 30 000
    setC50(200);     // 10 000
    setC25(400);     // 10 000
    setMobileMoney(0);
    setBankTransfers(0);
    setChecks(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reconciliation.grandTotalCounted === 0) {
      toast.error('Veuillez renseigner au moins une coupure de billet ou de pièce.');
      return;
    }

    const srv = services.find((s: any) => s.id === selectedServiceId);

    setSubmitting(true);
    try {
      const record = await api.createCashClosing({
        serviceId: selectedServiceId || undefined,
        serviceName: srv ? srv.name : 'Clôture Caisse Générale',
        theoreticalBalance,
        breakdown: countBreakdown,
        notes,
      });

      await refetchClosings();
      setSelectedPV(record);
      toast.success('Procès-Verbal de clôture scellé et enregistré avec succès !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l’enregistrement de la clôture.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-500" />
            <span>Clôture de Caisse, Billetage & Rapprochement</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Comptage physique contradictoire, calcul automatique des écarts et établissement du Procès-Verbal (PV).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePreFillJuste}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-[#16214A] hover:bg-slate-200 dark:hover:bg-[#1e2c63] text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Simuler Caisse Juste</span>
          </button>
        </div>
      </div>

      {/* Résumé de Comparaison en direct */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Solde Théorique Caisse
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatFCFA(theoreticalBalance)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Calculé d'après les entrées et sorties payées
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Espèces Physiques Comptées
          </span>
          <div className="text-xl font-black text-amber-500 mt-1">
            {formatFCFA(reconciliation.physicalCashTotal)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Billets et pièces dénombrés en coffre
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Total Général Inventorié
          </span>
          <div className="text-xl font-black text-blue-500 mt-1">
            {formatFCFA(reconciliation.grandTotalCounted)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Espèces + Mobile Money + Comptes
          </p>
        </div>

        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            reconciliation.status === 'balanced'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : reconciliation.status === 'surplus'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block">
            Écart Constaté
          </span>
          <div className="text-xl font-black mt-1">
            {reconciliation.discrepancy > 0 ? `+${formatFCFA(reconciliation.discrepancy)}` : formatFCFA(reconciliation.discrepancy)}
          </div>
          <p className="text-[10px] font-bold mt-0.5">
            {reconciliation.statusLabel}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rattachement au Culte & Contexte */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Culte / Service Associé
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-semibold text-xs outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Clôture de Caisse Générale (Sans culte direct)</option>
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.date})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Observations / Notes de Clôture
            </label>
            <input
              type="text"
              placeholder="Ex: Comptage contradictoire en présence de l'auditeur..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-medium text-xs outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Section Billetage : Billets */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#16214A] pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                <span>1. Dénombrement des Coupures de Billets (CEMAC)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Indiquez la quantité physique comptée pour chaque coupure.
              </p>
            </div>
            <span className="text-xs font-extrabold text-amber-500">
              Sous-total Billets : {formatFCFA(b10000 * 10000 + b5000 * 5000 + b2000 * 2000 + b1000 * 1000 + b500 * 500)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: '10 000 FCFA', value: b10000, setter: setB10000, unit: 10000, color: 'text-emerald-500' },
              { label: '5 000 FCFA', value: b5000, setter: setB5000, unit: 5000, color: 'text-blue-500' },
              { label: '2 000 FCFA', value: b2000, setter: setB2000, unit: 2000, color: 'text-amber-500' },
              { label: '1 000 FCFA', value: b1000, setter: setB1000, unit: 1000, color: 'text-indigo-500' },
              { label: '500 FCFA', value: b500, setter: setB500, unit: 500, color: 'text-slate-400' },
            ].map((b) => (
              <div key={b.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-2">
                <span className={`block text-xs font-black uppercase ${b.color}`}>
                  {b.label}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={b.value || ''}
                  onChange={(e) => b.setter(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-black text-sm text-center outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="block text-center text-[10px] font-bold text-slate-400">
                  = {formatFCFA(b.value * b.unit)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section Pièces de Monnaie */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#16214A] pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span>2. Dénombrement des Pièces de Monnaie (CEMAC)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comptabilisation des pièces métalliques de la caisse.
              </p>
            </div>
            <span className="text-xs font-extrabold text-amber-500">
              Sous-total Pièces : {formatFCFA(c500 * 500 + c100 * 100 + c50 * 50 + c25 * 25)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: '500 FCFA', value: c500, setter: setC500, unit: 500 },
              { label: '100 FCFA', value: c100, setter: setC100, unit: 100 },
              { label: '50 FCFA', value: c50, setter: setC50, unit: 50 },
              { label: '25 FCFA', value: c25, setter: setC25, unit: 25 },
            ].map((c) => (
              <div key={c.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-2">
                <span className="block text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                  {c.label}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={c.value || ''}
                  onChange={(e) => c.setter(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-black text-sm text-center outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="block text-center text-[10px] font-bold text-slate-400">
                  = {formatFCFA(c.value * c.unit)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section Avoirs Électroniques & Chèques */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#16214A] pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-500" />
                <span>3. Règlements Électroniques & Chèques en Caisse</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Soldes contrôlés sur les comptes mobiles et chèques physiques en coffre.
              </p>
            </div>
            <span className="text-xs font-extrabold text-indigo-500">
              Sous-total : {formatFCFA(mobileMoney + bankTransfers + checks)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-2">
              <span className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                📱 Mobile Money (OM / MoMo)
              </span>
              <input
                type="number"
                min="0"
                value={mobileMoney || ''}
                onChange={(e) => setMobileMoney(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Montant FCFA"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-2">
              <span className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                🏦 Virements Bancaires Constatés
              </span>
              <input
                type="number"
                min="0"
                value={bankTransfers || ''}
                onChange={(e) => setBankTransfers(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Montant FCFA"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-2">
              <span className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                🧾 Chèques Physiques en Coffre
              </span>
              <input
                type="number"
                min="0"
                value={checks || ''}
                onChange={(e) => setChecks(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Montant FCFA"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Bouton de Soumission & Établissement du PV */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#16214A]">
          <Link
            to="/finance"
            className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-700 dark:text-slate-300 text-xs font-bold"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Validation...' : 'Sceller le Procès-Verbal de Caisse (PV)'}</span>
          </button>
        </div>
      </form>

      {/* Historique des Clôtures antérieures */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#16214A] pb-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm">
            <History className="w-5 h-5 text-amber-500" />
            <span>Historique des Procès-Verbaux de Clôture Scellés</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#16214A]">
          {pastClosings.map((closing: any) => (
            <div key={closing.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                    {closing.closing_number}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      closing.status === 'balanced'
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                        : closing.status === 'surplus'
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25'
                        : 'bg-rose-500/15 text-rose-500 border border-rose-500/25'
                    }`}
                  >
                    {closing.status === 'balanced' ? '✓ Caisse Juste' : closing.status === 'surplus' ? 'Excédent' : 'Manquant'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {closing.service_name} • Clôturé par : <strong>{closing.closed_by_name}</strong> le {formatDate(closing.date)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    {formatFCFA(closing.counted_balance)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Écart : {closing.discrepancy > 0 ? `+${formatFCFA(closing.discrepancy)}` : formatFCFA(closing.discrepancy)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareClosingWhatsApp(closing)}
                    title="Partager le Bilan Culte & Caisse sur WhatsApp"
                    className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPV(closing)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16214A] dark:hover:bg-[#1E2C60] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Voir PV</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Officiel Procès-Verbal Imprimable Standardisé A4 Paysage */}
      {selectedPV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:p-0 print:m-0 print:bg-white print:static select-none">
          <div className="printable-modal-box bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
            {/* Header masqué à l'impression / PDF */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#16214A] flex items-center justify-between bg-slate-50/70 dark:bg-[#091338]/80 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-sm text-slate-900 dark:text-white">
                    Procès-Verbal de Clôture de Caisse Contradictoire
                  </p>
                  <p className="text-[11px] font-mono text-amber-500 font-bold">
                    N° {selectedPV.closing_number} • Format A4 Paysage
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareClosingWhatsApp(selectedPV)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                  title="Partager le bilan sur WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Partager WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-black text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  title="Télécharger directement en PDF A4 Paysage"
                >
                  <Download className="w-4 h-4 text-amber-400 dark:text-amber-500" />
                  <span>{isDownloading ? 'Génération...' : 'Télécharger PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer (A4 Paysage)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPV(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corps Officiel A4 du Procès-Verbal Standardisé */}
            <div
              id="printable-cash-closing"
              className="printable-document a4-landscape-document p-8 sm:p-10 overflow-y-auto space-y-5 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible"
            >
              {/* En-tête Institutionnel Standardisé */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shrink-0">
                    <img
                      src="/logo-eev.png"
                      alt="Ministère Esprit & Vie"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="font-black text-lg tracking-wider text-slate-950 uppercase">
                      MINISTÈRE ESPRIT & VIE
                    </h1>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                      Département des Finances & Contrôle Interne
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {letterheadLine}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs space-y-1">
                  <p className="font-mono font-bold text-slate-950">
                    PV N° {selectedPV.closing_number}
                  </p>
                  <p className="text-slate-600">
                    Arrêté le : <strong className="text-slate-950">{formatDate(selectedPV.date || selectedPV.created)}</strong>
                  </p>
                  <p className="text-slate-600">
                    Devise : <span className="font-mono font-bold text-amber-600">FCFA (XAF)</span>
                  </p>
                  <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                    ★ CONTRÔLE CONTRADICTOIRE CONFORME
                  </span>
                </div>
              </div>

              {/* Titre et Contexte */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    Contexte & Rassemblement
                  </span>
                  <p className="text-base font-black text-slate-900">
                    {selectedPV.service_name || 'Séance Générale de Caisse'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    Agent Clôturant Référent
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedPV.closed_by_name || 'Caissier Principal'}
                  </p>
                </div>
              </div>

              {/* Synthèse Tripartite de Rapprochement */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    1. Solde Théorique Comptable
                  </span>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {formatFCFA(selectedPV.theoretical_balance)}
                  </p>
                  <span className="text-[10px] text-slate-500">Selon écritures enregistrées</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    2. Total Physique Dénombré
                  </span>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {formatFCFA(selectedPV.counted_balance)}
                  </p>
                  <span className="text-[10px] text-slate-500">Billetage, pièces & valeurs</span>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  selectedPV.discrepancy === 0
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                    : selectedPV.discrepancy > 0
                    ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                    : 'bg-rose-50/70 border-rose-300 text-rose-900'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block">
                    3. Écart de Rapprochement
                  </span>
                  <p className="text-xl font-black mt-1">
                    {selectedPV.discrepancy === 0
                      ? '0 FCFA'
                      : (selectedPV.discrepancy > 0 ? `+${formatFCFA(selectedPV.discrepancy)}` : formatFCFA(selectedPV.discrepancy))}
                  </p>
                  <span className="text-[10px] font-bold">
                    {selectedPV.discrepancy === 0
                      ? '✓ Caisse Parfaitement Équilibrée'
                      : selectedPV.discrepancy > 0
                      ? 'Excédent physique constaté'
                      : 'Déficit physique constaté'}
                  </span>
                </div>
              </div>

              {/* Note d'intégrité ecclésiastique */}
              <div className="p-3 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl text-xs text-slate-700 italic">
                « Les soussignés certifient sur l'honneur l'exactitude des montants dénombrés contradictoirement ci-dessus, scellés en caisse centrale conformément aux statuts et règlements financiers du Ministère Esprit & Vie. »
              </div>

              {selectedPV.notes && (
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <strong className="text-slate-900">Observations de Séance : </strong>
                  <span className="text-slate-700">{selectedPV.notes}</span>
                </div>
              )}

              {/* Triple Bloc de Signatures Standardisé */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-900 text-xs">
                <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between h-24 bg-white">
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-500">
                      1. Le Caissier (Dénombrement)
                    </p>
                    <p className="font-bold text-[11px] text-slate-900 truncate">
                      {selectedPV.closed_by_name || 'Caissier de Service'}
                    </p>
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Signature & Visa</p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between h-24 bg-white">
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-500">
                      2. L'Auditeur / Contrôleur Interne
                    </p>
                    <p className="font-bold text-[11px] text-slate-900 truncate">
                      Contrôle & Certification
                    </p>
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Visa & Date</p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between h-24 bg-white">
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-500">
                      3. Le Leader Principal
                    </p>
                    <p className="font-bold text-[11px] text-slate-900 truncate">
                      Approbation Pastorale
                    </p>
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Signature & Mention "Vu"</p>
                </div>
              </div>

              {/* Pied de Page Officiel Standardisé */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-500 font-medium">
                <span>Ministère Esprit & Vie — Département des Finances & Contrôle Interne • Registre des Clôtures</span>
                <span>Document Officiel Certifié • Format A4 Paysage • Page 1/1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Partage WhatsApp Bilan de Culte */}
      <WhatsAppReportShareModal
        data={whatsAppReportData}
        onClose={() => setWhatsAppReportData(null)}
      />
    </div>
  );
};

