import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { numberToWordsFCFA } from '../../utils/numberToWords';
import { exportElementToPdf } from '../../utils/exportToPdf';
import { X, Printer, ShieldCheck, FileCheck, Paperclip, Download } from 'lucide-react';

export interface PaymentVoucherData {
  id: string;
  voucherNumber?: string;
  title: string;
  beneficiary: string;
  beneficiaryPhone?: string;
  beneficiaryIdCard?: string;
  amount: number;
  date: string;
  fundName: string;
  categoryName: string;
  paymentMethod: string;
  reference?: string;
  description?: string;
  requestedBy?: string;
  approvedBy?: string;
  paidBy?: string;
}

interface PaymentVoucherModalProps {
  voucher: PaymentVoucherData | null;
  onClose: () => void;
}

export const PaymentVoucherModal: React.FC<PaymentVoucherModalProps> = ({ voucher, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!voucher) return null;

  const voucherRef =
    voucher.voucherNumber ||
    `BD-${new Date(voucher.date || Date.now()).getFullYear()}-${(voucher.id || '001')
      .slice(-6)
      .toUpperCase()}`;

  const amountInWords = numberToWordsFCFA(voucher.amount);

  const qrVerificationData = JSON.stringify({
    type: 'payment_voucher',
    voucherRef,
    amount: voucher.amount,
    currency: 'XAF',
    date: voucher.date,
    beneficiary: voucher.beneficiary,
    fund: voucher.fundName,
    ministry: 'Esprit & Vie',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await exportElementToPdf('printable-voucher', {
        filename: `Bon_Decaissement_${voucherRef}.pdf`,
        orientation: 'landscape',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:p-0 print:m-0 print:bg-white print:static select-none">
      <div className="printable-modal-box bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
        {/* Header de contrôle (Masqué à l'impression / PDF) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#16214A] flex items-center justify-between bg-slate-50/70 dark:bg-[#091338]/80 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm text-slate-900 dark:text-white">
                Bon de Décaissement Comptable (Payment Voucher)
              </p>
              <p className="text-[11px] font-mono text-amber-500 font-bold">
                N° {voucherRef} • Format A4 Paysage
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

        {/* Corps Officiel A4 du Bon de Décaissement Standardisé */}
        <div
          id="printable-voucher"
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
                  Direction Financière & Caisse Centrale
                </p>
                <p className="text-[11px] text-slate-600">
                  Siège Central • Yaoundé, Cameroun • BP 1420
                </p>
                <p className="text-[11px] text-slate-500">
                  Tél : +237 699 00 00 00 • contact@espritvie.org
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300">
                BON DE DÉCAISSEMENT
              </span>
              <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                N° {voucherRef}
              </p>
              <p className="text-[11px] text-slate-500">
                Date : {formatDate(voucher.date)}
              </p>
            </div>
          </div>

          {/* Imputation Budgétaire & Fonds Débité */}
          <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Bénéficiaire / Fournisseur :
              </p>
              <p className="font-black text-sm text-slate-900 mt-0.5">
                {voucher.beneficiary}
              </p>
              {voucher.beneficiaryPhone && (
                <p className="text-[11px] text-slate-600">
                  Tél: {voucher.beneficiaryPhone}
                </p>
              )}
            </div>

            <div>
              <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Fonds Analytique Débité :
              </p>
              <p className="font-black text-sm text-amber-700 mt-0.5">
                {voucher.fundName || 'Fonds Général'}
              </p>
              <p className="text-[11px] text-slate-600">
                Catégorie : {voucher.categoryName || 'Dépense courante'}
              </p>
            </div>

            <div>
              <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Mode de Règlement :
              </p>
              <p className="font-black text-xs text-slate-900 uppercase mt-0.5">
                {voucher.paymentMethod || 'Espèces'}
              </p>
              {voucher.reference && (
                <p className="text-[11px] font-mono text-slate-600">
                  Réf: {voucher.reference}
                </p>
              )}
            </div>
          </div>

          {/* Motif & Description */}
          <div className="p-4 rounded-2xl border border-slate-200 space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-500">
              Objet & Justification de la Dépense :
            </p>
            <p className="text-sm font-bold text-slate-900">
              {voucher.title}
            </p>
            {voucher.description && (
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                {voucher.description}
              </p>
            )}
          </div>

          {/* Bloc Montant en Chiffres et Lettres */}
          <div className="border-2 border-slate-900 rounded-2xl p-4.5 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                Montant net décaissé :
              </p>
              <p className="text-3xl font-black text-slate-950">
                {formatFCFA(voucher.amount)}
              </p>
              <p className="text-xs text-slate-700 italic font-semibold mt-1">
                Arrêté à la somme de : <span className="underline">{amountInWords}</span>
              </p>
            </div>

            <div className="hidden sm:block">
              <QRCodeSVG value={qrVerificationData} size={70} level="M" />
            </div>
          </div>

          {/* Zone d'Agrafage des Pièces Justificatives Originales */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50/50 print:p-8">
            <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
              <Paperclip className="w-4 h-4 text-amber-500" />
              <span>Zone réservée à l'agrafage des pièces justificatives originales</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 italic">
              (Facture acquittée, bon de livraison, devis signé ou reçu de décharge)
            </p>
          </div>

          {/* Quadruple Bloc de Signatures & Émargement */}
          <div className="grid grid-cols-4 gap-3 pt-4 border-t-2 border-slate-900 text-xs">
            {/* 1. Demandeur */}
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between h-28 bg-white">
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500">
                  1. Établi / Demandé
                </p>
                <p className="font-bold text-[11px] text-slate-900 truncate">
                  {voucher.requestedBy || 'Responsable'}
                </p>
              </div>
              <p className="text-[9px] text-slate-400 italic">Signature & Date</p>
            </div>

            {/* 2. Contrôle Financier */}
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between h-28 bg-white">
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500">
                  2. Contrôlé & Imputé
                </p>
                <p className="font-bold text-[11px] text-slate-900 truncate">
                  Direction Finances
                </p>
              </div>
              <p className="text-[9px] text-slate-400 italic">Visa & Date</p>
            </div>

            {/* 3. Approbation Souveraine */}
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between h-28 bg-white">
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500">
                  3. Bon à payer
                </p>
                <p className="font-bold text-[11px] text-slate-900 truncate">
                  {voucher.approvedBy || 'Pasteur / Admin'}
                </p>
              </div>
              <p className="text-[9px] text-slate-400 italic">Approbation & Date</p>
            </div>

            {/* 4. Acquit du Bénéficiaire */}
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between h-28 bg-white">
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500">
                  4. Reçu pour acquit
                </p>
                <p className="font-bold text-[11px] text-slate-900 truncate">
                  {voucher.beneficiary}
                </p>
              </div>
              <p className="text-[9px] text-slate-400 italic">Signature Bénéficiaire</p>
            </div>
          </div>

          {/* Pied de Page Officiel Standardisé */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-500 font-medium">
            <span>Ministère Esprit & Vie — Département des Finances & Contrôle Interne</span>
            <span>Bon de Décaissement Officiel • Format A4 Paysage • Page 1/1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

