import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { calculateAttendanceTotal } from '@eev/business-rules';
import { Users, UserPlus, HeartHandshake, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
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
      <div className="flex items-center gap-4">
        <Link
          to="/attendance"
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Fiche de Fréquentation du Culte
          </h1>
          <p className="text-xs text-slate-500">
            Saisie certifiée par le département Protocole.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Choix du service */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Culte / Programme concerné *
          </label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Sélectionner un service...</option>
            {services.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.date} • {s.start_time || '09:00'})
              </option>
            ))}
          </select>
        </div>

        {/* Comptage des participants exclusifs */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>Catégories Exclusives de Présence</span>
            </h2>
            <p className="text-xs text-slate-500">
              Chaque personne dans la salle appartient à une et une seule de ces 4 catégories.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                👨 Hommes
              </label>
              <input
                type="number"
                min="0"
                value={menCount}
                onChange={(e) => setMenCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-extrabold p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                👩 Femmes
              </label>
              <input
                type="number"
                min="0"
                value={womenCount}
                onChange={(e) => setWomenCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-extrabold p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                🧑 Jeunes
              </label>
              <input
                type="number"
                min="0"
                value={youthCount}
                onChange={(e) => setYouthCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-extrabold p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                👶 Enfants
              </label>
              <input
                type="number"
                min="0"
                value={childrenCount}
                onChange={(e) => setChildrenCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-extrabold p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Bannière Total Certifié */}
          <div className="p-5 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-between shadow-lg shadow-amber-400/20">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest opacity-80">
                Total Participants Calculé Automatiquement
              </span>
              <p className="text-xs opacity-90 mt-0.5">
                (Hommes {menCount} + Femmes {womenCount} + Jeunes {youthCount} + Enfants {childrenCount})
              </p>
            </div>
            <div className="text-4xl font-extrabold tracking-tight">
              {stats.totalAttendance}
            </div>
          </div>
        </div>

        {/* Indicateurs complémentaires */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              <span>Indicateurs Complémentaires Analytiques</span>
            </h2>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              ⚠️ Attention : Les nouveaux visiteurs constituent un indicateur complémentaire et NE SONT JAMAIS ajoutés au total.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
              <label className="block text-xs font-bold text-blue-900 dark:text-blue-300">
                ⭐ Nouveaux Visiteurs (Premier Culte)
              </label>
              <input
                type="number"
                min="0"
                value={newVisitorsCount}
                onChange={(e) => setNewVisitorsCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-extrabold p-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                Comptabilisés à des fins de suivi et d’intégration pastorale.
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300">
                ✝️ Décisions pour Christ (Âmes Sauvées)
              </label>
              <input
                type="number"
                min="0"
                value={salvationsCount}
                onChange={(e) => setSalvationsCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-2xl font-extrabold p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Nombre d’engagements pris lors de l’appel du culte.
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Observations ou Notes du Protocole
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Forte affluence lors de la première partie, disposition de 50 chaises supplémentaires..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="flex justify-end gap-4">
          <Link
            to="/attendance"
            className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-900 bg-slate-100 dark:bg-slate-800"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-400/20 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{submitting ? 'Enregistrement...' : 'Valider la Fiche de Présence'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
