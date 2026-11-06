import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '@eev/shared-types';
import {
  Bell,
  Calendar,
  Sun,
  Moon,
  ChevronDown,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('1 - 31 Mai 2026');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const getGreetingTitle = () => {
    switch (user?.role) {
      case UserRole.LEAD_PASTOR:
        return 'Pasteur Principal';
      case UserRole.FINANCE_LEAD:
        return 'Responsable Finances';
      case UserRole.CASHIER:
        return 'Caissier';
      case UserRole.PROTOCOL_LEAD:
        return 'Responsable Protocole';
      case UserRole.PROTOCOL_AGENT:
        return 'Agent Protocole';
      case UserRole.AUDITOR:
        return 'Auditeur';
      case UserRole.ADMIN:
      default:
        return 'Administrateur';
    }
  };

  const getRoleSubtext = () => {
    switch (user?.role) {
      case UserRole.LEAD_PASTOR:
        return 'Gouvernance & Leader';
      case UserRole.FINANCE_LEAD:
        return 'Département Finances';
      case UserRole.CASHIER:
        return 'Caisse Centrale';
      case UserRole.PROTOCOL_LEAD:
      case UserRole.PROTOCOL_AGENT:
        return 'Département Protocole';
      case UserRole.AUDITOR:
        return 'Contrôle & Conformité';
      case UserRole.ADMIN:
      default:
        return 'Admin principal';
    }
  };

  const handleSwitchRole = (newRole: UserRole) => {
    const roleUsers = {
      [UserRole.LEAD_PASTOR]: { id: 'dev-leader-id', email: 'leader@espritvie.org', name: 'Pasteur Principal' },
      [UserRole.ADMIN]: { id: 'dev-admin-id', email: 'admin@espritvie.org', name: 'Administrateur' },
      [UserRole.FINANCE_LEAD]: { id: 'dev-finance-id', email: 'finance@espritvie.org', name: 'Responsable Finances' },
      [UserRole.PROTOCOL_LEAD]: { id: 'dev-protocol-id', email: 'protocol@espritvie.org', name: 'Responsable Protocole' },
      [UserRole.CASHIER]: { id: 'dev-cashier-id', email: 'caissier@espritvie.org', name: 'Caissier Principal' },
      [UserRole.AUDITOR]: { id: 'dev-auditor-id', email: 'auditeur@espritvie.org', name: 'Auditeur / Contrôleur' },
      [UserRole.PROTOCOL_AGENT]: { id: 'dev-agent-id', email: 'agent@espritvie.org', name: 'Agent Protocole' },
    };

    const target = roleUsers[newRole];
    if (target) {
      login(`dev-token-${newRole}`, {
        id: target.id,
        email: target.email,
        name: target.name,
        role: newRole,
        permissions: {},
      });
    }
  };

  return (
    <header className="px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 transition-colors bg-[#F8FAFC] dark:bg-[#060D24]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#16214A]/80">
      {/* Salutation personnalisée */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <span>Bienvenue, {getGreetingTitle()}</span>
          <span className="text-xl">👋</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Voici un aperçu de l'activité du ministère.
        </p>
      </div>

      {/* Barre d'outils et Profil */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Bouton Notifications avec Badge Gold 3 */}
        <Link
          to="/notifications"
          className="relative p-2.5 rounded-2xl bg-white dark:bg-[#0F1A3A] border border-slate-200 dark:border-[#1C2B58] text-slate-600 dark:text-slate-300 hover:scale-105 transition-all shadow-sm cursor-pointer"
          title="3 notifications en attente"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-sm">
            3
          </span>
        </Link>

        {/* Sélecteur de date (Période) */}
        <div className="relative">
          <button
            onClick={() => setShowPeriodMenu(!showPeriodMenu)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#0F1A3A] border border-slate-200 dark:border-[#1C2B58] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-amber-400/50 shadow-sm transition-all"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{selectedPeriod}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showPeriodMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#0F1A3A] border border-slate-200 dark:border-[#1C2B58] shadow-2xl p-1.5 z-50 text-xs">
              {['1 - 31 Mai 2026', '7 derniers jours', 'Ce trimestre', 'Année 2026'].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setSelectedPeriod(p);
                    setShowPeriodMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors ${
                    selectedPeriod === p
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toggle Mode Clair / Sombre */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white dark:bg-[#0F1A3A] border border-slate-200 dark:border-[#1C2B58] text-amber-500 hover:scale-105 transition-all shadow-sm"
          title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Switcher de rôle pour tester tous les profils */}
        <select
          value={user?.role}
          onChange={(e) => handleSwitchRole(e.target.value as UserRole)}
          className="px-3 py-2 rounded-2xl bg-white dark:bg-[#0F1A3A] border border-slate-200 dark:border-[#1C2B58] text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer shadow-sm hover:border-amber-400/50 transition-all"
        >
          <option value={UserRole.ADMIN}>⚙️ Administrateur</option>
          <option value={UserRole.LEAD_PASTOR}>👑 Leader Principal</option>
          <option value={UserRole.FINANCE_LEAD}>💰 Resp. Finances</option>
          <option value={UserRole.CASHIER}>💵 Caissier</option>
          <option value={UserRole.PROTOCOL_LEAD}>📋 Resp. Protocole</option>
          <option value={UserRole.PROTOCOL_AGENT}>🙋‍♂️ Agent Protocole</option>
          <option value={UserRole.AUDITOR}>🔍 Auditeur</option>
        </select>

        {/* Profil Utilisateur - Look exact du screenshot */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-9 h-9 rounded-full ring-2 ring-amber-400/60 p-0.5 bg-gradient-to-tr from-amber-400 to-amber-200 shrink-0">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-400 font-extrabold text-xs">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
              {user?.name || 'Administrateur'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {getRoleSubtext()}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
