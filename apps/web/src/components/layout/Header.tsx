import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePeriod } from '../../context/PeriodContext';
import { PeriodSelector } from '../analytics/PeriodSelector';
import { UserRole } from '@eev/shared-types';
import {
  Bell,
  Calendar,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  LogOut,
  Shield,
  User as UserIcon,
  HelpCircle,
} from 'lucide-react';

interface HeaderProps {
  onOpenOnboarding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenOnboarding }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { period, setPeriod } = usePeriod();
  const [showUserMenu, setShowUserMenu] = useState(false);

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
        return 'Administration Générale';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="px-6 md:px-10 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 transition-colors bg-[#F8FAFC]/95 dark:bg-[#060D24]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#16214A]/90 select-none print:hidden">
      {/* Salutation personnalisée avec typographie généreuse */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
          <span>Bienvenue, {getGreetingTitle()}</span>
          <span className="text-2xl md:text-3xl">👋</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Voici un aperçu de l'activité du ministère.
        </p>
      </div>

      {/* Barre d'outils et Profil */}
      <div className="flex flex-wrap items-center gap-3.5">
        {/* Bouton Notifications avec Badge Gold 3 */}
        <Link
          to="/notifications"
          className="relative p-3 rounded-2xl bg-white dark:bg-[#0F1A3A] border border-slate-200 dark:border-[#1C2B58] text-slate-700 dark:text-slate-300 hover:scale-105 transition-all shadow-sm cursor-pointer"
          title="3 notifications en attente"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
            3
          </span>
        </Link>

        {/* Sélecteur de date global unifié */}
        <PeriodSelector
          selectedPeriod={period}
          onPeriodChange={setPeriod}
          align="right"
        />

        {/* Toggle Mode Clair / Sombre */}
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white dark:bg-[#0F1A3A] border border-slate-200 dark:border-[#1C2B58] text-amber-500 hover:scale-105 transition-all shadow-sm cursor-pointer"
          title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        {/* Bouton Déconnexion Directe Rapide */}
        <button
          onClick={handleLogout}
          className="p-3 rounded-2xl bg-white dark:bg-[#0F1A3A] border border-slate-200 dark:border-[#1C2B58] text-rose-500 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all shadow-sm cursor-pointer"
          title="Se déconnecter de la plateforme"
        >
          <LogOut className="w-5 h-5" />
        </button>

        {/* Profil Utilisateur Interactif avec Menu Déroulant */}
        <div className="relative pl-1">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl bg-white dark:bg-[#0F1A3A] border border-slate-200 dark:border-[#1C2B58] hover:border-amber-400/50 shadow-sm transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl ring-2 ring-amber-400/70 p-0.5 bg-gradient-to-tr from-amber-400 to-amber-200 shrink-0 shadow-sm">
              <div className="w-full h-full rounded-lg bg-slate-900 flex items-center justify-center text-amber-400 font-black text-sm">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                {user?.name || 'Collaborateur'}
              </p>
              <p className="text-[11px] text-amber-500 font-bold mt-0.5">
                {getRoleSubtext()}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {/* Menu Déroulant du Profil */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0F1A3A] border border-slate-200 dark:border-[#1C2B58] shadow-2xl p-2.5 z-50 animate-fade-in text-xs space-y-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080E24] border border-slate-200 dark:border-[#16214A] space-y-1">
                <p className="font-black text-slate-900 dark:text-white text-sm">
                  {user?.name}
                </p>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px] truncate">
                  {user?.email}
                </p>
                <div className="pt-1">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-500 border border-amber-400/30">
                    {getRoleSubtext()}
                  </span>
                </div>
              </div>

              {onOpenOnboarding && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenOnboarding();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-amber-400/10 hover:text-amber-500 transition-colors text-left"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Guide d'accueil (Onboarding)</span>
                </button>
              )}

              <div className="border-t border-slate-100 dark:border-[#16214A] my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Se déconnecter de la plateforme</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
