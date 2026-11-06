import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  PieChart,
  ArrowLeftRight,
  BookOpen,
  FileText,
  ShieldCheck,
  History,
  Crown,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@eev/shared-types';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || UserRole.PROTOCOL_AGENT;

  // Configuration des sections de navigation adaptées au rôle
  const navSections = [
    {
      title: 'PILOTAGE & TABLEAUX DE BORD',
      items: [
        {
          to: '/',
          label: 'Vue Globale Leader',
          icon: Crown,
          show: role === UserRole.LEAD_PASTOR || role === UserRole.ADMIN,
        },
        {
          to: '/finance',
          label: 'Dashboard Finances',
          icon: Wallet,
          show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.AUDITOR].includes(role),
        },
        {
          to: '/protocol',
          label: 'Dashboard Protocole',
          icon: Users,
          show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.PROTOCOL_LEAD, UserRole.PROTOCOL_AGENT, UserRole.AUDITOR].includes(role),
        },
      ],
    },
    {
      title: 'PROTOCOLE & FRÉQUENTATION',
      items: [
        {
          to: '/services',
          label: 'Cultes & Programmes',
          icon: CalendarDays,
          show: true,
        },
        {
          to: '/attendance',
          label: 'Fiches de Présence',
          icon: ClipboardList,
          show: true,
        },
        {
          to: '/attendance/new',
          label: 'Saisir les Présences',
          icon: Users,
          show: [UserRole.PROTOCOL_AGENT, UserRole.PROTOCOL_LEAD, UserRole.ADMIN, UserRole.LEAD_PASTOR].includes(role),
        },
      ],
    },
    {
      title: 'FINANCES & TRÉSORERIE',
      items: [
        {
          to: '/finance/treasury',
          label: 'Trésorerie Consolidée',
          icon: PieChart,
          show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.AUDITOR].includes(role),
        },
        {
          to: '/finance/entries',
          label: 'Recettes Encaissées',
          icon: ArrowDownCircle,
          show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.AUDITOR].includes(role),
        },
        {
          to: '/finance/entries/new',
          label: 'Enregistrer une Recette',
          icon: ArrowDownCircle,
          show: [UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.ADMIN].includes(role),
        },
        {
          to: '/finance/expenses',
          label: 'Dépenses & Décaissements',
          icon: ArrowUpCircle,
          show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.AUDITOR].includes(role),
        },
        {
          to: '/finance/approvals',
          label: 'Autorisation des Dépenses',
          icon: CheckCircle2,
          show: [UserRole.LEAD_PASTOR, UserRole.ADMIN].includes(role),
          badge: 'Validation',
        },
        {
          to: '/finance/transfers',
          label: 'Transferts Analytiques',
          icon: ArrowLeftRight,
          show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD].includes(role),
        },
        {
          to: '/finance/transactions',
          label: 'Grand Livre Comptable',
          icon: BookOpen,
          show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.AUDITOR].includes(role),
        },
      ],
    },
    {
      title: 'RAPPORTS & AUDIT',
      items: [
        {
          to: '/reports',
          label: 'Rapports & Exports',
          icon: FileText,
          show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.PROTOCOL_LEAD, UserRole.AUDITOR].includes(role),
        },
        {
          to: '/admin/audit',
          label: 'Journal d’Audit Immuable',
          icon: History,
          show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.AUDITOR].includes(role),
        },
        {
          to: '/admin/users',
          label: 'Gestion des Utilisateurs',
          icon: ShieldCheck,
          show: [UserRole.ADMIN, UserRole.LEAD_PASTOR].includes(role),
        },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <img
          src="/logo-eev.png"
          alt="Esprit & Vie"
          className="w-10 h-10 object-contain rounded-lg p-1 bg-white/5 border border-amber-400/20"
        />
        <div className="flex-1 min-w-0">
          <h1 className="font-extrabold text-sm text-white tracking-wider truncate">
            ESPRIT & VIE
          </h1>
          <p className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
            Gestion & Trésorerie
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {navSections.map((section, idx) => {
          const visibleItems = section.items.filter((item) => item.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1.5">
              <h2 className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </h2>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Utilisateur'}</p>
            <p className="text-[11px] text-amber-400 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

