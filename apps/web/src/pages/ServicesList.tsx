import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatFCFA } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import {
  CalendarDays,
  Plus,
  Clock,
  Users,
  ArrowRight,
  X,
  CheckCircle2,
  Calendar,
  Wallet,
  ArrowDownCircle,
  Search,
  Filter,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const ServicesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices(),
  });

  const { data: attendanceSheets = [] } = useQuery({
    queryKey: ['attendance-sheets'],
    queryFn: () => api.getAttendance(),
  });

  const { hasPermission } = useAuth();
  const canSeeFinance = hasPermission('canViewDashboardFinance');
  const canCreateService = hasPermission('canCreateService');

  const { data: financialEntries = [] } = useQuery({
    queryKey: ['financial-entries'],
    queryFn: () => api.getEntries(),
    enabled: canSeeFinance, // le Protocole n'a aucun accès aux données financières
  });

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => api.getServiceTypes(),
  });

  /** Regroupe les 7 programmes officiels par jour pour les filtres et les badges */
  const dayGroup = (slug: string = '') =>
    slug.startsWith('sunday') ? 'sunday' : slug.startsWith('tuesday') ? 'tuesday' : slug.startsWith('thursday') ? 'thursday' : 'special';
  const typeName = (slug: string) => serviceTypes.find((t: any) => t.slug === slug)?.name;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState('sunday_service_1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createService({
        name,
        serviceType,
        date,
        startTime,
        endTime,
        description,
      });
      toast.success('Culte programmé');
      setShowCreateModal(false);
      setName('');
      setDescription('');
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = services.filter((s: any) => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || dayGroup(s.service_type) === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-amber-500" />
            <span>Cultes & Programmes du Ministère</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calendrier officiel des rassemblements (Culte dominical, Mardi, Jeudi, Événements d'onction).
          </p>
        </div>

        {canCreateService && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Programmer un Culte</span>
        </button>
        )}
      </div>

      {/* Barre de Recherche et Filtres par Type */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par intitulé du rassemblement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Tous les cultes' },
            { id: 'sunday', label: 'Dimanche' },
            { id: 'tuesday', label: 'Mardi' },
            { id: 'thursday', label: 'Jeudi' },
            { id: 'special', label: 'Spéciaux' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTypeFilter(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                typeFilter === item.id
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-100 dark:bg-[#16214A] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des Cartes des Cultes & Programmes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A]">
            Aucun culte ne correspond à votre filtre.
          </div>
        ) : (
          filteredServices.map((service: any) => {
            const group = dayGroup(service.service_type);
            const isSunday = group === 'sunday';

            // Fiche de présence associée (lien direct, sinon même programme à la même date)
            const sheet = attendanceSheets.find(
              (s: any) =>
                s.service === service.id ||
                s.service?.id === service.id ||
                (s.service_type_slug === service.service_type && s.service_date === String(service.date || '').slice(0, 10))
            );

            // Recettes associées
            const entries = financialEntries.filter(
              (e: any) => e.service === service.id || e.service_id === service.id || e.service?.id === service.id
            );
            const totalCollected = entries.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

            return (
              <div
                key={service.id}
                className="bg-white dark:bg-[#0C1530] rounded-3xl p-6 border border-slate-200 dark:border-[#16214A] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isSunday
                          ? 'bg-amber-400/20 text-amber-500 border border-amber-400/30'
                          : group === 'tuesday'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                          : group === 'thursday'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      }`}
                    >
                      {typeName(service.service_type) ||
                        (isSunday ? 'Culte Dominical' : group === 'tuesday' ? 'Mardi Enseignement' : group === 'thursday' ? 'Jeudi Intercession' : 'Réunion Spéciale')}
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {service.start_time || '09:00'} - {service.end_time || '12:00'}
                      </span>
                    </span>
                  </div>

                  <h2 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                    {service.name}
                  </h2>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      Date : <strong className="text-slate-800 dark:text-slate-200">{formatDate(service.date)}</strong>
                    </span>
                  </div>

                  {/* Résumé Présences & Finances */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200/80 dark:border-[#16214A] space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>Fréquentation</span>
                      </div>
                      {sheet ? (
                        <div>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {sheet.total_attendance} fidèles
                          </span>
                          <span className="block text-[10px] text-blue-500 font-bold">
                            +{sheet.new_visitors_count} visiteurs
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-amber-500 block pt-1">
                          En attente
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200/80 dark:border-[#16214A] space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase">
                        <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Recettes</span>
                      </div>
                      <div>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {formatFCFA(totalCollected)}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-bold">
                          {entries.length} reçu(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions de Saisie & Suivi */}
                <div className="pt-4 border-t border-slate-100 dark:border-[#16214A] flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to={sheet ? '/attendance' : `/attendance/new?slug=${encodeURIComponent(service.service_type || '')}&date=${String(service.date || '').slice(0, 10)}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-[#16214A] hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{sheet ? 'Fiche Saisie' : 'Saisir Fiche'}</span>
                  </Link>

                  <Link
                    to={`/finance/entries/new?serviceId=${service.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    <span>Encaisser</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Programmation d'un Culte */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-lg w-full p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-100 dark:bg-[#16214A] text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-500 flex items-center justify-center shrink-0">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Programmer un Nouveau Culte
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Création d'un service auquel seront rattachées les présences et les offrandes.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Intitulé du Rassemblement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Culte de Célébration & Sainte Cène"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Type de Rassemblement *
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {serviceTypes.map((t: any) => (
                    <option key={t.id} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-3 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Heure Début
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Heure Fin
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Description / Thème du Culte
                </label>
                <input
                  type="text"
                  placeholder="Ex: Célébration avec le Pasteur Principal • Thème: La Puissance de la Grâce"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#16214A]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Création...' : 'Créer le Culte'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
