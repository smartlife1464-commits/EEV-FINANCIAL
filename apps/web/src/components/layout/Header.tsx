import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@eev/shared-types';
import { LogOut, Bell, UserCircle2, ArrowRightLeft } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, login } = useAuth();

  const handleSwitchRole = (newRole: UserRole) => {
    const roleUsers = {
      [UserRole.LEAD_PASTOR]: { id: 'dev-leader-id', email: 'leader@espritvie.org', name: 'Leader Principal' },
      [UserRole.ADMIN]: { id: 'dev-admin-id', email: 'admin@espritvie.org', name: 'Administrateur Général' },
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
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          Yaoundé • Siège Central
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Role Switcher for Test & Demo */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Rôle :</span>
          <select
            value={user?.role}
            onChange={(e) => handleSwitchRole(e.target.value as UserRole)}
            className="text-xs font-semibold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value={UserRole.LEAD_PASTOR}>👑 Leader Principal</option>
            <option value={UserRole.FINANCE_LEAD}>💰 Responsable Finances</option>
            <option value={UserRole.PROTOCOL_LEAD}>📋 Responsable Protocole</option>
            <option value={UserRole.CASHIER}>💵 Caissier / Agent Financier</option>
            <option value={UserRole.PROTOCOL_AGENT}>🙋‍♂️ Agent Protocole</option>
            <option value={UserRole.AUDITOR}>🔍 Auditeur / Contrôleur</option>
            <option value={UserRole.ADMIN}>⚙️ Administrateur Général</option>
          </select>
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          title="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
          <span>Quitter</span>
        </button>
      </div>
    </header>
  );
};
