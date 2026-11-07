import React, { useState } from 'react';
import { Calendar, ChevronDown, Check, ArrowRight, RotateCcw } from 'lucide-react';

export interface PeriodOption {
  id: string;
  label: string;
  category: 'days' | 'weeks' | 'months' | 'quarters' | 'semesters' | 'years' | 'rolling' | 'custom';
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  // Jours
  { id: 'today', label: "Aujourd'hui", category: 'days' },
  { id: 'yesterday', label: 'Hier', category: 'days' },
  // Semaines
  { id: 'this_week', label: 'Cette semaine', category: 'weeks' },
  { id: 'last_week', label: 'Semaine précédente', category: 'weeks' },
  // Mois
  { id: 'this_month', label: 'Ce mois-ci', category: 'months' },
  { id: 'last_month', label: 'Mois précédent', category: 'months' },
  // Trimestres
  { id: 'this_quarter', label: 'Ce trimestre', category: 'quarters' },
  { id: 'last_quarter', label: 'Trimestre précédent', category: 'quarters' },
  // Semestres
  { id: 'this_semester', label: 'Ce semestre', category: 'semesters' },
  { id: 'last_semester', label: 'Semestre précédent', category: 'semesters' },
  // Années
  { id: 'this_year', label: 'Cette année', category: 'years' },
  { id: 'last_year', label: 'Année précédente', category: 'years' },
  // Glissants
  { id: 'last_7_days', label: '7 derniers jours', category: 'rolling' },
  { id: 'last_30_days', label: '30 derniers jours', category: 'rolling' },
  { id: 'last_90_days', label: '90 derniers jours', category: 'rolling' },
  { id: 'last_12_months', label: '12 derniers mois', category: 'rolling' },
  // Personnalisé
  { id: 'custom', label: 'Période personnalisée...', category: 'custom' },
];

interface PeriodSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string, startDate?: string, endDate?: string) => void;
  activeRangeLabel?: string;
  previousRangeLabel?: string;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  activeRangeLabel,
  previousRangeLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  const currentOption = PERIOD_OPTIONS.find((p) => p.id === selectedPeriod) || PERIOD_OPTIONS[4];

  const handleSelect = (optionId: string) => {
    if (optionId === 'custom') {
      setShowCustomModal(true);
      setIsOpen(false);
      return;
    }
    onPeriodChange(optionId);
    setIsOpen(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onPeriodChange('custom', customStart, customEnd);
    setShowCustomModal(false);
  };

  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {/* Bouton déroulant principal */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] hover:border-amber-400/50 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>{currentOption.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Menu Dropdown structuré par catégories */}
          {isOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 max-h-96 overflow-y-auto bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl p-2 shadow-2xl z-50 divide-y divide-slate-100 dark:divide-[#16214A]">
              <div className="p-2">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2 block mb-1">
                  Périodes Usuelles
                </span>
                {PERIOD_OPTIONS.filter((p) => ['days', 'weeks', 'months'].includes(p.category)).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedPeriod === p.id
                        ? 'bg-amber-400/15 text-amber-500 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#101C3D]'
                    }`}
                  >
                    <span>{p.label}</span>
                    {selectedPeriod === p.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                ))}
              </div>

              <div className="p-2">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2 block mb-1">
                  Trimestres & Années
                </span>
                {PERIOD_OPTIONS.filter((p) => ['quarters', 'semesters', 'years'].includes(p.category)).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedPeriod === p.id
                        ? 'bg-amber-400/15 text-amber-500 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#101C3D]'
                    }`}
                  >
                    <span>{p.label}</span>
                    {selectedPeriod === p.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                ))}
              </div>

              <div className="p-2">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2 block mb-1">
                  Périodes Glissantes & Personnalisée
                </span>
                {PERIOD_OPTIONS.filter((p) => ['rolling', 'custom'].includes(p.category)).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedPeriod === p.id
                        ? 'bg-amber-400/15 text-amber-500 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#101C3D]'
                    }`}
                  >
                    <span>{p.label}</span>
                    {selectedPeriod === p.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Badge d'intervalle temporel certifié */}
        {activeRangeLabel && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-[11px] text-amber-500 font-bold">
            <span>{activeRangeLabel}</span>
            {previousRangeLabel && (
              <span className="text-slate-400 font-normal">
                (vs {previousRangeLabel})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Modal Période Personnalisée */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <span>Sélectionner une Plage de Dates</span>
            </h3>

            <form onSubmit={handleApplyCustom} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase text-slate-400">Date Début</label>
                <input
                  type="date"
                  required
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase text-slate-400">Date Fin</label>
                <input
                  type="date"
                  required
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-400/20"
                >
                  Appliquer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

