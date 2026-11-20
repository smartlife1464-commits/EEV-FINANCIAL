import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Blocks,
  Building2,
  CalendarRange,
  Coins,
  Database,
  Download,
  FileJson,
  HardDriveDownload,
  Layers,
  Palette,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  Users,
  Wallet,
} from 'lucide-react';
import { api, formatApiError, PlatformRefKind } from '../../services/api';
import { usePlatform, DEFAULT_ROLE_LABELS } from '../../context/PlatformContext';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_MINISTRY, MinistrySettings } from '../../hooks/useMinistry';
import { formatNumber, timeAgo } from '../../utils/formatters';
import { Badge, Card, Field, Toggle, dangerButton, inputClass, primaryButton, readImageFile, secondaryButton } from '../../components/platform/ui';

/**
 * Console de l'administrateur de la plateforme : adapte l'installation à une église sans toucher au code.
 */

type Tab = 'identity' | 'finance' | 'reference' | 'roles' | 'modules' | 'profile' | 'data';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'identity', label: 'Identité & apparence', icon: Palette },
  { key: 'finance', label: 'Monnaie & ventilation', icon: Coins },
  { key: 'reference', label: 'Référentiels', icon: Layers },
  { key: 'roles', label: 'Rôles & accès', icon: ShieldCheck },
  { key: 'modules', label: 'Modules', icon: Blocks },
  { key: 'profile', label: 'Profil d’église', icon: FileJson },
  { key: 'data', label: 'Données & système', icon: Database },
];

const errMsg = (err: any) => (err?.data ? formatApiError(err.data) : err?.message || 'Erreur');

export const PlatformConsole: React.FC = () => {
  const [tab, setTab] = useState<Tab>('identity');
  const { data, isLoading, error } = useQuery({ queryKey: ['platform-config'], queryFn: () => api.getPlatformConfig() });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-[#0C1530] text-white border border-[#16214A] shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Administration de la plateforme
        </p>
        <h1 className="text-xl md:text-2xl font-black mt-1">Configuration de l’installation</h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl">
          Adaptez la plateforme à votre église : identité, couleurs, monnaie, ventilation des recettes, compartiments, cultes, rôles et modules.
          Exportez un profil pour reproduire cette configuration dans une autre église.
        </p>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" aria-label="Sections de la console">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap border transition ${
                active
                  ? 'bg-amber-400 border-amber-400 text-slate-950'
                  : 'bg-white dark:bg-[#0C1530] border-slate-200 dark:border-[#16214A] text-slate-600 dark:text-slate-300 hover:border-amber-400'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </nav>

      {isLoading && <div className="h-40 rounded-3xl bg-slate-200/60 dark:bg-[#0C1530] animate-pulse" />}
      {error && <p className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 font-semibold">{errMsg(error)}</p>}
      {data && (
        <>
          {tab === 'identity' && <IdentityTab config={data.config} ministry={data.ministry} />}
          {tab === 'finance' && <FinanceTab config={data.config} />}
          {tab === 'reference' && <ReferenceTab />}
          {tab === 'roles' && <RolesTab config={data.config} />}
          {tab === 'modules' && <ModulesTab config={data.config} labels={data.moduleLabels} />}
          {tab === 'profile' && <ProfileTab />}
          {tab === 'data' && <DataTab ministryName={data.ministry?.name || ''} />}
        </>
      )}
    </div>
  );
};

/** Enregistrement d'une section de configuration + rafraîchissement global */
function useSaveConfig() {
  const queryClient = useQueryClient();
  const { refresh } = usePlatform();
  return useMutation({
    mutationFn: (patch: any) => api.updatePlatformConfig(patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform-config'] });
      await refresh();
      toast.success('Configuration enregistrée');
    },
    onError: (err: any) => toast.error('Enregistrement refusé', { description: errMsg(err) }),
  });
}

// -----------------------------------------------------------------------------
// Identité & apparence
// -----------------------------------------------------------------------------
const COLOR_PRESETS = ['#FFBC00', '#2563EB', '#7C3AED', '#059669', '#DC2626', '#EA580C', '#0891B2', '#DB2777'];

const IdentityTab: React.FC<{ config: any; ministry: MinistrySettings }> = ({ config, ministry }) => {
  const queryClient = useQueryClient();
  const { refresh } = usePlatform();
  const saveConfig = useSaveConfig();
  const [form, setForm] = useState<MinistrySettings>({ ...DEFAULT_MINISTRY, ...ministry });
  const [branding, setBranding] = useState({ ...config.branding });
  const fileRef = useRef<HTMLInputElement>(null);

  const saveIdentity = useMutation({
    mutationFn: async () => {
      await api.updateSettings(form);
      await api.updatePlatformConfig({ branding });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform-config'] });
      await queryClient.invalidateQueries({ queryKey: ['ministry-settings'] });
      await refresh();
      toast.success('Identité et apparence enregistrées');
    },
    onError: (err: any) => toast.error('Enregistrement refusé', { description: errMsg(err) }),
  });

  const set = (k: keyof MinistrySettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === 'venueCapacity' ? Math.max(0, parseInt(e.target.value || '0', 10) || 0) : e.target.value }));

  const onLogo = async (file?: File) => {
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      setBranding((b: any) => ({ ...b, logo: dataUrl }));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        <Card title="Identité officielle" description="Affichée sur l’écran de connexion, les reçus, les bons de caisse, les PV et les rapports." icon={Building2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nom officiel *" htmlFor="id-name" className="md:col-span-2">
              <input id="id-name" value={form.name} onChange={set('name')} className={inputClass} />
            </Field>
            <Field label="Nom court" htmlFor="id-short" hint="Menus et onglet du navigateur">
              <input id="id-short" value={branding.shortName} maxLength={40} onChange={(e) => setBranding((b: any) => ({ ...b, shortName: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Devise / slogan" htmlFor="id-tagline">
              <input id="id-tagline" value={branding.tagline} maxLength={140} onChange={(e) => setBranding((b: any) => ({ ...b, tagline: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Pasteur principal" htmlFor="id-pastor">
              <input id="id-pastor" value={form.mainPastor} onChange={set('mainPastor')} className={inputClass} />
            </Field>
            <Field label="Siège" htmlFor="id-hq">
              <input id="id-hq" value={form.headquarters} onChange={set('headquarters')} className={inputClass} />
            </Field>
            <Field label="Boîte postale" htmlFor="id-bp">
              <input id="id-bp" value={form.postalBox} onChange={set('postalBox')} className={inputClass} />
            </Field>
            <Field label="Téléphone" htmlFor="id-phone">
              <input id="id-phone" value={form.phone} onChange={set('phone')} className={inputClass} />
            </Field>
            <Field label="Email" htmlFor="id-email">
              <input id="id-email" type="email" value={form.email} onChange={set('email')} className={inputClass} />
            </Field>
            <Field label="Site web" htmlFor="id-web">
              <input id="id-web" value={form.website} onChange={set('website')} className={inputClass} />
            </Field>
            <Field label="Capacité de la salle (places)" htmlFor="id-cap" hint="0 = taux d’occupation non suivi">
              <input id="id-cap" type="number" min={0} value={form.venueCapacity || ''} onChange={set('venueCapacity')} className={inputClass} />
            </Field>
          </div>
        </Card>

        <Card title="Apparence" description="Logo et couleurs appliqués à l’application web et mobile." icon={Palette}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Logo</span>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border border-dashed border-slate-300 dark:border-[#16214A] flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#070D22]">
                  {branding.logo ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" /> : <Building2 className="w-8 h-8 text-slate-400" />}
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" className={secondaryButton} onClick={() => fileRef.current?.click()}>
                    <Upload className="w-4 h-4" /> Choisir une image
                  </button>
                  {branding.logo && (
                    <button type="button" className="text-xs font-bold text-rose-500 text-left" onClick={() => setBranding((b: any) => ({ ...b, logo: '' }))}>
                      Retirer le logo
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
                  <span className="text-[11px] text-slate-500">PNG, SVG ou WebP — 400 Ko maximum</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {(['primaryColor', 'secondaryColor'] as const).map((key) => (
                <div key={key}>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    {key === 'primaryColor' ? 'Couleur principale' : 'Couleur secondaire (fonds sombres)'}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {(key === 'primaryColor' ? COLOR_PRESETS : ['#091338', '#0F172A', '#1E1B4B', '#052E16', '#3B0764', '#111827']).map((c) => (
                      <button
                        type="button"
                        key={c}
                        aria-label={`Couleur ${c}`}
                        onClick={() => setBranding((b: any) => ({ ...b, [key]: c }))}
                        className={`w-8 h-8 rounded-full border-2 ${branding[key].toUpperCase() === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                        style={{ background: c }}
                      />
                    ))}
                    <input
                      type="color"
                      aria-label="Couleur personnalisée"
                      value={branding[key]}
                      onChange={(e) => setBranding((b: any) => ({ ...b, [key]: e.target.value.toUpperCase() }))}
                      className="w-9 h-9 rounded-lg bg-transparent cursor-pointer"
                    />
                    <code className="text-xs font-mono text-slate-500">{branding[key]}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <button className={primaryButton} disabled={saveIdentity.isPending || form.name.trim().length < 2} onClick={() => saveIdentity.mutate()}>
            <Save className="w-4 h-4" /> {saveIdentity.isPending ? 'Enregistrement…' : 'Enregistrer l’identité et l’apparence'}
          </button>
        </div>
      </div>

      <Card title="Aperçu" description="Écran de connexion">
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-[#16214A]">
          <div className="p-6 text-white text-center space-y-3" style={{ background: branding.secondaryColor }}>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
              {branding.logo ? <img src={branding.logo} alt="" className="w-full h-full object-contain" /> : <Building2 className="w-7 h-7" />}
            </div>
            <p className="font-black text-lg leading-tight">{form.name || 'Nom de l’église'}</p>
            {branding.tagline && <p className="text-xs opacity-80">{branding.tagline}</p>}
          </div>
          <div className="p-5 space-y-3 bg-white dark:bg-[#070D22]">
            <div className="h-9 rounded-xl bg-slate-100 dark:bg-[#0C1530]" />
            <div className="h-9 rounded-xl bg-slate-100 dark:bg-[#0C1530]" />
            <div className="h-10 rounded-xl flex items-center justify-center text-sm font-black text-slate-950" style={{ background: branding.primaryColor }}>
              Se connecter
            </div>
          </div>
        </div>
        {saveConfig.isPending && <p className="text-xs text-slate-500 mt-2">Enregistrement…</p>}
      </Card>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Monnaie & ventilation
// -----------------------------------------------------------------------------
const FinanceTab: React.FC<{ config: any }> = ({ config }) => {
  const save = useSaveConfig();
  const { data: ref } = useQuery({ queryKey: ['platform-reference'], queryFn: () => api.getPlatformReference() });
  const [locale, setLocale] = useState({ ...config.locale });
  const [split, setSplit] = useState<{ fundCode: string; percentage: number; label: string }[]>(config.finance.split);
  const [remainder, setRemainder] = useState<string>(config.finance.remainderFund);
  const [example, setExample] = useState(100000);

  const funds = (ref?.funds || []).filter((f: any) => f.kind !== 'campaign' && f.is_active);
  const total = split.reduce((s, l) => s + (Number(l.percentage) || 0), 0);
  const codes = split.map((l) => l.fundCode);
  const duplicate = codes.length !== new Set(codes).size;
  const valid = total === 100 && !duplicate && codes.includes(remainder) && split.every((l) => l.fundCode);

  const preview = useMemo(() => {
    if (!valid) return [];
    const others = split.filter((l) => l.fundCode !== remainder).map((l) => ({ ...l, amount: Math.floor((example * l.percentage) / 100) }));
    const rest = example - others.reduce((s, l) => s + l.amount, 0);
    const r = split.find((l) => l.fundCode === remainder)!;
    return [...others, { ...r, amount: rest }];
  }, [split, remainder, example, valid]);

  const fundName = (code: string) => funds.find((f: any) => f.code === code)?.name || code;

  return (
    <div className="space-y-6">
      <Card title="Monnaie" description="Utilisée pour tous les montants, les reçus (montant en lettres) et les rapports." icon={Coins}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Code ISO" htmlFor="cur-code" hint="Ex : XAF, XOF, CDF, EUR">
            <input id="cur-code" value={locale.currencyCode} maxLength={3} onChange={(e) => setLocale((l: any) => ({ ...l, currencyCode: e.target.value.toUpperCase() }))} className={inputClass} />
          </Field>
          <Field label="Symbole affiché" htmlFor="cur-label" hint="Ex : FCFA, €, FC">
            <input id="cur-label" value={locale.currencyLabel} maxLength={12} onChange={(e) => setLocale((l: any) => ({ ...l, currencyLabel: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="En toutes lettres (pluriel)" htmlFor="cur-words" hint="Ex : francs CFA, euros">
            <input id="cur-words" value={locale.currencyWords} maxLength={40} onChange={(e) => setLocale((l: any) => ({ ...l, currencyWords: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Pays" htmlFor="cur-country">
            <input id="cur-country" value={locale.country} onChange={(e) => setLocale((l: any) => ({ ...l, country: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Ville" htmlFor="cur-city">
            <input id="cur-city" value={locale.city} onChange={(e) => setLocale((l: any) => ({ ...l, city: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Fuseau horaire" htmlFor="cur-tz" hint="Ex : Africa/Douala, Africa/Abidjan">
            <input id="cur-tz" value={locale.timezone} onChange={(e) => setLocale((l: any) => ({ ...l, timezone: e.target.value }))} className={inputClass} />
          </Field>
        </div>
        <div className="flex justify-end mt-5">
          <button className={primaryButton} disabled={save.isPending} onClick={() => save.mutate({ locale })}>
            <Save className="w-4 h-4" /> Enregistrer la monnaie
          </button>
        </div>
      </Card>

      <Card
        title="Ventilation des recettes ordinaires"
        description="Appliquée automatiquement à chaque recette dont la catégorie suit la « ventilation standard » (dîmes, offrandes…). Les dons affectés vont à 100 % dans leur compartiment. Les recettes déjà enregistrées ne sont pas modifiées."
        icon={Wallet}
      >
        <div className="space-y-3">
          {split.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 rounded-2xl border border-slate-200 dark:border-[#16214A]">
              <select
                aria-label="Compartiment"
                value={line.fundCode}
                onChange={(e) => setSplit((s) => s.map((l, j) => (j === i ? { ...l, fundCode: e.target.value } : l)))}
                className={`${inputClass} col-span-12 sm:col-span-4`}
              >
                <option value="">Choisir un compartiment…</option>
                {funds.map((f: any) => (
                  <option key={f.code} value={f.code}>
                    {f.name}
                  </option>
                ))}
              </select>
              <input
                aria-label="Libellé"
                placeholder="Libellé (facultatif)"
                value={line.label}
                onChange={(e) => setSplit((s) => s.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))}
                className={`${inputClass} col-span-12 sm:col-span-3`}
              />
              <div className="col-span-5 sm:col-span-2 relative">
                <input
                  aria-label="Pourcentage"
                  type="number"
                  min={0}
                  max={100}
                  value={line.percentage}
                  onChange={(e) => setSplit((s) => s.map((l, j) => (j === i ? { ...l, percentage: Math.max(0, Math.min(100, parseInt(e.target.value || '0', 10) || 0)) } : l)))}
                  className={`${inputClass} pr-8`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
              </div>
              <label className="col-span-5 sm:col-span-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <input type="radio" name="remainder" checked={remainder === line.fundCode && !!line.fundCode} onChange={() => setRemainder(line.fundCode)} />
                Reliquat
              </label>
              <button
                type="button"
                aria-label="Retirer la ligne"
                className="col-span-2 sm:col-span-1 justify-self-end p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 disabled:opacity-30"
                disabled={split.length <= 1}
                onClick={() => setSplit((s) => s.filter((_, j) => j !== i))}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" className={secondaryButton} onClick={() => setSplit((s) => [...s, { fundCode: '', percentage: 0, label: '' }])}>
              <Plus className="w-4 h-4" /> Ajouter un compartiment
            </button>
            <span className={`text-sm font-black ${total === 100 ? 'text-emerald-600' : 'text-rose-500'}`}>Total : {total} %</span>
          </div>
          {duplicate && <p className="text-xs font-semibold text-rose-500">Un compartiment apparaît deux fois.</p>}
          {!codes.includes(remainder) && <p className="text-xs font-semibold text-rose-500">Choisissez le compartiment qui reçoit le reliquat (arrondis).</p>}
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Simulation pour</span>
            <input
              aria-label="Montant de simulation"
              type="number"
              min={0}
              value={example}
              onChange={(e) => setExample(Math.max(0, parseInt(e.target.value || '0', 10) || 0))}
              className={`${inputClass} w-40`}
            />
            <span className="text-sm font-bold text-slate-500">{locale.currencyLabel}</span>
          </div>
          {valid ? (
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {preview.map((l) => (
                <li key={l.fundCode} className="p-3 rounded-xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A]">
                  <span className="block text-xs text-slate-500">
                    {l.label || fundName(l.fundCode)} · {l.percentage} %{l.fundCode === remainder ? ' · reliquat' : ''}
                  </span>
                  <span className="block text-base font-black text-slate-900 dark:text-white">
                    {formatNumber(l.amount)} {locale.currencyLabel}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Corrigez la règle pour voir la simulation.</p>
          )}
        </div>

        <div className="flex justify-end mt-5">
          <button className={primaryButton} disabled={!valid || save.isPending} onClick={() => save.mutate({ finance: { split, remainderFund: remainder } })}>
            <Save className="w-4 h-4" /> Enregistrer la ventilation
          </button>
        </div>
      </Card>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Référentiels : compartiments, catégories, types de culte
// -----------------------------------------------------------------------------
type RefSection = 'funds' | 'revenue' | 'expense' | 'services';

const ReferenceTab: React.FC = () => {
  const [section, setSection] = useState<RefSection>('funds');
  const { data, isLoading } = useQuery({ queryKey: ['platform-reference'], queryFn: () => api.getPlatformReference() });
  const sections: { key: RefSection; label: string; icon: React.ElementType }[] = [
    { key: 'funds', label: 'Compartiments de caisse', icon: Wallet },
    { key: 'revenue', label: 'Catégories de recettes', icon: Coins },
    { key: 'expense', label: 'Catégories de dépenses', icon: Layers },
    { key: 'services', label: 'Types de culte', icon: CalendarRange },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border ${
                section === s.key ? 'border-amber-400 bg-amber-400/10 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-[#16214A] text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" /> {s.label}
            </button>
          );
        })}
      </div>
      {isLoading || !data ? (
        <div className="h-40 rounded-3xl bg-slate-200/60 dark:bg-[#0C1530] animate-pulse" />
      ) : (
        <>
          {section === 'funds' && <FundsSection data={data} />}
          {section === 'revenue' && <RevenueSection data={data} />}
          {section === 'expense' && <ExpenseSection data={data} />}
          {section === 'services' && <ServicesSection data={data} />}
        </>
      )}
    </div>
  );
};

function useRefMutations(kind: PlatformRefKind) {
  const queryClient = useQueryClient();
  const done = async (msg: string) => {
    await queryClient.invalidateQueries({ queryKey: ['platform-reference'] });
    await queryClient.invalidateQueries();
    toast.success(msg);
  };
  const create = useMutation({
    mutationFn: (d: any) => api.createPlatformItem(kind, d),
    onSuccess: () => done('Élément ajouté'),
    onError: (err: any) => toast.error('Ajout refusé', { description: errMsg(err) }),
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updatePlatformItem(kind, id, data),
    onSuccess: () => done('Modification enregistrée'),
    onError: (err: any) => toast.error('Modification refusée', { description: errMsg(err) }),
  });
  return { create, update };
}

/** Nom modifiable en place (validation à la sortie du champ) */
const InlineName: React.FC<{ value: string; onSave: (v: string) => void }> = ({ value, onSave }) => {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input
      aria-label="Nom"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v.trim().length >= 2 && v !== value && onSave(v.trim())}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="w-full bg-transparent font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400 rounded-lg px-2 py-1"
    />
  );
};

const RowShell: React.FC<{ children: React.ReactNode; inactive?: boolean }> = ({ children, inactive }) => (
  <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-[#16214A] ${inactive ? 'opacity-60' : ''}`}>{children}</div>
);

const ActiveSwitch: React.FC<{ active: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ active, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!active)}
    className={`px-3 py-1.5 rounded-xl text-xs font-black border whitespace-nowrap disabled:opacity-40 ${
      active ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : 'border-slate-300 dark:border-[#16214A] text-slate-500'
    }`}
  >
    {active ? 'Actif' : 'Inactif'}
  </button>
);

const FundsSection: React.FC<{ data: any }> = ({ data }) => {
  const { create, update } = useRefMutations('funds');
  const [form, setForm] = useState({ code: '', name: '', description: '', is_restricted: true });
  const funds = data.funds.filter((f: any) => f.kind !== 'campaign');
  return (
    <Card
      title="Compartiments de caisse"
      description="Subdivisions analytiques de la caisse unique. Le compartiment GENERAL (fonctionnement) est réservé. Les quêtes spontanées se créent depuis les finances."
      icon={Wallet}
    >
      <div className="space-y-2">
        {funds.map((f: any) => (
          <RowShell key={f.id} inactive={!f.is_active}>
            <code className="text-[11px] font-mono text-slate-500 sm:w-44 shrink-0">{f.code}</code>
            <div className="flex-1 min-w-0">
              <InlineName value={f.name} onSave={(name) => update.mutate({ id: f.id, data: { name } })} />
            </div>
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Solde {formatNumber(f.current_balance)}</span>
            {f.code === data.operatingFund ? <Badge tone="brand">Fonctionnement</Badge> : f.is_restricted ? <Badge>Affecté</Badge> : <Badge tone="success">Libre</Badge>}
            <ActiveSwitch active={f.is_active} disabled={f.code === data.operatingFund} onChange={(v) => update.mutate({ id: f.id, data: { is_active: v } })} />
          </RowShell>
        ))}
      </div>
      <form
        className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22]"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(form, { onSuccess: () => setForm({ code: '', name: '', description: '', is_restricted: true }) });
        }}
      >
        <input aria-label="Code" placeholder="CODE (ex : MISSIONS)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })} className={`${inputClass} md:col-span-3`} required />
        <input aria-label="Nom" placeholder="Nom du compartiment" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputClass} md:col-span-4`} required />
        <label className="md:col-span-3 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={form.is_restricted} onChange={(e) => setForm({ ...form, is_restricted: e.target.checked })} />
          Fonds affecté (usage réservé)
        </label>
        <button className={`${primaryButton} md:col-span-2`} disabled={create.isPending}>
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </form>
    </Card>
  );
};

const RevenueSection: React.FC<{ data: any }> = ({ data }) => {
  const { create, update } = useRefMutations('revenue-categories');
  const funds = data.funds.filter((f: any) => f.is_active);
  const [form, setForm] = useState({ code: '', name: '', allocation_rule: 'standard_split_80_10_10', target_fund: '' });
  return (
    <Card
      title="Catégories de recettes"
      description="« Ventilation standard » : la recette est répartie selon la règle de l’onglet Monnaie & ventilation. « Affectation directe » : 100 % dans le compartiment choisi."
      icon={Coins}
    >
      <div className="space-y-2">
        {data.revenueCategories.map((c: any) => (
          <RowShell key={c.id} inactive={!c.is_active}>
            <code className="text-[11px] font-mono text-slate-500 sm:w-44 shrink-0">{c.code}</code>
            <div className="flex-1 min-w-0">
              <InlineName value={c.name} onSave={(name) => update.mutate({ id: c.id, data: { name } })} />
            </div>
            {c.allocation_rule === 'direct_allocated' ? (
              <select
                aria-label="Compartiment cible"
                value={c.target_fund}
                onChange={(e) => update.mutate({ id: c.id, data: { target_fund: e.target.value } })}
                className={`${inputClass} sm:w-56`}
              >
                {funds.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    100 % → {f.name}
                  </option>
                ))}
              </select>
            ) : (
              <Badge tone="brand">Ventilation standard</Badge>
            )}
            <ActiveSwitch active={c.is_active} onChange={(v) => update.mutate({ id: c.id, data: { is_active: v } })} />
          </RowShell>
        ))}
      </div>
      <form
        className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22]"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(form, { onSuccess: () => setForm({ code: '', name: '', allocation_rule: 'standard_split_80_10_10', target_fund: '' }) });
        }}
      >
        <input aria-label="Code" placeholder="code (ex : thanksgiving)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className={`${inputClass} md:col-span-2`} required />
        <input aria-label="Nom" placeholder="Nom (ex : Actions de grâce)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputClass} md:col-span-3`} required />
        <select aria-label="Règle" value={form.allocation_rule} onChange={(e) => setForm({ ...form, allocation_rule: e.target.value })} className={`${inputClass} md:col-span-3`}>
          <option value="standard_split_80_10_10">Ventilation standard</option>
          <option value="direct_allocated">Affectation directe 100 %</option>
        </select>
        <select
          aria-label="Compartiment cible"
          value={form.target_fund}
          disabled={form.allocation_rule !== 'direct_allocated'}
          onChange={(e) => setForm({ ...form, target_fund: e.target.value })}
          className={`${inputClass} md:col-span-2`}
        >
          <option value="">Compartiment…</option>
          {funds.map((f: any) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button className={`${primaryButton} md:col-span-2`} disabled={create.isPending || (form.allocation_rule === 'direct_allocated' && !form.target_fund)}>
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </form>
    </Card>
  );
};

const ExpenseSection: React.FC<{ data: any }> = ({ data }) => {
  const { create, update } = useRefMutations('expense-categories');
  const [form, setForm] = useState({ code: '', name: '', type: 'variable' });
  return (
    <Card title="Catégories de dépenses" description="Charges fixes (loyer, eau…) et dépenses variables (transport, mission…)." icon={Layers}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {data.expenseCategories.map((c: any) => (
          <RowShell key={c.id} inactive={!c.is_active}>
            <div className="flex-1 min-w-0">
              <InlineName value={c.name} onSave={(name) => update.mutate({ id: c.id, data: { name } })} />
            </div>
            <Badge tone={c.type === 'fixed' ? 'brand' : 'muted'}>{c.type === 'fixed' ? 'Fixe' : 'Variable'}</Badge>
            <ActiveSwitch active={c.is_active} onChange={(v) => update.mutate({ id: c.id, data: { is_active: v } })} />
          </RowShell>
        ))}
      </div>
      <form
        className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22]"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(form, { onSuccess: () => setForm({ code: '', name: '', type: 'variable' }) });
        }}
      >
        <input aria-label="Code" placeholder="code (ex : sound)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className={`${inputClass} md:col-span-3`} required />
        <input aria-label="Nom" placeholder="Nom (ex : Sonorisation)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputClass} md:col-span-4`} required />
        <select aria-label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={`${inputClass} md:col-span-3`}>
          <option value="variable">Dépense variable</option>
          <option value="fixed">Charge fixe</option>
        </select>
        <button className={`${primaryButton} md:col-span-2`} disabled={create.isPending}>
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </form>
    </Card>
  );
};

const ServicesSection: React.FC<{ data: any }> = ({ data }) => {
  const { create, update } = useRefMutations('service-types');
  const [form, setForm] = useState({ slug: '', name: '' });
  return (
    <Card title="Types de culte et programmes" description="Proposés lors de la saisie des fiches de fréquentation et du programme des cultes." icon={CalendarRange}>
      <div className="space-y-2">
        {data.serviceTypes.map((t: any) => (
          <RowShell key={t.id} inactive={!t.is_active}>
            <input
              aria-label="Ordre"
              type="number"
              min={0}
              defaultValue={t.display_order}
              onBlur={(e) => {
                const v = parseInt(e.target.value || '0', 10) || 0;
                if (v !== t.display_order) update.mutate({ id: t.id, data: { display_order: v } });
              }}
              className={`${inputClass} sm:w-20`}
            />
            <div className="flex-1 min-w-0">
              <InlineName value={t.name} onSave={(name) => update.mutate({ id: t.id, data: { name } })} />
            </div>
            <code className="text-[11px] font-mono text-slate-500">{t.slug}</code>
            <ActiveSwitch active={t.is_active} onChange={(v) => update.mutate({ id: t.id, data: { is_active: v } })} />
          </RowShell>
        ))}
      </div>
      <form
        className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22]"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ ...form, display_order: data.serviceTypes.length + 1 }, { onSuccess: () => setForm({ slug: '', name: '' }) });
        }}
      >
        <input aria-label="Identifiant" placeholder="identifiant (ex : youth_service)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className={`${inputClass} md:col-span-4`} required />
        <input aria-label="Nom" placeholder="Nom (ex : Culte des jeunes)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputClass} md:col-span-6`} required />
        <button className={`${primaryButton} md:col-span-2`} disabled={create.isPending}>
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </form>
    </Card>
  );
};

// -----------------------------------------------------------------------------
// Rôles & accès
// -----------------------------------------------------------------------------
const ROLE_RIGHTS: Record<string, string> = {
  admin: 'Comptes utilisateurs, paramètres, toutes les données',
  lead_pastor: 'Vue d’ensemble, approbation des dépenses, rapports',
  finance_lead: 'Recettes, propositions de dépenses, trésorerie',
  cashier: 'Encaissement, paiement des dépenses approuvées, clôture',
  protocol_lead: 'Validation des fiches de fréquentation',
  protocol_agent: 'Comptage des cultes uniquement (aucune donnée financière)',
  auditor: 'Lecture seule des comptes et du journal d’audit',
};

const RolesTab: React.FC<{ config: any }> = ({ config }) => {
  const save = useSaveConfig();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [labels, setLabels] = useState<Record<string, string>>({ ...DEFAULT_ROLE_LABELS, ...config.roleLabels });
  const { data } = useQuery({ queryKey: ['platform-reference'], queryFn: () => api.getPlatformReference() });
  const toggleAdmin = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => api.setPlatformAdmin(id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-reference'] });
      toast.success('Droits mis à jour');
    },
    onError: (err: any) => toast.error('Modification refusée', { description: errMsg(err) }),
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card title="Libellés des rôles" description="Adaptez les intitulés au vocabulaire de l’église. Les droits de chaque rôle restent identiques (séparation des fonctions)." icon={ShieldCheck}>
        <div className="space-y-3">
          {Object.keys(DEFAULT_ROLE_LABELS).map((role) => (
            <div key={role} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
              <div>
                <input aria-label={`Libellé ${role}`} value={labels[role]} maxLength={60} onChange={(e) => setLabels((l) => ({ ...l, [role]: e.target.value }))} className={inputClass} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_RIGHTS[role]}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-5">
          <button className={primaryButton} disabled={save.isPending || Object.values(labels).some((v) => v.trim().length < 2)} onClick={() => save.mutate({ roleLabels: labels })}>
            <Save className="w-4 h-4" /> Enregistrer les libellés
          </button>
        </div>
      </Card>

      <Card title="Administrateurs de la plateforme" description="Accès à cette console. Désignez au moins une seconde personne de confiance pour ne jamais perdre l’accès." icon={Users}>
        <div className="space-y-2">
          {(data?.users || []).map((u: any) => (
            <div key={u.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-[#16214A]">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.name || u.email}</p>
                <p className="text-xs text-slate-500 truncate">
                  {u.email} · {labels[u.role] || u.role}
                  {!u.is_active && ' · désactivé'}
                </p>
              </div>
              {u.is_platform_admin ? (
                <button
                  className="text-xs font-black text-rose-500 disabled:opacity-40"
                  disabled={u.id === user?.id || toggleAdmin.isPending}
                  onClick={() => toggleAdmin.mutate({ id: u.id, value: false })}
                >
                  Retirer
                </button>
              ) : (
                <button className="text-xs font-black text-amber-600" disabled={!u.is_active || toggleAdmin.isPending} onClick={() => toggleAdmin.mutate({ id: u.id, value: true })}>
                  Nommer admin
                </button>
              )}
            </div>
          ))}
          {data && data.users.length <= 1 && <p className="text-xs text-slate-500">Créez d’abord des comptes depuis « Utilisateurs ».</p>}
        </div>
      </Card>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Modules
// -----------------------------------------------------------------------------
const MODULE_HELP: Record<string, string> = {
  attendance: 'Fiches de comptage des cultes, programme, statistiques de présence',
  finance: 'Recettes, dépenses, approbations, trésorerie, grand livre',
  campaigns: 'Collectes temporaires avec objectif et date limite',
  fixedExpenses: 'Loyer, eau, électricité… avec échéancier automatique',
  budgets: 'Plafonds de dépenses par catégorie et alertes',
  transfers: 'Mouvements entre compartiments de caisse',
  cashClosing: 'Billetage, rapprochement et procès-verbal de caisse',
  analytics: 'Tableaux d’analyse, tendances et prévisions',
};

const ModulesTab: React.FC<{ config: any; labels: Record<string, string> }> = ({ config, labels }) => {
  const save = useSaveConfig();
  const [modules, setModules] = useState<Record<string, boolean>>({ ...config.modules });
  const set = (k: string, v: boolean) =>
    setModules((m) => {
      const next = { ...m, [k]: v };
      if (k === 'finance' && !v) ['campaigns', 'fixedExpenses', 'budgets', 'transfers', 'cashClosing'].forEach((x) => (next[x] = false));
      return next;
    });
  return (
    <Card title="Modules activés" description="Un module désactivé disparaît des menus web et mobile. Aucune donnée n’est supprimée : il suffit de le réactiver." icon={Blocks}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.keys(labels).map((k) => (
          <Toggle
            key={k}
            label={labels[k]}
            description={MODULE_HELP[k]}
            checked={modules[k] !== false}
            disabled={k !== 'finance' && k !== 'attendance' && k !== 'analytics' && modules.finance === false}
            onChange={(v) => set(k, v)}
          />
        ))}
      </div>
      <div className="flex justify-end mt-5">
        <button className={primaryButton} disabled={save.isPending} onClick={() => save.mutate({ modules })}>
          <Save className="w-4 h-4" /> Enregistrer les modules
        </button>
      </div>
    </Card>
  );
};

// -----------------------------------------------------------------------------
// Profil d'église
// -----------------------------------------------------------------------------
const ProfileTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { refresh } = usePlatform();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<any>(null);
  const [includeIdentity, setIncludeIdentity] = useState(false);

  const exportProfile = useMutation({
    mutationFn: () => api.exportChurchProfile(),
    onSuccess: (profile) => {
      const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slug = String(profile?.ministry?.name || 'eglise').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      a.href = url;
      a.download = `profil-${slug}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Profil exporté');
    },
    onError: (err: any) => toast.error('Export impossible', { description: errMsg(err) }),
  });

  const importProfile = useMutation({
    mutationFn: () => api.importChurchProfile(pending, includeIdentity),
    onSuccess: async (res) => {
      setPending(null);
      await queryClient.invalidateQueries();
      await refresh();
      const s = res.summary || {};
      toast.success('Profil importé', {
        description: `${s.funds} compartiment(s), ${s.revenueCategories} catégorie(s) de recettes, ${s.expenseCategories} de dépenses, ${s.serviceTypes} type(s) de culte.`,
      });
    },
    onError: (err: any) => toast.error('Import refusé', { description: errMsg(err) }),
  });

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (json?.kind !== 'eev-church-profile') throw new Error('Ce fichier n’est pas un profil d’église.');
      setPending(json);
    } catch (err: any) {
      toast.error('Fichier illisible', { description: err.message });
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card title="Exporter le profil" description="Fichier JSON contenant la configuration et les référentiels (sans aucune donnée financière ni personnelle). Il sert de modèle pour installer la plateforme dans une autre église." icon={Download}>
        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5 mb-5 list-disc pl-5">
          <li>Apparence, monnaie, ventilation, modules, libellés des rôles</li>
          <li>Compartiments permanents, catégories de recettes et de dépenses</li>
          <li>Types de culte</li>
        </ul>
        <button className={primaryButton} disabled={exportProfile.isPending} onClick={() => exportProfile.mutate()}>
          <Download className="w-4 h-4" /> Télécharger le profil
        </button>
      </Card>

      <Card title="Importer un profil" description="Ajoute ou met à jour les référentiels par code. Rien n’est supprimé et les écritures existantes ne sont jamais modifiées." icon={Upload}>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        {!pending ? (
          <button className={secondaryButton} onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" /> Choisir un fichier .json
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-sm">
              <p className="font-black text-slate-900 dark:text-white">{pending.ministry?.name || 'Profil sans nom'}</p>
              <p className="text-xs text-slate-500 mt-1">
                {pending.funds?.length || 0} compartiment(s) · {pending.revenueCategories?.length || 0} catégorie(s) de recettes ·{' '}
                {pending.expenseCategories?.length || 0} de dépenses · {pending.serviceTypes?.length || 0} type(s) de culte
                {pending.exportedAt && ` · exporté ${timeAgo(pending.exportedAt).toLowerCase()}`}
              </p>
            </div>
            <Toggle label="Importer aussi l’identité (nom, coordonnées)" description="À laisser désactivé si ce profil vient d’une autre église." checked={includeIdentity} onChange={setIncludeIdentity} />
            <div className="flex gap-2">
              <button className={primaryButton} disabled={importProfile.isPending} onClick={() => importProfile.mutate()}>
                {importProfile.isPending ? 'Import…' : 'Importer'}
              </button>
              <button className={secondaryButton} onClick={() => setPending(null)}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Données & système
// -----------------------------------------------------------------------------
const COUNT_LABELS: Record<string, string> = {
  users: 'Utilisateurs',
  financial_entries: 'Recettes',
  expenses: 'Dépenses',
  attendance_sheets: 'Fiches de présence',
  fund_transactions: 'Écritures du grand livre',
  audit_logs: 'Traces d’audit',
};

const DataTab: React.FC<{ ministryName: string }> = ({ ministryName }) => {
  const queryClient = useQueryClient();
  const { data: status, refetch } = useQuery({ queryKey: ['system-status'], queryFn: () => api.getSystemStatus() });
  const [confirm, setConfirm] = useState('');
  const [removeUsers, setRemoveUsers] = useState(false);

  const backup = useMutation({
    mutationFn: () => api.createBackup(),
    onSuccess: (d) => {
      toast.success('Sauvegarde créée', { description: d?.key });
      refetch();
    },
    onError: (err: any) => toast.error('Sauvegarde impossible', { description: errMsg(err) }),
  });

  const reset = useMutation({
    mutationFn: () => api.resetPlatformData(confirm, removeUsers),
    onSuccess: async (res) => {
      setConfirm('');
      await queryClient.invalidateQueries();
      refetch();
      toast.success('Données remises à zéro', { description: `Sauvegarde préalable : ${res.backup}` });
    },
    onError: (err: any) => toast.error('Remise à zéro refusée', { description: errMsg(err) }),
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card
        title="État du système"
        icon={Database}
        actions={
          <button className={secondaryButton} disabled={backup.isPending} onClick={() => backup.mutate()}>
            <HardDriveDownload className="w-4 h-4" /> Sauvegarder maintenant
          </button>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(status?.counts || {}).map(([k, v]) => (
            <div key={k} className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
              <p className="text-[11px] text-slate-500">{COUNT_LABELS[k] || k}</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{formatNumber(v as number)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 text-xs text-slate-500">
          <p>
            Base de données : {status?.pocketbase?.ok ? <span className="text-emerald-600 font-bold">opérationnelle</span> : <span className="text-rose-500 font-bold">injoignable</span>}
            {status?.api?.env && ` · environnement ${status.api.env}`}
          </p>
          <p>Dernière sauvegarde : {status?.backups?.[0] ? `${status.backups[0].key} (${timeAgo(status.backups[0].modified).toLowerCase()})` : 'aucune'}</p>
        </div>
      </Card>

      <Card title="Remise à zéro des données" description="Après une formation ou des essais, avant la mise en service réelle. Une sauvegarde complète est créée automatiquement juste avant." icon={AlertTriangle}>
        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-5 mb-4">
          <li>Supprime : recettes, dépenses, transferts, charges fixes, budgets, clôtures, fiches de culte, quêtes, journal d’audit</li>
          <li>Remet tous les soldes à 0</li>
          <li>Conserve : configuration, compartiments, catégories, types de culte{removeUsers ? '' : ', comptes utilisateurs'}</li>
        </ul>
        <Toggle label="Supprimer aussi les comptes utilisateurs" description="Seuls les administrateurs de la plateforme sont conservés." checked={removeUsers} onChange={setRemoveUsers} />
        <Field label={`Pour confirmer, saisissez « ${ministryName} »`} htmlFor="reset-confirm" className="mt-4">
          <input id="reset-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="off" />
        </Field>
        <button className={`${dangerButton} mt-4`} disabled={confirm.trim() !== ministryName.trim() || reset.isPending} onClick={() => reset.mutate()}>
          <Trash2 className="w-4 h-4" /> {reset.isPending ? 'Remise à zéro…' : 'Effacer les données'}
        </button>
      </Card>
    </div>
  );
};
