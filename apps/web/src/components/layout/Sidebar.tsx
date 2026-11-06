import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  FileText,
  Users,
  Settings,
  History,
  Bell,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@eev/shared-types';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const role = user?.role || UserRole.PROTOCOL_AGENT;

  // Configuration des éléments du menu inspirée du design de référence
  const navItems = [
    {
      to: '/',
      label: "Vue d'ensemble",
      icon: LayoutDashboard,
      show: true,
      exact: true,
    },
    {
      to: '/analytics',
      label: 'Statistiques & Analyses',
      icon: BarChart3,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.PROTOCOL_LEAD, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/attendance',
      label: 'Cultes & Fréquentation',
      icon: CalendarDays,
      show: true,
    },
    {
      to: '/finance',
      label: 'Finances',
      icon: Wallet,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/finance/entries',
      label: 'Recettes',
      icon: ArrowDownCircle,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/finance/expenses',
      label: 'Dépenses',
      icon: ArrowUpCircle,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/finance/treasury',
      label: 'Trésorerie',
      icon: PiggyBank,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/reports',
      label: 'Rapports',
      icon: FileText,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.PROTOCOL_LEAD, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/admin/users',
      label: 'Utilisateurs',
      icon: Users,
      show: [UserRole.ADMIN, UserRole.LEAD_PASTOR].includes(role),
    },
    {
      to: '/settings',
      label: 'Paramètres',
      icon: Settings,
      show: [UserRole.ADMIN, UserRole.LEAD_PASTOR].includes(role),
    },
    {
      to: '/admin/audit',
      label: 'Journal d’audit',
      icon: History,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: Bell,
      show: true,
      badge: '3',
    },
  ];

  return (
    <aside className="w-64 bg-[#091338] text-slate-300 flex flex-col h-full border-r border-[#16214A] select-none shrink-0 transition-colors">
      {/* Brand Header — Exact Logo & Typography */}
      <div className="p-6 flex items-center gap-3.5 border-b border-[#16214A]/60">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-400/30 p-1.5 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/10">
          <img
            src="/logo-eev.png"
            alt="Logo Esprit & Vie"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <h1 className="font-extrabold text-sm tracking-wider text-white uppercase">
            ESPRIT & VIE
          </h1>
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mt-0.5">
            Tableau de Bord
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-slate-950' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${
                          isActive
                            ? 'bg-slate-950 text-amber-400'
                            : 'bg-amber-400 text-slate-950'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
      </nav>

      {/* Verset du Jour — Box authentique du screenshot */}
      <div className="px-3.5 py-2">
        <div className="p-4 rounded-2xl bg-[#0D183E] border border-amber-400/25 space-y-1.5 shadow-inner">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Verset du jour
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed italic">
            « Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur. »
          </p>
          <p className="text-[10px] text-amber-400/90 font-bold text-right pt-0.5">
            Colossiens 3:23
          </p>
        </div>
      </div>

      {/* Déconnexion au bas */}
      <div className="p-3.5 pt-1 border-t border-[#16214A]/60">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
