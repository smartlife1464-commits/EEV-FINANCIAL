import React, { useEffect, useState } from 'react';
import { BrandLogo, BrandName } from '../common/Brand';
import { Lottie } from 'lottie-react';
import { normalizeLottie } from '../../utils/lottie';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '@eev/shared-types';
import {
  getRoleLottieAnimation,
  getRoleConfigMeta,
} from './roleLottieAnimations';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export interface PostLoginPreloaderProps {
  user: {
    id: string;
    email: string;
    name?: string;
    role: UserRole | string;
  };
  onComplete: () => void;
  durationMs?: number; // default: 5000 (5s)
}

export const PostLoginPreloader: React.FC<PostLoginPreloaderProps> = ({
  user,
  onComplete,
  durationMs = 5000,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const meta = getRoleConfigMeta(user.role);
  const lottieData = React.useMemo(() => normalizeLottie(getRoleLottieAnimation(user.role)), [user.role]);

  const [elapsed, setElapsed] = useState<number>(0);

  // Interval de 50ms pour une animation de barre ultra fluide
  useEffect(() => {
    const stepInterval = 50;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + stepInterval;
        if (next >= durationMs) {
          clearInterval(timer);
          return durationMs;
        }
        return next;
      });
    }, stepInterval);

    return () => clearInterval(timer);
  }, [durationMs]);

  // Redirection automatique à la fin des 5 secondes
  useEffect(() => {
    if (elapsed >= durationMs) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [elapsed, durationMs, onComplete]);

  // Calcul du pourcentage et des secondes restantes
  const progressPercent = Math.min(100, Math.round((elapsed / durationMs) * 100));
  const secondsRemaining = Math.max(1, Math.ceil((durationMs - elapsed) / 1000));

  // Messages d'étapes dynamiques selon l'avancement dans les 5 secondes
  const getPhaseMessage = () => {
    if (elapsed < 1200) {
      return {
        title: 'Initialisation du Protocole de Sécurité',
        subtitle: 'Chiffrement des clés de session & jetons d\'accès...',
        step: 1,
      };
    }
    if (elapsed < 2400) {
      return {
        title: `Validation des Habilitations pour ${meta.roleLabel}`,
        subtitle: `Vérification du périmètre : ${meta.department}...`,
        step: 2,
      };
    }
    if (elapsed < 3600) {
      return {
        title: 'Synchronisation des Données en Temps Réel',
        subtitle: 'Connexion aux registres officiels et à la trésorerie...',
        step: 3,
      };
    }
    if (elapsed < 4600) {
      return {
        title: `Calibrage de l'Interface de Travail`,
        subtitle: `Acheminement vers : ${meta.targetDashboard}...`,
        step: 4,
      };
    }
    return {
      title: 'Environnement Prêt ! Bienvenue dans votre Sanctuaire Numérique',
      subtitle: 'Redirection automatique en cours...',
      step: 5,
    };
  };

  const phase = getPhaseMessage();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 select-none overflow-hidden ${
        isDark
          ? 'bg-[#060D24] text-white'
          : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Arrière-plan stylisé avec halos de lumière selon le rôle */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-40 dark:opacity-25"
        style={{ backgroundColor: meta.colorHex }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-30 dark:opacity-20"
        style={{ backgroundColor: meta.colorHex }}
      />

      {/* Carte Centrale de Préchargement */}
      <div
        className={`relative z-10 w-full max-w-xl rounded-3xl p-6 sm:p-10 shadow-2xl border transition-all duration-300 flex flex-col items-center text-center space-y-6 ${
          isDark
            ? 'bg-[#091338]/90 border-[#1E2C60] shadow-2xl shadow-black/60 backdrop-blur-xl'
            : 'bg-white/95 border-slate-200/90 shadow-2xl shadow-slate-200/80 backdrop-blur-xl'
        }`}
      >
        {/* En-tête Institutionnel */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 p-2 flex items-center justify-center shadow-md">
            <BrandLogo className="w-full h-full object-contain" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
              <BrandName upper />
            </p>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
              Plateforme Intégrée de Gouvernance & Caisse
            </p>
          </div>
        </div>

        {/* Animation Lottie Spécifique au Rôle */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center -my-2">
          {/* Anneau Pulsant d'Aura */}
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none"
            style={{ backgroundColor: meta.colorHex }}
          />
          <div className="w-full h-full drop-shadow-2xl">
            <Lottie
              src={lottieData}
              loop
              autoplay
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Présentation du Rôle Connecté en Grand Relief */}
        <div className="space-y-2 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider shadow-sm transition-transform hover:scale-105"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderColor: meta.colorHex,
              color: isDark ? '#ffffff' : '#0f172a',
            }}
          >
            <span className="text-base">{meta.badgeEmoji}</span>
            <span style={{ color: meta.colorHex }}>{meta.roleLabel}</span>
            <span className="text-[10px] opacity-75 font-bold">({meta.department})</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Bienvenue, {user.name || user.email.split('@')[0]}
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
            Destination : <strong className="text-slate-700 dark:text-slate-200">{meta.targetDashboard}</strong>
          </p>
        </div>

        {/* Barre de Progression 5 Secondes & Indicateurs */}
        <div className="w-full space-y-3 pt-1">
          {/* En-tête de la progression */}
          <div className="flex items-center justify-between text-xs font-black">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Clock className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Chargement sécurisé en {secondsRemaining}s...</span>
            </span>
            <span className="font-mono text-amber-500 font-extrabold text-sm">
              {progressPercent}%
            </span>
          </div>

          {/* Barre animée */}
          <div
            className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
              isDark ? 'bg-slate-900 border-[#1E2C60]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <div
              className="h-full rounded-full transition-all duration-75 ease-out shadow-sm"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${meta.colorHex}, #FFD700)`,
                boxShadow: `0 0 12px ${meta.colorHex}66`,
              }}
            />
          </div>

          {/* Message de Phase Dynamique */}
          <div
            className={`p-3 rounded-2xl border text-xs text-left flex items-start gap-3 transition-all duration-200 ${
              isDark
                ? 'bg-[#070D22] border-[#16214A]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-slate-950 font-black text-[11px]"
              style={{ backgroundColor: meta.colorHex }}
            >
              {phase.step}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {phase.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {phase.subtitle}
              </p>
            </div>
            {phase.step === 5 && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 self-center animate-bounce" />
            )}
          </div>
        </div>

        {/* Footer avec Bouton d'accès immédiat (Skip 5s) */}
        <div className="w-full flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#16214A]/70 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Session authentifiée</span>
          </span>

          <button
            type="button"
            onClick={onComplete}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Passer le délai et ouvrir directement"
          >
            <span>Accéder maintenant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

