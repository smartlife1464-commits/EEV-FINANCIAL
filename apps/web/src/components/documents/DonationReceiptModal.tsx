import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { numberToWordsFCFA } from '../../utils/numberToWords';
import { exportElementToPdf } from '../../utils/exportToPdf';
import { X, Printer, ShieldCheck, CheckCircle2, Download } from 'lucide-react';
import { useMinistry } from '../../hooks/useMinistry';

export interface DonationReceiptData {
  id: string;
  receiptNumber?: string;
  donorName?: string;
  donorPhone?: string;
  amount: number;
  date: string;
  categoryName: string;
  serviceName?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

interface DonationReceiptModalProps {
  receipt: DonationReceiptData | null;
  onClose: () => void;
}

export const DonationReceiptModal: React.FC<DonationReceiptModalProps> = ({ receipt, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { ministry, addressLine, contactLine } = useMinistry();

  if (!receipt) return null;

  const receiptRef =
    receipt.receiptNumber ||
    `REC-${new Date(receipt.date || Date.now()).getFullYear()}-${(receipt.id || '001')
      .slice(-6)
      .toUpperCase()}`;

  const donorDisplayName = receipt.donorName?.trim() || 'Fidèle Donateur (Anonyme)';
  const amountInWords = numberToWordsFCFA(receipt.amount);

  // Payload encodé dans le QR Code pour vérification d'authenticité
  const qrVerificationData = JSON.stringify({
    ref: receiptRef,
    ministry: 'Esprit & Vie',
    amount: receipt.amount,
    currency: 'XAF',
    date: receipt.date,
    category: receipt.categoryName,
    donor: donorDisplayName,
    verified: true,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await exportElementToPdf('printable-receipt', {
        filename: `Recu_${receiptRef}.pdf`,
        orientation: 'landscape',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:p-0 print:m-0 print:bg-white print:static select-none">
      <div className="printable-modal-box bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
        {/* Header de contrôle (Masqué complètement à l'impression / PDF) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#16214A] flex items-center justify-between bg-slate-50/70 dark:bg-[#091338]/80 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm text-slate-900 dark:text-white">
                Reçu Officiel Certifié
              </p>
              <p className="text-[11px] font-mono text-amber-500 font-bold">
                Réf: {receiptRef} • Format A4 Paysage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps du Reçu Officiel Standardisé A4 Paysage */}
        <div
          id="printable-receipt"
          className="printable-document a4-landscape-document p-8 sm:p-10 overflow-y-auto space-y-6 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible"
        >
          {/* En-tête Institutionnel */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
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
                  Direction Générale • Caisse Centrale
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {addressLine || 'Adresse à renseigner dans Paramètres'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {contactLine}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                QUITTANCE OFFICIELLE
              </span>
              <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                N° {receiptRef}
              </p>
              <p className="text-[11px] text-slate-500">
                Date : {formatDate(receipt.date)}
              </p>
            </div>
          </div>

          {/* Titre du Reçu */}
          <div className="text-center py-1">
            <h2 className="text-base font-black tracking-widest text-slate-950 uppercase border-y border-dashed border-slate-300 py-2">
              REÇU DE LIBÉRALITÉS, DÎMES & OFFRANDES
            </h2>
          </div>

          {/* Données du Donateur & Imputation */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
            <div className="space-y-1.5">
              <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Reçu de (Donateur) :
              </p>
              <p className="font-black text-sm text-slate-900">
                {donorDisplayName}
              </p>
              {receipt.donorPhone && (
                <p className="text-slate-600 font-medium">
                  Contact : {receipt.donorPhone}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Affectation Ecclésiastique :
              </p>
              <p className="font-black text-sm text-slate-900">
                {receipt.categoryName}
              </p>
              {receipt.serviceName && (
                <p className="text-slate-600 font-medium">
                  Culte : {receipt.serviceName}
                </p>
              )}
            </div>
          </div>

          {/* Bloc Montant en Chiffres et en Lettres */}
          <div className="border-2 border-slate-900 rounded-2xl p-5 bg-gradient-to-r from-amber-50/50 to-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                Montant total versé :
              </p>
              <p className="text-3xl font-black text-slate-950 tracking-tight">
                {formatFCFA(receipt.amount)}
              </p>
              <p className="text-xs text-slate-700 italic font-semibold mt-1">
                Soit la somme de : <span className="underline">{amountInWords}</span>
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-slate-300 sm:pl-5">
              <p className="text-[10px] uppercase font-bold text-slate-500">
                Mode de Paiement :
              </p>
              <p className="font-black text-xs text-slate-900 uppercase">
                {receipt.paymentMethod || 'Espèces (Caisse Centrale)'}
              </p>
              {receipt.reference && (
                <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                  Réf: {receipt.reference}
                </p>
              )}
            </div>
          </div>

          {/* Zone Sceau Numérique, QR Code & Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 items-end">
            {/* Colonne 1 : QR Code d'Authenticité */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <QRCodeSVG
                value={qrVerificationData}
                size={88}
                level="M"
                includeMargin={false}
              />
              <p className="text-[9px] font-mono text-slate-500 mt-2 text-center uppercase tracking-widest font-bold">
                Authenticité Vérifiable
              </p>
            </div>

            {/* Colonne 2 : Tampon Ecclésiastique Officiel */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-amber-600 p-1 flex flex-col items-center justify-center text-[8px] font-black uppercase text-amber-700 rotate-[-8deg] shadow-inner">
                <span>MINISTÈRE</span>
                <span className="font-extrabold text-[9px] text-amber-800">ESPRIT & VIE</span>
                <span className="text-[7px] text-emerald-700">★ CERTIFIÉ CONFORME ★</span>
                <span className="text-[7px]">CAISSE CENTRALE</span>
                <span>{new Date(receipt.date || Date.now()).getFullYear()}</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 italic">
                Enregistré au Grand Livre
              </p>
            </div>

            {/* Colonne 3 : Signatures Officielles */}
            <div className="text-right space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Pour le Ministère Esprit & Vie
                </p>
                <p className="text-xs font-black text-slate-900">
                  La Caisse Centrale
                </p>
              </div>
              <div className="h-10 border-b border-slate-400 flex items-end justify-end pr-2">
                <span className="text-[11px] font-serif italic text-slate-600 font-bold">
                  P. Le Trésorier
                </span>
              </div>
            </div>
          </div>

          {/* Mention Biblique & Fiscale de Pied de Page */}
          <div className="pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 italic space-y-0.5">
            <p>
              « Chacun donnera ce qu'il pourra, selon les bénédictions que l'Éternel, ton Dieu, lui aura accordées. » — Deutéronome 16:17
            </p>
            <p className="text-[9px] text-slate-400 not-italic">
              Document officiel tenant lieu de reçu de libéralité ecclésiastique certifiée.
            </p>
          </div>

          {/* Pied de Page Officiel Standardisé */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-500 font-medium">
            <span>Ministère Esprit & Vie — Caisse Centrale & Trésorerie</span>
            <span>Quittance Officielle Certifiée • Format A4 Paysage • Page 1/1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

