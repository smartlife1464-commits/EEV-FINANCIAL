import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { CalendarDays, Plus, Clock, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ServicesList: React.FC = () => {
  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices(),
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState('sunday_service');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createService({
        name,
        serviceType,
        date,
        startTime,
        endTime,
      });
      setShowCreateModal(false);
      setName('');
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-amber-500" />
            <span>Cultes & Programmes du Ministère</span>
          </h1>
          <p className="text-xs text-slate-500">
            Gestion du calendrier des rassemblements (Dimanche, Mardi, Jeudi, Événements spéciaux).
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Programmer un Culte</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service: any) => (
          <div
            key={service.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={service.service_type === 'sunday_service' ? 'gold' : 'info'}>
                  {service.service_type === 'sunday_service' ? 'Culte Dominical' : 'Semaine'}
                </Badge>
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {service.start_time || '09:00'} - {service.end_time || '12:00'}
                  </span>
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{service.name}</h2>
              <p className="text-xs text-slate-500">
                Date : <strong className="text-slate-700 dark:text-slate-300">{formatDate(service.date)}</strong>
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Link
                to="/attendance/new"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>Saisir présences</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Création Culte */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Programmer un Nouveau Culte
            </h2>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Nom du Culte *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Culte de Célébration et Sainte Cène"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Type de Service *</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="sunday_service">Culte du Dimanche</option>
                  <option value="tuesday_program">Programme du Mardi</option>
                  <option value="thursday_program">Programme du Jeudi</option>
                  <option value="special_meeting">Réunion Spéciale</option>
                  <option value="evangelism_campaign">Campagne d’Évangélisation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Début *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md"
                >
                  Créer le Culte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
