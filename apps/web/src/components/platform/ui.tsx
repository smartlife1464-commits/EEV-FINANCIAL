import React from 'react';

/** Petits composants partagés par l'assistant d'installation et la console plateforme. */

export const inputClass =
  'w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white font-semibold text-sm outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60';
export const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5';
export const primaryButton =
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm transition disabled:opacity-50 disabled:cursor-not-allowed';
export const secondaryButton =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#16214A] text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-[#111C40] transition disabled:opacity-50';
export const dangerButton =
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm transition disabled:opacity-50 disabled:cursor-not-allowed';

export const Card: React.FC<{
  title?: string;
  description?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, icon: Icon, actions, children, className = '' }) => (
  <section className={`bg-white dark:bg-[#0C1530] p-5 md:p-7 rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm ${className}`}>
    {(title || actions) && (
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 dark:border-[#16214A] pb-4 mb-5">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </span>
          )}
          <div>
            {title && <h2 className="text-base font-black text-slate-900 dark:text-white">{title}</h2>}
            {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

export const Field: React.FC<{ label: string; htmlFor?: string; hint?: string; children: React.ReactNode; className?: string }> = ({
  label,
  htmlFor,
  hint,
  children,
  className = '',
}) => (
  <div className={className}>
    <label className={labelClass} htmlFor={htmlFor}>
      {label}
    </label>
    {children}
    {hint && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{hint}</p>}
  </div>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }> = ({
  checked,
  onChange,
  label,
  description,
  disabled,
}) => (
  <label className={`flex items-start justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-[#16214A] ${disabled ? 'opacity-60' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-[#0F1A3A]'}`}>
    <span>
      <span className="block text-sm font-bold text-slate-900 dark:text-white">{label}</span>
      {description && <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full shrink-0 transition ${checked ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </label>
);

export const Badge: React.FC<{ tone?: 'success' | 'muted' | 'warning' | 'brand'; children: React.ReactNode }> = ({ tone = 'muted', children }) => {
  const tones = {
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    muted: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
    warning: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    brand: 'bg-amber-400/20 text-amber-700 dark:text-amber-300',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${tones[tone]}`}>{children}</span>;
};

/** Lecture d'une image locale en data URL (logo), avec limite de taille */
export function readImageFile(file: File, maxBytes = 400 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Choisissez une image (PNG, JPG, SVG ou WebP).'));
    if (file.size > maxBytes) return reject(new Error(`Image trop lourde : ${Math.round(maxBytes / 1024)} Ko maximum.`));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });
}
