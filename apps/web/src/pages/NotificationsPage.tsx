import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Users,
  Wallet,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState('all');

  const notifications = [
    {
      id: 'notif-1',
      title: "Demande de Décaissement DEP-2026-00003",
      category: 'finances',
      description: "Une dépense de 480 000 FCFA pour 'Matériel & Sonorisation' est soumise à l'arbitrage du Leader Principal.",
      time: 'Il y a 15 minutes',
      link: '/finance/approvals',
      unread: true,
      badge: 'Arbitrage Requis',
      badgeColor: 'amber',
    },
    {
      id: 'notif-2',
      title: "Fiche de Présence Soumise (Culte Dominical)",
      category: 'protocole',
      description: "L'équipe Protocole a scellé le rapport de culte : 500 fidèles présents et 32 nouveaux visiteurs accueillis.",
      time: 'Il y a 2 heures',
      link: '/attendance',
      unread: true,
      badge: 'Protocole',
      badgeColor: 'blue',
    },
    {
      id: 'notif-3',
      title: "Don 100% Affecté Construction Auditorium",
      category: 'finances',
      description: "Encaissement de 1 000 000 FCFA alloué directement au compartiment Construction (0% de prélèvement).",
      time: 'Il y a 5 heures',
      link: '/finance/entries',
      unread: true,
      badge: 'Affectation Directe',
      badgeColor: 'emerald',
    },
    {
      id: 'notif-4',
      title: "Rapport Périodique Prêt pour Clôture",
      category: 'reports',
      description: "Le bilan mensuel consolidé de trésorerie est disponible pour consultation et signature officielle.",
      time: 'Hier à 18:30',
      link: '/reports',
      unread: false,
      badge: 'Rapport',
      badgeColor: 'purple',
    },
  ];

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return n.unread;
    return n.category === filter;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            <span>Centre de Notifications & Alertes Opérationnelles</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi en temps réel des arbitrages de dépenses, fiches de culte et mouvements de trésorerie.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-500 border border-amber-400/30">
            3 Non lues
          </span>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 bg-white dark:bg-[#0C1530] p-2 rounded-2xl border border-slate-200 dark:border-[#16214A] w-fit shadow-sm">
        {[
          { id: 'all', label: 'Toutes' },
          { id: 'unread', label: 'Non lues' },
          { id: 'finances', label: 'Finances' },
          { id: 'protocole', label: 'Protocole' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filter === btn.id
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Liste des Notifications */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-6 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              item.unread
                ? 'bg-white dark:bg-[#0C1530] border-amber-400/30 dark:border-amber-400/30 shadow-md'
                : 'bg-white/70 dark:bg-[#0C1530]/60 border-slate-200 dark:border-[#16214A]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  item.category === 'finances'
                    ? 'bg-amber-400/20 text-amber-500'
                    : item.category === 'protocole'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                {item.category === 'finances' ? (
                  <Wallet className="w-6 h-6" />
                ) : item.category === 'protocole' ? (
                  <Users className="w-6 h-6" />
                ) : (
                  <Bell className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  {item.unread && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {item.description}
                </p>

                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.time}</span>
                </span>
              </div>
            </div>

            <Link
              to={item.link}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] hover:bg-amber-400 hover:text-slate-950 dark:hover:bg-amber-400 dark:hover:text-slate-950 text-slate-900 dark:text-white font-bold text-xs flex items-center gap-1.5 transition-all self-end md:self-center shrink-0"
            >
              <span>Traiter l'action</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
