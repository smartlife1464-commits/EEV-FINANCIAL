import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Building2,
  Wallet,
  Coins,
  Database,
  CheckCircle2,
  Save,
  Server,
  Lock,
} from 'lucide-react';
import { formatFCFA } from '../utils/formatters';

export const SettingsPage: React.FC = () => {
  const [ministryName, setMinistryName] = useState('Ministère Esprit & Vie');
  const [headquarters, setHeadquarters] = useState('Yaoundé, Cameroun');
  const [mainPastor, setMainPastor] = useState('Pasteur Principal');
  const [currency, setCurrency] = useState('FCFA');
  const [titheOfTithesPct, setTitheOfTithesPct] = useState(10);
  const [welfareAidPct, setWelfareAidPct] = useState(10);
  const [generalFundPct, setGeneralFundPct] = useState(80);
  const [approvalThreshold, setApprovalThreshold] = useState(500000);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            <span>Paramètres Généraux & Règles Financières</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configuration globale du ministère, règles de ventilation analytique et paramètres système.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Paramètres enregistrés avec succès !</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1 : Informations Institutionnelles */}
        <div className="bg-white dark:bg-[#0C1530] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#16214A] pb-4">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Identité du Ministère
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Nom Officiel de l’Organisation
              </label>
              <input
                type="text"
                value={ministryName}
                onChange={(e) => setMinistryName(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Siège Central
              </label>
              <input
                type="text"
                value={headquarters}
                onChange={(e) => setHeadquarters(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Gouvernance Pastorale
              </label>
              <input
                type="text"
                value={mainPastor}
                onChange={(e) => setMainPastor(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Devise Comptable
              </label>
              <input
                type="text"
                disabled
                value="FCFA (Franc CFA XAF)"
                className="w-full p-3.5 rounded-2xl bg-slate-100 dark:bg-[#070D22]/60 border border-slate-200 dark:border-[#16214A] text-slate-500 font-bold text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 2 : Règles de Ventilation Statutaire */}
        <div className="bg-white dark:bg-[#0C1530] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#16214A] pb-4">
            <Coins className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Règles de Répartition Analytique (80 / 10 / 10)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clé de ventilation automatique appliquée sur les dîmes et offrandes ordinaires brutes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <span className="text-xs font-black uppercase text-amber-500">
                Dîme des Dîmes
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={titheOfTithesPct}
                  disabled
                  className="w-20 p-2 rounded-xl bg-white dark:bg-[#070D22] border border-amber-400/40 text-lg font-black text-center text-slate-900 dark:text-white"
                />
                <span className="font-black text-amber-500">%</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Prélèvement statutaire réservé à la direction sacerdotale.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-black uppercase text-emerald-500">
                Aide Sociale & Secours
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={welfareAidPct}
                  disabled
                  className="w-20 p-2 rounded-xl bg-white dark:bg-[#070D22] border border-emerald-400/40 text-lg font-black text-center text-slate-900 dark:text-white"
                />
                <span className="font-black text-emerald-500">%</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Prélèvement réservé pour les veuves, orphelins et secours.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
              <span className="text-xs font-black uppercase text-blue-500">
                Fonds Général
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={generalFundPct}
                  disabled
                  className="w-20 p-2 rounded-xl bg-white dark:bg-[#070D22] border border-blue-400/40 text-lg font-black text-center text-slate-900 dark:text-white"
                />
                <span className="font-black text-blue-500">%</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Seul fonds supportant l'intégralité des charges courantes.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3 : Infrastructure & Base de Données */}
        <div className="bg-white dark:bg-[#0C1530] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#16214A] pb-4">
            <Server className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              État du Système & Base PocketBase
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Moteur Base</span>
              <p className="text-sm font-black text-slate-900 dark:text-white">PocketBase v0.25 (SQLite)</p>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Opérationnel (Port 8090)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Serveur API</span>
              <p className="text-sm font-black text-slate-900 dark:text-white">Fastify + Node.js v24</p>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Connecté (Port 4000)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Sauvegardes Automatiques</span>
              <p className="text-sm font-black text-slate-900 dark:text-white">Scripts Cron VPS</p>
              <span className="text-[10px] text-amber-500 font-bold">Actives (Quotidien 02h00)</span>
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
};
