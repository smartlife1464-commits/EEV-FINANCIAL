import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { calculateAttendanceTotal, checkAttendanceDuplicate } from '@eev/business-rules';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  HeartHandshake,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Calendar,
  Clock,
  Flame,
  Tent,
  BookOpen,
  Award,
  AlertTriangle,
  Save,
  Check,
} from 'lucide-react';

export const AttendanceForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. Récupération des 7 types officiels de services
  const { data: serviceTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => api.getServiceTypes(),
  });

  // 2. Récupération des fiches existantes pour vérification des doublons
  const { data: existingSheets = [] } = useQuery({
    queryKey: ['attendance-sheets'],
    queryFn: () => api.getAttendance(),
  });

  // State du parcours guidé en 5 étapes
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Données du formulaire
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [serviceDate, setServiceDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [responsibleName, setResponsibleName] = useState<string>(user?.name || 'Responsable Protocole');
  const [observations, setObservations] = useState<string>('');

  // Fréquentation
  const [menCount, setMenCount] = useState<number>(0);
  const [womenCount, setWomenCount] = useState<number>(0);
  const [youthCount, setYouthCount] = useState<number>(0);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [newVisitorsCount, setNewVisitorsCount] = useState<number>(0);
  const [salvationsCount, setSalvationsCount] = useState<number>(0);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const selectedType = serviceTypes.find((st: any) => st.slug === selectedSlug);

  // Mettre à jour les horaires par défaut selon le type de culte sélectionné
  useEffect(() => {
    if (selectedSlug === 'tuesday_service' || selectedSlug === 'thursday_service') {
      setStartTime('18:00');
      setEndTime('20:30');
    } else if (selectedSlug === 'sunday_service_1') {
      setStartTime('07:30');
      setEndTime('10:00');
    } else if (selectedSlug === 'sunday_service_2') {
      setStartTime('10:30');
      setEndTime('13:00');
    }
  }, [selectedSlug]);

  // Vérification de doublon en temps réel
  useEffect(() => {
    if (selectedSlug && serviceDate) {
      const dup = checkAttendanceDuplicate(
        existingSheets.map((s: any) => ({
          serviceTypeSlug: s.service_type_slug || (s.service?.service_type as any),
          serviceDate: s.service_date || s.date,
        })),
        {
          serviceTypeSlug: selectedSlug,
          serviceDate,
        }
      );
      if (dup.isDuplicate) {
        setDuplicateWarning(dup.message || 'Attention : une fiche existe déjà pour ce programme et cette date.');
      } else {
        setDuplicateWarning(null);
      }
    }
  }, [selectedSlug, serviceDate, existingSheets]);

  // Calcul certifié par le package de règles
  const stats = calculateAttendanceTotal({
    menCount,
    womenCount,
    youthCount,
    childrenCount,
    newVisitorsCount,
    salvationsCount,
  });

  const total = stats.totalAttendance;
  const menPercent = total > 0 ? Math.round((menCount / total) * 100) : 0;
  const womenPercent = total > 0 ? Math.round((womenCount / total) * 100) : 0;
  const youthPercent = total > 0 ? Math.round((youthCount / total) * 100) : 0;
  const childrenPercent = total > 0 ? Math.round((childrenCount / total) * 100) : 0;

  // Validation par étape
  const canGoToStep2 = !!selectedSlug;
  const canGoToStep3 = canGoToStep2 && !!serviceDate;
  const canGoToStep4 = canGoToStep3 && !!startTime && !!endTime;
  const canGoToStep5 = canGoToStep4 && total > 0;

  const handleSave = async (isDraft: boolean) => {
    if (!selectedSlug || !serviceDate) {
      alert('Veuillez renseigner le programme et la date.');
      return;
    }

    if (duplicateWarning && !isDraft) {
      const confirmDup = window.confirm(
        `${duplicateWarning}\n\nSouhaitez-vous quand même enregistrer cette fiche (ex: session spéciale ou culte dédoublé) ?`
      );
      if (!confirmDup) return;
    }

    setSubmitting(true);
    try {
      await api.createStructuredAttendance({
        serviceTypeSlug: selectedSlug,
        serviceDate,
        startTime,
        endTime,
        menCount,
        womenCount,
        youthCount,
        childrenCount,
        newVisitorsCount,
        salvationsCount,
        notes: observations,
        responsibleUserId: user?.id,
        isDraft,
      });

      navigate('/attendance');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement de la fiche.');
    } finally {
      setSubmitting(false);
    }
  };

  // Icône stylisée par programme
  const getProgramIcon = (slug: string) => {
    switch (slug) {
      case 'tuesday_service':
        return <BookOpen className="w-5 h-5 text-blue-400" />;
      case 'thursday_service':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'sunday_service_1':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'sunday_service_2':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'mission_camp':
        return <Tent className="w-5 h-5 text-emerald-400" />;
      case 'shepherds_camp':
        return <Users className="w-5 h-5 text-purple-400" />;
      default:
        return <Flame className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex items-center gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <Link
          to="/attendance"
          className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-500 border border-amber-400/30">
              Protocole Officiel
            </span>
            <span className="text-xs text-slate-400">• Étape {currentStep} sur 5</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <span>Saisie d’une Fiche de Fréquentation</span>
          </h1>
        </div>
      </div>

      {/* Stepper visuel 5 étapes */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { num: 1, label: '1. Programme' },
            { num: 2, label: '2. Date' },
            { num: 3, label: '3. Détails' },
            { num: 4, label: '4. Comptage' },
            { num: 5, label: '5. Validation' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num === 1) setCurrentStep(1);
                if (s.num === 2 && canGoToStep2) setCurrentStep(2);
                if (s.num === 3 && canGoToStep3) setCurrentStep(3);
                if (s.num === 4 && canGoToStep4) setCurrentStep(4);
                if (s.num === 5 && canGoToStep5) setCurrentStep(5);
              }}
              className={`p-2.5 rounded-2xl transition-all font-bold ${
                currentStep === s.num
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-400/20'
                  : currentStep > s.num
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-[#16214A] text-slate-400 dark:text-slate-500'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Avertissement Doublon */}
      {duplicateWarning && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3 text-rose-500 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{duplicateWarning}</span>
        </div>
      )}

      {/* ==================== ÉTAPE 1 : SÉLECTION DU PROGRAMME ==================== */}
      {currentStep === 1 && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div>
            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Étape 1 sur 5</span>
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">
              Sélectionnez le Programme de Culte
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choisissez parmi les sept (7) programmes officiels reconnus par le Ministère Esprit & Vie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceTypes.map((st: any) => {
              const isSelected = selectedSlug === st.slug;
              return (
                <div
                  key={st.slug}
                  onClick={() => setSelectedSlug(st.slug)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                      : 'bg-slate-50 dark:bg-[#080E25] border-slate-200 dark:border-[#16214A] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 dark:bg-[#16214A]'
                    }`}
                  >
                    {getProgramIcon(st.slug)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">{st.name}</h3>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{st.description}</p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      Code : {st.slug}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-[#16214A]">
            <button
              type="button"
              disabled={!canGoToStep2}
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span>Continuer vers la Date</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== ÉTAPE 2 : DÉFINITION DE LA DATE DU SERVICE ==================== */}
      {currentStep === 2 && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div>
            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Étape 2 sur 5</span>
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">
              Définissez la Date du Rassemblement
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Programme sélectionné : <strong className="text-amber-500 font-bold">{selectedType?.name}</strong>. Choisissez librement la date où le rassemblement a effectivement eu lieu.
            </p>
          </div>

          <div className="max-w-md space-y-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Date effective du service *
            </label>
            <div className="relative">
              <Calendar className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              💡 Vous pouvez saisir un rassemblement d'aujourd'hui ou une fiche passée pour régularisation.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-[#16214A]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Changer de Programme</span>
            </button>
            <button
              type="button"
              disabled={!canGoToStep3}
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span>Continuer vers les Détails</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== ÉTAPE 3 : INFORMATIONS COMPLÉMENTAIRES ==================== */}
      {currentStep === 3 && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div>
            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Étape 3 sur 5</span>
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">
              Horaires & Informations Complémentaires
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Renseignez les heures d'ouverture et de clôture, le responsable et vos observations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Heure de début *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Heure de fin *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Responsable superviseur du Protocole
            </label>
            <input
              type="text"
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Observations spirituelles, logistiques ou météo
            </label>
            <textarea
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Forte pluie au démarrage, 50 chaises supplémentaires ajoutées, baptêmes prévus..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-[#16214A]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
            <button
              type="button"
              disabled={!canGoToStep4}
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span>Continuer vers le Comptage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== ÉTAPE 4 : COMPTAGE STRICT DES PARTICIPANTS ==================== */}
      {currentStep === 4 && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div>
            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Étape 4 sur 5</span>
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">
              Saisie de la Fréquentation par Catégorie
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              RÈGLE D'OR : <strong className="text-amber-500 font-bold">TOTAL = HOMMES + FEMMES + JEUNES + ENFANTS</strong>. Les nouveaux visiteurs sont saisis séparément et ne sont jamais additionnés au total.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hommes */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Hommes</span>
                <span className="text-[10px] text-slate-400 font-mono">{menPercent}%</span>
              </label>
              <input
                type="number"
                min="0"
                value={menCount}
                onChange={(e) => setMenCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-center text-2xl font-black p-3 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Femmes */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Femmes</span>
                <span className="text-[10px] text-slate-400 font-mono">{womenPercent}%</span>
              </label>
              <input
                type="number"
                min="0"
                value={womenCount}
                onChange={(e) => setWomenCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-center text-2xl font-black p-3 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Jeunes */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Jeunes</span>
                <span className="text-[10px] text-slate-400 font-mono">{youthPercent}%</span>
              </label>
              <input
                type="number"
                min="0"
                value={youthCount}
                onChange={(e) => setYouthCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-center text-2xl font-black p-3 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Enfants */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Enfants</span>
                <span className="text-[10px] text-slate-400 font-mono">{childrenPercent}%</span>
              </label>
              <input
                type="number"
                min="0"
                value={childrenCount}
                onChange={(e) => setChildrenCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-center text-2xl font-black p-3 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* TOTAL STRICT EN TEMPS RÉEL */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                Total Certifié du Culte
              </span>
              <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mt-0.5">
                {total} <span className="text-sm font-bold text-slate-400">participants</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Formule : {menCount} (H) + {womenCount} (F) + {youthCount} (J) + {childrenCount} (E) = {total}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
                ✓ Intégrité arithmétique validée
              </span>
            </div>
          </div>

          {/* INDICATEURS COMPLÉMENTAIRES (NON ADDITIONNÉS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <span>Nouveaux Visiteurs Accueillis</span>
                </label>
                <span className="text-[10px] font-bold text-blue-400 uppercase">Non additionné</span>
              </div>
              <input
                type="number"
                min="0"
                value={newVisitorsCount}
                onChange={(e) => setNewVisitorsCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-center text-xl font-black p-3 rounded-xl bg-white dark:bg-[#0C1530] border border-blue-500/30 text-blue-400 outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-[10px] text-slate-400">
                Statistique pastorale suivie pour l'intégration et le suivi des âmes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-purple-400" />
                  <span>Décisions pour Christ (Saluts)</span>
                </label>
                <span className="text-[10px] font-bold text-purple-400 uppercase">Évangélisation</span>
              </div>
              <input
                type="number"
                min="0"
                value={salvationsCount}
                onChange={(e) => setSalvationsCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-center text-xl font-black p-3 rounded-xl bg-white dark:bg-[#0C1530] border border-purple-500/30 text-purple-400 outline-none focus:ring-2 focus:ring-purple-400"
              />
              <p className="text-[10px] text-slate-400">
                Nombre de personnes ayant confessé Jésus-Christ comme Seigneur et Sauveur.
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-[#16214A]">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
            <button
              type="button"
              disabled={!canGoToStep5}
              onClick={() => setCurrentStep(5)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span>Vérifier & Valider la Fiche</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== ÉTAPE 5 : RÉCAPITULATIF & ENREGISTREMENT ==================== */}
      {currentStep === 5 && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div>
            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Étape 5 sur 5</span>
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">
              Récapitulatif & Soumission Officielle
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Vérifiez scrupuleusement les chiffres avant la transmission au Leader Principal.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-200 dark:border-[#16214A]">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Programme</span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{selectedType?.name}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Date du Culte</span>
                <p className="text-sm font-black text-amber-500 mt-0.5">{formatDate(serviceDate)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Horaires</span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {startTime} - {endTime}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Responsable</span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{responsibleName}</p>
              </div>
            </div>

            {/* Grille des chiffres */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[10px] font-bold text-slate-400">Hommes</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{menCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[10px] font-bold text-slate-400">Femmes</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{womenCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[10px] font-bold text-slate-400">Jeunes</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{youthCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[10px] font-bold text-slate-400">Enfants</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{childrenCount}</p>
              </div>
            </div>

            {/* Total général certifié */}
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                  Total Participants
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {total} personnes
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                  Nouveaux Visiteurs
                </span>
                <div className="text-xl font-black text-blue-400">
                  +{newVisitorsCount}
                </div>
              </div>
            </div>

            {observations && (
              <div className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-[#16214A]">
                <strong className="font-bold text-slate-900 dark:text-white">Observations : </strong>
                {observations}
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-[#16214A]">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Corriger les Chiffres</span>
            </button>

            <div className="w-full sm:w-auto flex items-center gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-200 dark:bg-[#16214A] hover:bg-slate-300 dark:hover:bg-[#1e2d61] text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer en Brouillon</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave(false)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/25 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'Transmission...' : 'Soumettre la Fiche'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
