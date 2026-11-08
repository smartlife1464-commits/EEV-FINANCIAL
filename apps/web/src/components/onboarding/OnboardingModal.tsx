import React, { useState } from 'react';
import { Lottie } from 'lottie-react';
import {
  welcomeLottie,
  roleLottie,
  analyticsLottie,
  securityLottie,
  workflowLottie,
  celebrationLottie,
} from './lottieAnimations';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@eev/shared-types';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Wallet,
  Users,
  Award,
  ArrowRight,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  if (!isOpen) return null;

  const role = user?.role || UserRole.PROTOCOL_AGENT;

  // Configuration personnalisée par rôle
  const getRoleDetails = () => {
    switch (role) {
      case UserRole.LEAD_PASTOR:
        return {
          title: 'Pasteur Principal • Superviseur Général',
          badge: '👑 Gouvernance Suprême & Vision',
          mission:
            'Supervision générale de l’Église, contrôle souverain des ressources et validation pastorale des engagements majeurs.',
          dashboardText:
            'Accès au Tableau de Bord Exécutif Global : trésorerie consolidée en direct, courbe d’évolution des recettes, fréquentation des cultes et synthèse analytique.',
          workflowText:
            'Vous avez l’autorité finale sur l’approbation des dépenses au-dessus des seuils, la réconciliation bancaire et la nomination des collaborateurs.',
          keyFeature: 'Approbation souveraine des dépenses et consultation de l’ensemble des fonds.',
        };
      case UserRole.ADMIN:
        return {
          title: 'Administrateur Général',
          badge: '⚙️ Système & Sécurité RBAC',
          mission:
            'Garant de l’intégrité technique, du provisionnement des comptes collaborateurs et du paramétrage des règles de l’église.',
          dashboardText:
            'Vue globale sur les utilisateurs, la configuration des services de culte, le journal d’audit inviolable et les alertes d’anomalies.',
          workflowText:
            'Création et suspension des comptes d’accès, attribution des rôles stricts et maintenance de la base de données.',
          keyFeature: 'Gestion sécurisée des utilisateurs et paramétrage des 7 types de cultes.',
        };
      case UserRole.FINANCE_LEAD:
        return {
          title: 'Responsable des Finances',
          badge: '💰 Direction Financière & Budgets',
          mission:
            'Pilotage de la trésorerie analytique, suivi des fonds dédiés (Général, Construction, Évangélisation) et planification des charges fixes.',
          dashboardText:
            'Tableau de bord financier complet : total des dîmes, offrandes ordinaires et spéciales, suivi des décaissements et couverture du cash-flow.',
          workflowText:
            'Préparation des budgets, ordonnancement des paiements et vérification quotidienne des procès-verbaux de caisse.',
          keyFeature: 'Gestion des charges récurrentes, prévisions de trésorerie et clôtures de période.',
        };
      case UserRole.CASHIER:
        return {
          title: 'Caissier Principal',
          badge: '💵 Caisse Centrale & Recettes',
          mission:
            'Encaissement physique des offrandes et dîmes, exécution matérielle des paiements validés et arrêté contradictoire du coffre.',
          dashboardText:
            'Tableau de bord de caisse : solde d’espèces en direct, encaissements de la journée, dépenses prêtes à payer et balance de trésorerie.',
          workflowText:
            'Chaque fin de service ou de journée, vous éditez le Procès-Verbal de Clôture avec comptage des billets et pièces.',
          keyFeature: 'Saisie rapide des recettes de culte et génération des reçus certifiés.',
        };
      case UserRole.PROTOCOL_LEAD:
        return {
          title: 'Responsable du Protocole',
          badge: '📋 Mobilisation & Fréquentation',
          mission:
            'Coordination de l’accueil, comptabilisation rigoureuse de l’assemblée et suivi pastoral des nouveaux arrivants.',
          dashboardText:
            'Tableau de bord exclusif Protocole : affluence du dernier culte (500 fidèles), taux de remplissage du sanctuaire (83,3%) et répartition démographique. Aucune donnée financière ne pollue votre écran.',
          workflowText:
            'Supervision des agents de comptage, vérification des fiches de présence et certification avant archivage officiel.',
          keyFeature: 'Parcours guidé en 5 étapes avec détection automatique des fiches en doublon.',
        };
      case UserRole.PROTOCOL_AGENT:
        return {
          title: 'Agent du Protocole',
          badge: '🙋‍♂️ Accueil & Comptage Fidèle',
          mission:
            'Comptabilisation précise des participants dans le sanctuaire (hommes, femmes, jeunes, enfants) et accueil des âmes.',
          dashboardText:
            'Espace de travail dédié aux cultes et à la fréquentation : accès immédiat au formulaire de saisie certifié.',
          workflowText:
            'Enregistrement exclusif : hommes, femmes, jeunes, enfants, nouveaux visiteurs accueillis et décisions pour Christ.',
          keyFeature: 'Saisie rapide et guidée pour chaque culte ou réunion spéciale.',
        };
      case UserRole.AUDITOR:
      default:
        return {
          title: 'Auditeur & Contrôleur Interne',
          badge: '🔍 Conformité & Traçabilité',
          mission:
            'Vérification indépendante de la conformité des écritures, inspection du grand livre et respect des procédures canoniques.',
          dashboardText:
            'Accès complet en lecture seule à tous les modules : trésorerie, pièces justificatives, procès-verbaux et rapports statistiques.',
          workflowText:
            'Audit en continu des flux monétaires, traçabilité des modifications et certification de l’honnêteté des comptes.',
          keyFeature: 'Consultation du journal d’audit inviolable horodaté.',
        };
    }
  };

  const roleInfo = getRoleDetails();

  const handleFinish = () => {
    if (user?.id) {
      localStorage.setItem(`eev_onboarding_completed_${user.id}`, 'true');
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all">
        {/* Top Bar : Logo, Étapes et Fermer */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#16214A]/80 flex items-center justify-between bg-slate-50/50 dark:bg-[#091338]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/35 p-2 flex items-center justify-center shadow-md">
              <img
                src="/logo-eev.png"
                alt="Logo Esprit & Vie"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">
                MINISTÈRE ESPRIT & VIE
              </p>
              <p className="text-[11px] font-bold text-amber-500">
                Guide de Démarrage • Étape {currentStep} sur {totalSteps}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicateur de Progression (Pills) */}
            <div className="hidden sm:flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                    currentStep === step
                      ? 'w-7 bg-amber-400'
                      : currentStep > step
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-slate-200 dark:bg-slate-700'
                  }`}
                  title={`Étape ${step}`}
                />
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Passer le guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area according to Step */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Étape 1 : Bienvenue & Vision */}
          {currentStep === 1 && (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto flex items-center justify-center">
                <Lottie
                  src={welcomeLottie}
                  loop
                  autoplay
                  className="w-full h-full drop-shadow-lg"
                />
              </div>

              <div className="space-y-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-500 border border-amber-400/35 uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bienvenue dans votre Espace de Travail</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  L'Excellence au Service du Royaume
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
                  La plateforme de gestion du <strong>Ministère Esprit & Vie</strong> unifie la trésorerie ecclésiastique, le suivi démographique des cultes et la gouvernance pastorale avec une transparence absolue.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
                  <p className="text-xs font-black text-amber-500 mb-0.5">Rigueur & Clarté</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chaque franc CFA et chaque présence sont tracés en temps réel.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
                  <p className="text-xs font-black text-indigo-400 mb-0.5">Ségrégation Stricte</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Étanchéité totale entre les finances et le protocole.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
                  <p className="text-xs font-black text-emerald-400 mb-0.5">Archivage Immuable</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Journal d’audit indélébile et certification des procès-verbaux.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2 : Rôle & Périmètre */}
          {currentStep === 2 && (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto flex items-center justify-center">
                <Lottie
                  src={roleLottie}
                  loop
                  autoplay
                  className="w-full h-full drop-shadow-lg"
                />
              </div>

              <div className="space-y-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/35 uppercase tracking-wider inline-block">
                  {roleInfo.badge}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Votre Mandat : {roleInfo.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
                  {roleInfo.mission}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-left space-y-1.5">
                <p className="text-xs font-black text-slate-900 dark:text-amber-400 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Votre périmètre d'action officiel :</span>
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {roleInfo.keyFeature}
                </p>
              </div>
            </div>
          )}

          {/* Étape 3 : Tableaux de Bord Dédiés */}
          {currentStep === 3 && (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto flex items-center justify-center">
                <Lottie
                  src={analyticsLottie}
                  loop
                  autoplay
                  className="w-full h-full drop-shadow-lg"
                />
              </div>

              <div className="space-y-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 uppercase tracking-wider inline-block">
                  Visibilité & Indicateurs en Temps Réel
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Un Tableau de Bord Pensé pour Vous
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
                  {roleInfo.dashboardText}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-left text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Actualisation dynamique et filtres calendaires</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                  Basculez à tout moment entre les vues : <em>Aujourd’hui, Cette semaine, Ce mois, Trimestre ou Année</em> selon le fuseau horaire <strong>Africa/Douala</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Étape 4 : Sécurité & Traçabilité */}
          {currentStep === 4 && (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto flex items-center justify-center">
                <Lottie
                  src={securityLottie}
                  loop
                  autoplay
                  className="w-full h-full drop-shadow-lg"
                />
              </div>

              <div className="space-y-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/35 uppercase tracking-wider inline-block">
                  Sécurité Écclésiastique Renforcée
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Confidentialité & Double Contrôle
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
                  Le système intègre le principe de moindre privilège (RBAC). Aucune manipulation sensible n'échappe à la traçabilité.
                </p>
              </div>

              <div className="space-y-2 text-left text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>
                    <strong>Isolation étanche :</strong> Le protocole est 100% aveugle aux montants financiers.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>
                    <strong>Pas d'auto-approbation :</strong> Le caissier ne peut pas valider ses propres décaissements.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Étape 5 : Flux & Procédures */}
          {currentStep === 5 && (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto flex items-center justify-center">
                <Lottie
                  src={workflowLottie}
                  loop
                  autoplay
                  className="w-full h-full drop-shadow-lg"
                />
              </div>

              <div className="space-y-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/35 uppercase tracking-wider inline-block">
                  Procédures & Livrables Officiels
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Clôtures & Rapports Certifiés
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
                  {roleInfo.workflowText}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-left text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white mb-1">
                  Exports aux formats institutionnels :
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Génération de PDF certifiés avec blocs de signature légale et export de fichiers CSV pour les archives de l’église.
                </p>
              </div>
            </div>
          )}

          {/* Étape 6 : Prêt à Servir */}
          {currentStep === 6 && (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto flex items-center justify-center">
                <Lottie
                  src={celebrationLottie}
                  loop
                  autoplay
                  className="w-full h-full drop-shadow-lg"
                />
              </div>

              <div className="space-y-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-500 border border-amber-400/35 uppercase tracking-wider inline-block">
                  Tout est Prêt !
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Que le Seigneur Bénisse Votre Service
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
                  Votre espace personnalisé est configuré. Vous pouvez rouvrir ce guide à tout moment depuis le menu de votre profil en haut à droite.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/25 italic text-xs text-amber-600 dark:text-amber-400 font-semibold">
                « Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes. » — Colossiens 3:23
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-[#16214A]/80 flex items-center justify-between bg-slate-50/50 dark:bg-[#091338]/50">
          <div>
            {currentStep > 1 ? (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#16214A] border border-slate-200 dark:border-[#223366] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Passer l'introduction
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
            >
              <span>{currentStep === totalSteps ? 'Accéder à la Plateforme' : 'Suivant'}</span>
              {currentStep === totalSteps ? (
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
