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
  Scale,
  FileText,
  Users,
  Settings,
  History,
  Bell,
  LogOut,
  Sparkles,
  CalendarRange,
  FileCheck2,
  ArrowLeftRight,
  BookOpen,
  SlidersHorizontal,
  Church,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { UserRole } from '@eev/shared-types';
import { usePlatform } from '../../context/PlatformContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const role = user?.role || UserRole.PROTOCOL_AGENT;
  const { unreadCount } = useNotifications();
  const { platform, isModuleEnabled } = usePlatform();
  const brandName = platform.shortName || platform.name;
  const FINANCE_ROLES = [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.AUDITOR];

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
      module: 'analytics',
      label: 'Statistiques & Analyses',
      icon: BarChart3,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.PROTOCOL_LEAD, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/attendance',
      module: 'attendance',
      label: 'Cultes & Fréquentation',
      icon: CalendarDays,
      show: true,
    },
    {
      to: '/services',
      module: 'attendance',
      label: 'Programme des cultes',
      icon: CalendarRange,
      show: true,
    },
    {
      to: '/finance',
      module: 'finance',
      label: 'Finances',
      icon: Wallet,
      exact: true,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/finance/entries',
      module: 'finance',
      label: 'Recettes',
      icon: ArrowDownCircle,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/finance/expenses',
      module: 'finance',
      label: 'Dépenses',
      icon: ArrowUpCircle,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/finance/approvals',
      module: 'finance',
      label: 'Approbations',
      icon: FileCheck2,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/finance/transfers',
      module: 'transfers',
      label: 'Transferts internes',
      icon: ArrowLeftRight,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD].includes(role),
    },
    {
      to: '/finance/transactions',
      module: 'finance',
      label: 'Grand livre',
      icon: BookOpen,
      show: FINANCE_ROLES.includes(role),
    },
    {
      to: '/finance/treasury',
      module: 'finance',
      label: 'Trésorerie',
      icon: PiggyBank,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.AUDITOR].includes(role),
    },
    {
      to: '/finance/cash-closing',
      module: 'cashClosing',
      label: 'Clôture & PV de Caisse',
      icon: Scale,
      show: [UserRole.LEAD_PASTOR, UserRole.ADMIN, UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.AUDITOR].includes(role),
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
      to: '/platform',
      label: 'Console plateforme',
      icon: SlidersHorizontal,
      show: Boolean(user?.isPlatformAdmin),
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
      badge: unreadCount > 0 ? String(unreadCount > 99 ? '99+' : unreadCount) : undefined,
    },
  ];

  return (
    <aside style={{ backgroundColor: platform.colors?.secondary || '#091338' }} className="w-72 bg-[#091338] text-slate-300 flex flex-col h-full border-r border-[#16214A] select-none shrink-0 transition-all duration-200 print:hidden">
      {/* Brand Header — Exact Logo & Typography agrandis pour une lisibilité parfaite */}
      <div className="p-6 flex items-center gap-4 border-b border-[#16214A]/70">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-400/35 p-2 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/15">
          {platform.logo ? (
            <img src={platform.logo} alt={`Logo ${platform.name}`} className="w-full h-full object-contain" />
          ) : (
            <Church className="w-6 h-6 text-amber-400" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-black text-base tracking-wider text-white uppercase truncate" title={platform.name}>
            {brandName}
          </h1>
          <p className="text-xs text-amber-400 font-extrabold uppercase tracking-widest mt-0.5">
            Tableau de Bord
          </p>
        </div>
      </div>

      {/* Navigation List — Tailles de polices et icônes ajustées (text-sm, w-5 h-5) */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
        {navItems
          .filter((item) => item.show && (!('module' in item) || !item.module || isModuleEnabled(item.module)))
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/25 translate-x-1'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? 'text-slate-950' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-xs font-black min-w-6 h-6 px-1 rounded-full flex items-center justify-center ${
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

      {/* Verset du Jour — Box authentique du screenshot avec typographie aérée */}
      <div className="px-4 py-3">
        <div className="p-4.5 rounded-2xl bg-[#0D183E] border border-amber-400/30 space-y-2 shadow-inner">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">
              Verset du jour
            </span>
          </div>
          <p className="text-xs md:text-[13px] text-slate-300 leading-relaxed italic">
            « Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur. »
          </p>
          <p className="text-xs text-amber-400/90 font-bold text-right pt-0.5">
            Colossiens 3:23
          </p>
        </div>
      </div>

      {/* Déconnexion au bas */}
      <div className="p-4 pt-1 border-t border-[#16214A]/70">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
