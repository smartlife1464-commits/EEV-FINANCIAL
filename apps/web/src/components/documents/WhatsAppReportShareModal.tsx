import React, { useState } from 'react';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@eev/shared-types';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';

export interface WhatsAppServiceReportData {
  serviceName: string;
  serviceDate: string;
  totalAttendance: number;
  menCount: number;
  womenCount: number;
  youthCount: number;
  childrenCount: number;
  newVisitorsCount: number;
  salvationsCount: number;
  capacityRate?: number;
  // Données financières (Strictement confidentielles)
  totalRevenues?: number;
  tithesAmount?: number;
  offeringsAmount?: number;
  specialOfferingsAmount?: number;
  responsibleName?: string;
}

interface WhatsAppReportShareModalProps {
  data: WhatsAppServiceReportData | null;
  onClose: () => void;
}

export const WhatsAppReportShareModal: React.FC<WhatsAppReportShareModalProps> = ({
  data,
  onClose,
}) => {
  const { user } = useAuth();
  const [recipientPhone, setRecipientPhone] = useState('+237699000000'); // Numéro Pasteur ou Direction par défaut
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  // Ségrégation stricte des rôles : le protocole n'a JAMAIS de données financières dans son message
  const canIncludeFinance =
    ![UserRole.PROTOCOL_LEAD, UserRole.PROTOCOL_AGENT].includes(user?.role as UserRole) &&
    data.totalRevenues !== undefined;

  const menPct = data.totalAttendance ? Math.round((data.menCount / data.totalAttendance) * 100) : 0;
  const womenPct = data.totalAttendance ? Math.round((data.womenCount / data.totalAttendance) * 100) : 0;
  const youthPct = data.totalAttendance ? Math.round((data.youthCount / data.totalAttendance) * 100) : 0;
  const childrenPct = data.totalAttendance ? Math.round((data.childrenCount / data.totalAttendance) * 100) : 0;

  // Construction du message WhatsApp au format markdown officiel
  let message = `🏛️ *MINISTÈRE ESPRIT & VIE*\n`;
  message += `📋 *BILAN OFFICIEL DU CULTE*\n\n`;
  message += `📅 *Date* : ${formatDate(data.serviceDate)}\n`;
  message += `🕊️ *Programme* : *${data.serviceName}*\n\n`;

  message += `👥 *FRÉQUENTATION & MOBILISATION*\n`;
  message += `• *Total Participants* : *${data.totalAttendance} fidèles*\n`;
  message += `  - Hommes : ${data.menCount} (${menPct}%)\n`;
  message += `  - Femmes : ${data.womenCount} (${womenPct}%)\n`;
  message += `  - Jeunes : ${data.youthCount} (${youthPct}%)\n`;
  message += `  - Enfants : ${data.childrenCount} (${childrenPct}%)\n\n`;

  message += `🌱 *NOUVELLES ÂMES & VISITEURS*\n`;
  message += `• Nouveaux Visiteurs accueillis : *${data.newVisitorsCount}* ✨\n`;
  message += `• Décisions pour Christ : *${data.salvationsCount}* ✝️\n`;

  if (data.capacityRate) {
    message += `🏛️ Taux de Remplissage Sanctuaire : *${data.capacityRate}%*\n`;
  }

  if (canIncludeFinance) {
    message += `\n💰 *RÉCAPITULATIF FINANCIER (CONFIDENTIEL)*\n`;
    message += `• *Total Encaissé* : *${formatFCFA(data.totalRevenues || 0)}*\n`;
    if (data.tithesAmount !== undefined) {
      message += `  - Dîmes : ${formatFCFA(data.tithesAmount)}\n`;
    }
    if (data.offeringsAmount !== undefined) {
      message += `  - Offrandes Ordinaires : ${formatFCFA(data.offeringsAmount)}\n`;
    }
    if (data.specialOfferingsAmount !== undefined) {
      message += `  - Offrandes Spéciales / Dons : ${formatFCFA(data.specialOfferingsAmount)}\n`;
    }
  }

  message += `\n✍️ _Rapport certifié et archivé sur la Plateforme Esprit & Vie_\n`;
  message += `_Émis par : ${data.responsibleName || user?.name || 'Direction du Ministère'}_`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      alert('Impossible de copier automatiquement dans le presse-papiers.');
    }
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête Modal */}
        <div className="p-5 border-b border-slate-100 dark:border-[#16214A] flex items-center justify-between bg-slate-50 dark:bg-[#091338]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-sm text-slate-900 dark:text-white">
                Partage WhatsApp du Bilan de Culte
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Synthèse officielle prête pour le Pasteur Principal et le Comité
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps avec Prévisualisation */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Avertissement de sécurité sur les données financières */}
          {!canIncludeFinance && (
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-center gap-2.5 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 text-blue-500" />
              <span>
                Ségrégation des fonctions : ce rapport contient <strong>uniquement les données de fréquentation et d'accueil</strong>.
              </span>
            </div>
          )}

          {/* Configuration du Destinataire */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-500" />
              <span>Numéro WhatsApp du destinataire (Optionnel) :</span>
            </label>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Ex: +237 699 00 00 00 (Pasteur Principal)"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#060D24] border border-slate-200 dark:border-[#16214A] rounded-2xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Aperçu du Message WhatsApp (Style Bulle WhatsApp) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Aperçu du message textuel :
            </label>
            <div className="p-4.5 rounded-2xl bg-[#ECE5DD] dark:bg-[#0B141B] border border-slate-300 dark:border-[#1F2C34] text-slate-900 dark:text-slate-100 font-sans text-xs leading-relaxed whitespace-pre-wrap font-mono shadow-inner max-h-72 overflow-y-auto">
              {message}
            </div>
          </div>
        </div>

        {/* Boutons d'Action */}
        <div className="p-5 border-t border-slate-100 dark:border-[#16214A] flex items-center justify-between gap-3 bg-slate-50 dark:bg-[#091338]">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                : 'bg-white dark:bg-[#0C1530] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#16214A] hover:border-amber-400/50'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copié dans le presse-papiers !' : 'Copier le message'}</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-slate-950 font-black text-xs shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Envoyer sur WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};

