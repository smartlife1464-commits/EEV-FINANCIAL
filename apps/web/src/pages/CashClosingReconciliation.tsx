import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { calculateCashReconciliation, CashCountBreakdown } from '@eev/business-rules';
import { formatFCFA, formatDate } from '../utils/formatters';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CashClosingReconciliation: React.FC = () => {
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

  const theoreticalBalance = treasury?.consolidatedPhysicalBalance || 14750000;

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
      alert('Veuillez renseigner au moins une coupure de billet ou de pièce.');
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
      alert('Procès-Verbal de clôture scellé et enregistré avec succès !');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement de la clôture.');
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
          ))}
        </div>
      </div>

      {/* Modal Officiel Procès-Verbal Imprimable */}
      {selectedPV && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 max-w-2xl w-full rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6 relative print:p-0 print:border-none print:shadow-none">
            {/* Header masqué à l'impression */}
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Document Officiel de Gouvernance • Ministère Esprit & Vie
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le PV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPV(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* En-tête officiel du PV */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <img src="/logo-eev.png" alt="Esprit & Vie" className="w-14 h-14 object-contain" />
                <div>
                  <h2 className="text-base font-black uppercase text-slate-900">
                    Ministère Esprit & Vie
                  </h2>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Département des Finances & Contrôle Interne
                  </p>
                  <p className="text-xs font-bold text-amber-600 uppercase mt-0.5">
                    PROCÈS-VERBAL DE CLÔTURE DE CAISSE CONTRADICTOIRE
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-mono font-bold text-slate-900">{selectedPV.closing_number}</p>
                <p className="text-slate-500">Date : {formatDate(selectedPV.date || selectedPV.created)}</p>
              </div>
            </div>

            {/* Tableau de Rapprochement */}
            <div className="p-4 rounded-2xl bg-slate-100 border space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500 font-bold uppercase">Contexte / Culte :</span>
                <span className="font-extrabold text-slate-900">{selectedPV.service_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500 font-bold uppercase">Agent Clôturant :</span>
                <span className="font-medium text-slate-900">{selectedPV.closed_by_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500 font-bold uppercase">Solde Théorique Calculé :</span>
                <span className="font-bold text-slate-900">{formatFCFA(selectedPV.theoretical_balance)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500 font-bold uppercase">Total Physique Dénombré :</span>
                <span className="font-black text-slate-900 text-sm">{formatFCFA(selectedPV.counted_balance)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm font-bold">
                <span className="uppercase text-slate-700">Diagnostic de l'Écart :</span>
                <span className={selectedPV.discrepancy === 0 ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>
                  {selectedPV.discrepancy === 0
                    ? '✓ Caisse Parfaitement Juste (Écart : 0 FCFA)'
                    : selectedPV.discrepancy > 0
                    ? `Excédent constaté : +${formatFCFA(selectedPV.discrepancy)}`
                    : `Manquant constaté : ${formatFCFA(selectedPV.discrepancy)}`}
                </span>
              </div>
            </div>

            {/* Note d'intégrité */}
            <p className="text-[11px] text-slate-600 italic border-l-2 border-amber-500 pl-3">
              « Les soussignés certifient sur l'honneur l'exactitude des montants dénombrés ci-dessus, scellés en caisse centrale conformément aux statuts du Ministère Esprit & Vie. »
            </p>

            {/* 3 Blocs de Signature */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-xs">
              <div className="space-y-10 text-center">
                <p className="font-bold text-slate-700">Le Caissier</p>
                <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto" />
              </div>
              <div className="space-y-10 text-center">
                <p className="font-bold text-slate-700">L'Auditeur / Contrôleur</p>
                <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto" />
              </div>
              <div className="space-y-10 text-center">
                <p className="font-bold text-slate-700">Le Leader Principal</p>
                <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

