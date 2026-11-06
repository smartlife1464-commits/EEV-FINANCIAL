import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { calculateAttendanceTotal } from '@eev/business-rules';
import {
  Users,
  UserPlus,
  HeartHandshake,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AttendanceForm: React.FC = () => {
  const navigate = useNavigate();

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices(),
  });

  const [serviceId, setServiceId] = useState('');
  const [menCount, setMenCount] = useState(0);
  const [womenCount, setWomenCount] = useState(0);
  const [youthCount, setYouthCount] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [newVisitorsCount, setNewVisitorsCount] = useState(0);
  const [salvationsCount, setSalvationsCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Calcul certifié en temps réel par le package de règles
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) {
      alert('Veuillez sélectionner le culte concerné.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createAttendance({
        serviceId,
        menCount,
        womenCount,
        youthCount,
        childrenCount,
        newVisitorsCount,
        salvationsCount,
        notes,
      });
      navigate('/attendance');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement de la fiche.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex items-center gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <Link
          to="/attendance"
          className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            <span>Fiche de Fréquentation du Culte</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Saisie certifiée par le département Protocole selon les 4 catégories exclusives + nouveaux visiteurs.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Choix du service */}
        <div className="bg-white dark:bg-[#0C1530] p-6 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Culte / Programme Concerné *
          </label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
            className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Sélectionner un service...</option>
            {services.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.date} • {s.start_time || '09:00'})
              </option>
            ))}
          </select>
        </div>

        {/* 4 Catégories Exclusives */}
        <div className="bg-white dark:bg-[#0C1530] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#16214A] pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Catégories Exclusives de Fréquentation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chaque participant physique ne peut appartenir qu’à une seule catégorie.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-500 border border-amber-400/30">
              Total : {total} Participants
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Hommes */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-500">
                Hommes
              </label>
              <input
                type="number"
                min="0"
                value={menCount}
                onChange={(e) => setMenCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-black p-2 bg-transparent border-b-2 border-blue-500 text-slate-900 dark:text-white outline-none"
              />
              <span className="text-[11px] text-slate-400 font-semibold block">{menPercent}% du total</span>
            </div>

            {/* Femmes */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
              <label className="block text-xs font-bold uppercase tracking-wider text-pink-500">
                Femmes
              </label>
              <input
                type="number"
                min="0"
                value={womenCount}
                onChange={(e) => setWomenCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-black p-2 bg-transparent border-b-2 border-pink-500 text-slate-900 dark:text-white outline-none"
              />
              <span className="text-[11px] text-slate-400 font-semibold block">{womenPercent}% du total</span>
            </div>

            {/* Jeunes */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-500">
                Jeunes
              </label>
              <input
                type="number"
                min="0"
                value={youthCount}
                onChange={(e) => setYouthCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-black p-2 bg-transparent border-b-2 border-amber-500 text-slate-900 dark:text-white outline-none"
              />
              <span className="text-[11px] text-slate-400 font-semibold block">{youthPercent}% du total</span>
            </div>

            {/* Enfants */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-500">
                Enfants
              </label>
              <input
                type="number"
                min="0"
                value={childrenCount}
                onChange={(e) => setChildrenCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-black p-2 bg-transparent border-b-2 border-emerald-500 text-slate-900 dark:text-white outline-none"
              />
              <span className="text-[11px] text-slate-400 font-semibold block">{childrenPercent}% du total</span>
            </div>
          </div>
        </div>

        {/* Indicateurs Complémentaires (Strictement Séparés) */}
        <div className="bg-white dark:bg-[#0C1530] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-[#16214A] pb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Indicateurs Complémentaires de Suivi Pastoral
            </h2>
            <p className="text-xs text-amber-500 font-bold mt-0.5">
              RÈGLE D’OR : Les nouveaux visiteurs constituent un indicateur séparé et ne sont JAMAIS ajoutés au total des participants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Nouveaux Visiteurs (1ère Fois)
                </label>
              </div>
              <input
                type="number"
                min="0"
                value={newVisitorsCount}
                onChange={(e) => setNewVisitorsCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-3xl font-black p-2 bg-transparent border-b-2 border-amber-400 text-slate-900 dark:text-white outline-none"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Fiches d'accueil à transmettre à la cellule d'intégration pastorale.
              </span>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-500" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Décisions pour Christ (Âmes Gagnées)
                </label>
              </div>
              <input
                type="number"
                min="0"
                value={salvationsCount}
                onChange={(e) => setSalvationsCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-3xl font-black p-2 bg-transparent border-b-2 border-emerald-500 text-slate-900 dark:text-white outline-none"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Pour orientation vers la classe de baptême et discipulat.
              </span>
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Observations & Remarques du Protocole
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Bonne fluidité à l'accueil, 4 bus de ramassage arrivés à l'heure, affluence importante au 2ème service..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4">
          <Link
            to="/attendance"
            className="px-6 py-3 rounded-2xl font-bold text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-[#16214A] transition-all"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-400/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Validation...' : 'Valider & Transmettre la Fiche'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
