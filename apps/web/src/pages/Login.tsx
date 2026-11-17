import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  KeyRound,
  X,
  CheckCircle2,
} from 'lucide-react';
import { UserRole } from '@eev/shared-types';
import { PostLoginPreloader } from '../components/auth/PostLoginPreloader';
import { usePlatform } from '../context/PlatformContext';
import { Church } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [pendingAuth, setPendingAuth] = useState<{
    token: string;
    user: any;
  } | null>(null);

  const { platform } = usePlatform();
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('eev_last_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals & Panels
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Si l'utilisateur est déjà authentifié et aucun préchargement n'est en cours, redirection vers le dashboard
  // (placé APRÈS tous les hooks : un retour anticipé avant des hooks provoquait une erreur React après connexion)
  if (isAuthenticated && user && !pendingAuth) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ email: email.trim().toLowerCase(), password });
      try {
        if (rememberMe) localStorage.setItem('eev_last_email', email.trim().toLowerCase());
        else localStorage.removeItem('eev_last_email');
      } catch {
        /* stockage indisponible */
      }
      // Déclenchement de l'animation Lottie de préchargement en 5 secondes
      setPendingAuth({
        token: res.token,
        user: res.user,
      });
    } catch (err: any) {
      setError(
        err?.message ||
          'Email ou mot de passe invalide. Veuillez vérifier vos accès auprès de la direction générale.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePreloaderComplete = () => {
    if (!pendingAuth) return;
    login(pendingAuth.token, pendingAuth.user);
    if (
      pendingAuth.user.role === UserRole.PROTOCOL_LEAD ||
      pendingAuth.user.role === UserRole.PROTOCOL_AGENT
    ) {
      navigate('/attendance', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // Affichage plein écran de l'animation Lottie de 5 secondes après connexion
  if (pendingAuth) {
    return (
      <PostLoginPreloader
        user={pendingAuth.user}
        durationMs={5000}
        onComplete={handlePreloaderComplete}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] dark:bg-[#060D24] text-slate-900 dark:text-slate-100 transition-colors duration-200 relative overflow-hidden select-none">
      {/* Background Orbs & Gradients inspirés du thème institutionnel */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-400/15 dark:bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600/10 dark:bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header : Switcher Thème Clair/Sombre & Contact Admin */}
      <header className="relative z-20 px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-400/30 p-2 flex items-center justify-center shadow-md">
{platform.logo ? (
              <img src={platform.logo} alt={`Logo ${platform.name}`} className="w-full h-full object-contain" />
            ) : (
              <Church className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <span className="font-black text-sm tracking-widest text-slate-900 dark:text-white uppercase hidden sm:inline-block">
            {platform.shortName || platform.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Bouton d'aide & politique de sécurité */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-amber-400/50 shadow-sm transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Création de compte & Accès</span>
          </button>

          {/* Toggle Thème */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] text-amber-500 hover:scale-105 transition-all shadow-sm cursor-pointer"
            title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 py-8 max-w-md sm:max-w-lg mx-auto w-full">
        {/* Brand Showcase */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex justify-center mb-1">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400/25 to-amber-500/10 border-2 border-amber-400/40 p-3.5 shadow-xl shadow-amber-400/10 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
{platform.logo ? (
                <img src={platform.logo} alt={`Logo ${platform.name}`} className="w-full h-full object-contain drop-shadow" />
              ) : (
                <Church className="w-9 h-9 text-amber-500" />
              )}
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            {platform.name}
          </h1>
          <p className="text-xs sm:text-sm font-extrabold tracking-widest text-amber-500 uppercase">
            {platform.tagline || 'Portail de gouvernance, trésorerie & fréquentation'}
          </p>
        </div>

        {/* Security Policy Badge — Aucune inscription publique */}
        <div className="w-full mb-6 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-400/30 flex items-start gap-3 text-left shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <p className="font-black text-slate-900 dark:text-amber-400 mb-0.5">
              Plateforme Interne Privée & Sécurisée
            </p>
            <p>
              L’inscription publique est <strong>strictement désactivée</strong>. Tout compte utilisateur est créé et accrédité exclusivement par l'<strong>Administrateur Général</strong> ou le <strong>Superviseur Général (Pasteur Principal)</strong>.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Identifiant Institutionnel (Email)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="nom@exemple.org"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#060D24] border border-slate-200 dark:border-[#16214A] rounded-2xl text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Mot de Passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-xs font-bold text-amber-500 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-[#060D24] border border-slate-200 dark:border-[#16214A] rounded-2xl text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 dark:text-slate-400 font-semibold">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-lg text-amber-500 focus:ring-amber-400 border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060D24]"
                />
                <span>Mémoriser ma session sur ce terminal</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-400/25 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ouvrir la session sécurisée</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

        </div>
      </main>

      {/* Footer spirituel & institutionnel */}
      <footer className="relative z-20 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-[#16214A]/80 space-y-1">
        <p className="italic font-medium">
          « Car Dieu n'est pas un Dieu de désordre, mais de paix. » — 1 Corinthiens 14:33
        </p>
        <p className="font-semibold text-[11px] opacity-75">
          © {new Date().getFullYear()} {platform.name} • Gestion financière & statistique • Accès privé
        </p>
      </footer>

      {/* Modal d'Aide & Procédure de Création de Compte */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#16214A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Politique d'Accès & Sécurité
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Protocole strict de délivrance des identifiants
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/25 space-y-1">
                <p className="font-black text-slate-900 dark:text-amber-400">
                  Pas de formulaire d'inscription libre
                </p>
                <p className="text-xs">
                  Afin de préserver la souveraineté des fonds et la stricte confidentialité des données ecclésiastiques, aucune auto-inscription n'est admise.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Qui est habilité à créer ou réinitialiser un compte ?
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>
                    <strong>L'Administrateur Général</strong> : assure la gestion technique et le provisionnement des accès RBAC.
                  </li>
                  <li>
                    <strong>Le Superviseur Général (Pasteur Principal)</strong> : valide les habilitations pastorales et financières.
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#060D24] border border-slate-200 dark:border-[#16214A] space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  Besoin d'un accès ou mot de passe perdu ?
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Utilisez « Mot de passe oublié » si l’envoi d’emails est configuré, sinon rapprochez-vous de l’administrateur : il peut réinitialiser votre mot de passe depuis la gestion des utilisateurs.
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-colors"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
