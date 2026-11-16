import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Settings,
  Building2,
  Coins,
  CheckCircle2,
  Save,
  Server,
  Database,
  AlertTriangle,
  RefreshCw,
  HardDriveDownload,
  Users,
} from 'lucide-react';
import { api } from '../services/api';
import { DEFAULT_MINISTRY, MinistrySettings } from '../hooks/useMinistry';
import { formatNumber, timeAgo } from '../utils/formatters';

const inputClass =
  'w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-amber-400';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400';

const COUNT_LABELS: Record<string, string> = {
  users: 'Utilisateurs',
  financial_entries: 'Recettes',
  expenses: 'Dépenses',
  attendance_sheets: 'Fiches de présence',
  fund_transactions: 'Écritures du grand livre',
  audit_logs: 'Traces d’audit',
};

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MinistrySettings>(DEFAULT_MINISTRY);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['ministry-settings'],
    queryFn: () => api.getSettings(),
  });

  const { data: status, refetch: refetchStatus, isFetching: statusLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => api.getSystemStatus(),
  });

  useEffect(() => {
    if (settings) setForm({ ...DEFAULT_MINISTRY, ...settings });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: MinistrySettings) => api.updateSettings(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['ministry-settings'], data);
      toast.success('Paramètres enregistrés', { description: 'Les documents officiels utilisent désormais ces informations.' });
    },
    onError: (err: Error) => toast.error('Enregistrement impossible', { description: err.message }),
  });

  const backupMutation = useMutation({
    mutationFn: () => api.createBackup(),
    onSuccess: (data) => {
      toast.success('Sauvegarde créée', { description: data?.key });
      refetchStatus();
    },
    onError: (err: Error) => toast.error('Sauvegarde impossible', { description: err.message }),
  });

  const set = (key: keyof MinistrySettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: key === 'venueCapacity' ? Math.max(0, parseInt(e.target.value || '0', 10) || 0) : e.target.value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const pbOk = status?.pocketbase?.ok;
  const lastBackup = status?.backups?.[0];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            <span>Paramètres Généraux & Règles Financières</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Identité officielle du ministère (en-têtes des reçus, bons de caisse, PV et rapports), règles de ventilation et état du système.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1 : Informations Institutionnelles */}
        <div className="bg-white dark:bg-[#0C1530] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#16214A] pb-4">
            <Building2 className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Identité du Ministère</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ces informations apparaissent sur tous les documents officiels imprimables.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass} htmlFor="set-name">Nom officiel de l’organisation</label>
              <input id="set-name" type="text" required value={form.name} onChange={set('name')} className={inputClass} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="set-hq">Siège (ville, quartier)</label>
              <input id="set-hq" type="text" value={form.headquarters} onChange={set('headquarters')} placeholder="Ex : Quartier, Ville, Pays" className={inputClass} />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="set-bp">Boîte postale</label>
              <input id="set-bp" type="text" value={form.postalBox} onChange={set('postalBox')} placeholder="Ex : BP 0000" className={inputClass} />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="set-phone">Téléphone officiel</label>
              <input id="set-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+237 …" className={inputClass} />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="set-email">Email officiel</label>
              <input id="set-email" type="email" value={form.email} onChange={set('email')} placeholder="contact@…" className={inputClass} />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="set-web">Site web</label>
              <input id="set-web" type="text" value={form.website} onChange={set('website')} placeholder="www.…" className={inputClass} />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="set-pastor">Pasteur Principal (nom affiché sur les visas)</label>
              <input id="set-pastor" type="text" value={form.mainPastor} onChange={set('mainPastor')} className={inputClass} />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="set-capacity">Capacité d’accueil de la salle (places)</label>
              <input id="set-capacity" type="number" min={0} value={form.venueCapacity || ''} onChange={set('venueCapacity')} placeholder="0 = non suivi" className={inputClass} />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Active le calcul du taux d’occupation sur le tableau de bord Protocole.</p>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Devise comptable</label>
              <input type="text" disabled value="FCFA (Franc CFA XAF)" className="w-full p-3.5 rounded-2xl bg-slate-100 dark:bg-[#070D22]/60 border border-slate-200 dark:border-[#16214A] text-slate-500 font-bold text-xs cursor-not-allowed" />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saveMutation.isPending || isLoading}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer l’identité du ministère'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Section 2 : Règles de Ventilation Statutaire (verrouillées dans le moteur de règles) */}
      <div className="bg-white dark:bg-[#0C1530] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#16214A] pb-4">
          <Coins className="w-5 h-5 text-emerald-500" />
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Règles de Répartition Analytique (80 / 10 / 10)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Règle statutaire non modifiable depuis l’interface : elle est garantie par le moteur de règles et la piste d’audit.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Dîme des Dîmes', pct: 10, box: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-500', desc: 'Prélèvement statutaire réservé à la direction sacerdotale.' },
            { label: 'Aide Sociale & Secours', pct: 10, box: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-500', desc: 'Prélèvement réservé aux veuves, orphelins et secours.' },
            { label: 'Fonds Général', pct: 80, box: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-500', desc: "Seul fonds supportant l'intégralité des charges courantes." },
          ].map((r) => (
            <div key={r.label} className={`p-5 rounded-2xl border space-y-2 ${r.box}`}>
              <span className={`text-xs font-black uppercase ${r.text}`}>{r.label}</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{r.pct} %</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Les dons affectés (Construction Auditorium, Amis de Jésus, Offrandes spéciales) sont crédités à 100 % de leur compartiment, sans prélèvement.
        </p>
      </div>

      {/* Section 3 : État réel du système */}
      <div className="bg-white dark:bg-[#0C1530] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm space-y-6">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-[#16214A] pb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">État du Système & Sauvegardes</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetchStatus()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#16214A] text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button
              type="button"
              onClick={() => backupMutation.mutate()}
              disabled={!pbOk || backupMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer disabled:opacity-50"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              {backupMutation.isPending ? 'Sauvegarde…' : 'Sauvegarder maintenant'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> Base de données
            </span>
            <p className="text-sm font-black text-slate-900 dark:text-white">PocketBase (SQLite)</p>
            <span className={`text-[10px] font-bold flex items-center gap-1 ${pbOk ? 'text-emerald-500' : 'text-rose-500'}`}>
              <span className={`w-2 h-2 rounded-full ${pbOk ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {status ? (pbOk ? `Opérationnelle (${status.pocketbase.latencyMs} ms)` : `Indisponible — ${status.pocketbase?.message || ''}`) : 'Vérification…'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Serveur API</span>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              Fastify {status?.api?.version ? `v${status.api.version}` : ''} • Node {status?.api?.node || ''}
            </p>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {status ? `En ligne depuis ${formatNumber(Math.round((status.api.uptimeSeconds || 0) / 60))} min (${status.api.env})` : 'Vérification…'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Dernière sauvegarde</span>
            <p className="text-sm font-black text-slate-900 dark:text-white truncate" title={lastBackup?.key}>
              {lastBackup ? lastBackup.key : 'Aucune sauvegarde'}
            </p>
            <span className={`text-[10px] font-bold flex items-center gap-1 ${lastBackup ? 'text-emerald-500' : 'text-amber-500'}`}>
              {lastBackup ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {lastBackup ? `${timeAgo(lastBackup.modified)} • ${formatNumber(lastBackup.size / 1024)} Ko` : 'Planifiez scripts/backup/backup.sh (cron quotidien)'}
            </span>
          </div>
        </div>

        {status?.counts && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Object.entries(status.counts).map(([key, value]) => (
              <div key={key} className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A]">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  {key === 'users' && <Users className="w-3 h-3" />}
                  {COUNT_LABELS[key] || key}
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-white">{formatNumber(value as number)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
