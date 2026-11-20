import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, Coins, KeyRound, ShieldCheck, Sparkles, UserCog } from 'lucide-react';
import { api, formatApiError } from '../../services/api';
import { usePlatform } from '../../context/PlatformContext';
import { Field, inputClass, primaryButton, secondaryButton } from '../../components/platform/ui';

/**
 * Assistant de première installation : crée l'administrateur de la plateforme et l'identité de l'église.
 * Disponible uniquement tant qu'aucun administrateur plateforme n'existe.
 */

type Step = 0 | 1 | 2 | 3;

const STEPS = [
  { title: 'Sécurité', icon: KeyRound },
  { title: 'Église', icon: Building2 },
  { title: 'Monnaie', icon: Coins },
  { title: 'Administrateur', icon: UserCog },
];

const CURRENCIES = [
  { code: 'XAF', label: 'FCFA', words: 'francs CFA', name: 'Franc CFA (CEMAC)' },
  { code: 'XOF', label: 'FCFA', words: 'francs CFA', name: 'Franc CFA (UEMOA)' },
  { code: 'CDF', label: 'FC', words: 'francs congolais', name: 'Franc congolais' },
  { code: 'EUR', label: '€', words: 'euros', name: 'Euro' },
  { code: 'USD', label: '$', words: 'dollars', name: 'Dollar américain' },
  { code: 'GNF', label: 'GNF', words: 'francs guinéens', name: 'Franc guinéen' },
];

export const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const { refresh, platform } = usePlatform();
  const [step, setStep] = useState<Step>(0);
  const [status, setStatus] = useState<{ tokenRequired: boolean; tokenConfigured: boolean; mailConfigured: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const [token, setToken] = useState('');
  const [ministry, setMinistry] = useState({
    name: '',
    headquarters: '',
    postalBox: '',
    phone: '',
    email: '',
    website: '',
    mainPastor: '',
    venueCapacity: 0,
  });
  const [shortName, setShortName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('XAF');
  const [admin, setAdmin] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

  useEffect(() => {
    api
      .getSetupStatus()
      .then((s) => {
        if (!s.setupRequired) navigate('/login', { replace: true });
        setStatus(s);
        if (!s.tokenRequired) setStep(1);
      })
      .catch((err) => toast.error('Serveur injoignable', { description: err.message }));
  }, [navigate]);

  // Identité déjà connue (installation existante remise à zéro) : pré-remplissage
  useEffect(() => {
    if (platform.name && platform.name !== 'Gestion d’église') setMinistry((m) => (m.name ? m : { ...m, name: platform.name }));
  }, [platform.name]);

  useEffect(() => {
    if (!platform.setupRequired && done === null && status) navigate('/login', { replace: true });
  }, [platform.setupRequired, done, status, navigate]);

  const currency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  const canNext = () => {
    if (step === 0) return token.trim().length >= 8;
    if (step === 1) return ministry.name.trim().length >= 2;
    if (step === 2) return true;
    return (
      admin.name.trim().length >= 2 &&
      /\S+@\S+\.\S+/.test(admin.email) &&
      admin.password.length >= 10 &&
      admin.password === admin.confirm
    );
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.runSetup({
        token: token.trim(),
        admin: { name: admin.name.trim(), email: admin.email.trim().toLowerCase(), phone: admin.phone.trim(), password: admin.password },
        ministry: { ...ministry, name: ministry.name.trim() },
        platform: {
          branding: { shortName: shortName.trim() },
          locale: { currencyCode: currency.code, currencyLabel: currency.label, currencyWords: currency.words },
        },
      });
      setDone(admin.email.trim().toLowerCase());
      toast.success('Installation terminée', { description: 'Connectez-vous avec le compte administrateur que vous venez de créer.', duration: 8000 });
      await refresh();
    } catch (err: any) {
      toast.error('Installation impossible', { description: err?.data ? formatApiError(err.data) : err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const setM = (k: keyof typeof ministry) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setMinistry((m) => ({ ...m, [k]: k === 'venueCapacity' ? Math.max(0, parseInt(e.target.value || '0', 10) || 0) : e.target.value }));
  const setA = (k: keyof typeof admin) => (e: React.ChangeEvent<HTMLInputElement>) => setAdmin((a) => ({ ...a, [k]: e.target.value }));

  if (done) {
    return (
      <Shell>
        <div className="text-center space-y-5 py-6">
          <span className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Installation terminée</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
              Le compte administrateur de la plateforme <strong className="text-slate-800 dark:text-slate-200">{done}</strong> est créé.
              Connectez-vous pour terminer la configuration : couleurs, ventilation des recettes, compartiments, cultes et utilisateurs.
            </p>
          </div>
          <button className={primaryButton} onClick={() => navigate('/login', { replace: true })}>
            Se connecter <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </Shell>
    );
  }

  const visibleSteps = status?.tokenRequired ? STEPS : STEPS.slice(1);
  const visibleIndex = status?.tokenRequired ? step : step - 1;

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Première installation
          </p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Configurer la plateforme pour votre église</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quelques étapes. Tout reste modifiable ensuite depuis la console d’administration.
          </p>
        </div>

        <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${visibleSteps.length}, minmax(0, 1fr))` }}>
          {visibleSteps.map((s, i) => {
            const Icon = s.icon;
            const state = i < visibleIndex ? 'done' : i === visibleIndex ? 'current' : 'todo';
            return (
              <li
                key={s.title}
                className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-bold ${
                  state === 'current'
                    ? 'border-amber-400 bg-amber-400/10 text-slate-900 dark:text-white'
                    : state === 'done'
                      ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-[#16214A] text-slate-400'
                }`}
              >
                {state === 'done' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Icon className="w-4 h-4 shrink-0" />}
                <span className="truncate">{s.title}</span>
              </li>
            );
          })}
        </ol>

        {step === 0 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-sm text-slate-700 dark:text-slate-300 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p>
                Pour empêcher qu’un inconnu s’approprie l’installation, saisissez le <strong>jeton d’installation</strong> défini par la
                personne qui a déployé le serveur (variable <code className="font-mono text-xs">SETUP_TOKEN</code> de l’API).
              </p>
            </div>
            {status && !status.tokenConfigured && (
              <p className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold">
                Aucun jeton n’est encore défini sur le serveur : ajoutez SETUP_TOKEN aux variables d’environnement de l’API puis redémarrez-la.
              </p>
            )}
            <Field label="Jeton d’installation" htmlFor="setup-token">
              <input id="setup-token" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nom officiel de l’église *" htmlFor="m-name" className="sm:col-span-2">
              <input id="m-name" value={ministry.name} onChange={setM('name')} placeholder="Ex : Église Évangélique de la Grâce" className={inputClass} />
            </Field>
            <Field label="Nom court (menus, onglet)" htmlFor="m-short" hint="Facultatif. Ex : EEG">
              <input id="m-short" value={shortName} onChange={(e) => setShortName(e.target.value)} maxLength={40} className={inputClass} />
            </Field>
            <Field label="Pasteur principal" htmlFor="m-pastor">
              <input id="m-pastor" value={ministry.mainPastor} onChange={setM('mainPastor')} className={inputClass} />
            </Field>
            <Field label="Siège (ville, quartier)" htmlFor="m-hq">
              <input id="m-hq" value={ministry.headquarters} onChange={setM('headquarters')} className={inputClass} />
            </Field>
            <Field label="Boîte postale" htmlFor="m-bp">
              <input id="m-bp" value={ministry.postalBox} onChange={setM('postalBox')} className={inputClass} />
            </Field>
            <Field label="Téléphone" htmlFor="m-phone">
              <input id="m-phone" type="tel" value={ministry.phone} onChange={setM('phone')} className={inputClass} />
            </Field>
            <Field label="Email officiel" htmlFor="m-email">
              <input id="m-email" type="email" value={ministry.email} onChange={setM('email')} className={inputClass} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Monnaie utilisée pour les montants, les reçus et les rapports.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CURRENCIES.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => setCurrencyCode(c.code)}
                  className={`text-left p-4 rounded-2xl border transition ${
                    c.code === currencyCode ? 'border-amber-400 bg-amber-400/10' : 'border-slate-200 dark:border-[#16214A] hover:bg-slate-50 dark:hover:bg-[#0F1A3A]'
                  }`}
                >
                  <span className="block text-sm font-black text-slate-900 dark:text-white">{c.name}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {c.code} · 150 000 {c.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              La règle de ventilation des recettes (par défaut 80 % fonds général, 10 % dîme des dîmes, 10 % aide sociale) se règle ensuite dans la console.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p className="sm:col-span-2 text-sm text-slate-500 dark:text-slate-400">
              Ce compte administre toute la plateforme : configuration, utilisateurs, données. Gardez son mot de passe en lieu sûr.
            </p>
            <Field label="Nom complet *" htmlFor="a-name">
              <input id="a-name" value={admin.name} onChange={setA('name')} autoComplete="name" className={inputClass} />
            </Field>
            <Field label="Email de connexion *" htmlFor="a-email">
              <input id="a-email" type="email" value={admin.email} onChange={setA('email')} autoComplete="email" className={inputClass} />
            </Field>
            <Field label="Mot de passe *" htmlFor="a-pass" hint="10 caractères minimum">
              <input id="a-pass" type="password" value={admin.password} onChange={setA('password')} autoComplete="new-password" className={inputClass} />
            </Field>
            <Field label="Confirmer le mot de passe *" htmlFor="a-confirm">
              <input id="a-confirm" type="password" value={admin.confirm} onChange={setA('confirm')} autoComplete="new-password" className={inputClass} />
              {admin.confirm && admin.confirm !== admin.password && <p className="text-xs text-rose-500 mt-1 font-semibold">Les mots de passe diffèrent.</p>}
            </Field>
            <Field label="Téléphone" htmlFor="a-phone">
              <input id="a-phone" type="tel" value={admin.phone} onChange={setA('phone')} className={inputClass} />
            </Field>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-[#16214A]">
          <button
            type="button"
            className={secondaryButton}
            onClick={() => setStep((s) => Math.max(status?.tokenRequired ? 0 : 1, s - 1) as Step)}
            disabled={step === (status?.tokenRequired ? 0 : 1) || submitting}
          >
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>
          {step < 3 ? (
            <button type="button" className={primaryButton} disabled={!canNext()} onClick={() => setStep((s) => (s + 1) as Step)}>
              Continuer <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" className={primaryButton} disabled={!canNext() || submitting} onClick={submit}>
              {submitting ? 'Installation…' : 'Terminer l’installation'}
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] dark:bg-[#060D24]">
    <div className="w-full max-w-2xl bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-xl p-6 md:p-9">
      {children}
    </div>
  </div>
);
