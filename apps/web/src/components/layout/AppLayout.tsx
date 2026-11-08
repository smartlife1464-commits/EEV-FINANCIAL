import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/AuthContext';
import { OnboardingModal } from '../onboarding/OnboardingModal';

export const AppLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Vérification de la première connexion pour afficher l'onboarding
  useEffect(() => {
    if (user?.id) {
      const hasCompleted = localStorage.getItem(`eev_onboarding_completed_${user.id}`);
      if (!hasCompleted) {
        setIsOnboardingOpen(true);
      }
    }
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#091338] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold tracking-widest text-amber-400 uppercase">
            MINISTÈRE ESPRIT & VIE • CHARGEMENT...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#060D24] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 print:h-auto print:w-full print:overflow-visible print:bg-white print:text-slate-900">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:w-full">
        <div className="print:hidden">
          <Header onOpenOnboarding={() => setIsOnboardingOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6 print:overflow-visible print:p-0 print:m-0 print:w-full">
          <Outlet />
        </main>
      </div>

      {/* Guide d'accueil animé Lottie à la première connexion ou à la demande */}
      <div className="print:hidden">
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
        />
      </div>
    </div>
  );
};
