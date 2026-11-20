/** Monnaie de l'église, fixée au démarrage par la configuration de la plateforme. */
let currency = { label: 'FCFA', words: 'francs CFA', code: 'XAF' };

export function setCurrency(next: { label?: string; words?: string; code?: string }) {
  currency = { ...currency, ...Object.fromEntries(Object.entries(next).filter(([, v]) => Boolean(v))) };
}

/** Libellé court de la monnaie (« FCFA », « €», « CDF »…) */
export function currencyLabel(): string {
  return currency.label;
}

/** Code ISO de la monnaie (XAF, XOF, EUR…) */
export function currencyCode(): string {
  return currency.code;
}

/** Monnaie en toutes lettres pour les reçus (« francs CFA », « euros »…) */
export function currencyWords(): string {
  return currency.words;
}

/**
 * Formate un montant avec séparateurs de milliers et la monnaie de l'église.
 * Ex: 100000 -> "100 000 FCFA"
 */
export function formatFCFA(amount: number | undefined | null): string {
  const n = amount === undefined || amount === null || isNaN(Number(amount)) ? 0 : Number(amount);
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n))} ${currency.label}`;
}

/** Alias explicite */
export const formatMoney = formatFCFA;

/**
 * Formate une date ISO en format lisible français.
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  // Les dates PocketBase (« 2026-11-06 22:41:31.218Z ») ne sont pas comprises par Safari : normalisation préalable
  const d = parseAppDate(dateString);
  if (!d) return dateString;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/** Convertit une date PocketBase ("2026-11-06 22:41:31.218Z") ou ISO en objet Date */
export function parseAppDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const v = value.length === 10 ? `${value}T12:00:00` : value.replace(' ', 'T');
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** Durée relative lisible en français (« Il y a 5 minutes », « Dans 3 jours ») */
export function timeAgo(value: string | undefined | null): string {
  const d = parseAppDate(value);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;
  const units: [number, string][] = [
    [365 * 864e5, 'an'],
    [30 * 864e5, 'mois'],
    [864e5, 'jour'],
    [36e5, 'heure'],
    [6e4, 'minute'],
  ];
  for (const [ms, label] of units) {
    if (abs >= ms) {
      const n = Math.floor(abs / ms);
      const plural = n > 1 && label !== 'mois' ? 's' : '';
      return future ? `Dans ${n} ${label}${plural}` : `Il y a ${n} ${label}${plural}`;
    }
  }
  return future ? 'Bientôt' : "À l'instant";
}

/** Formate un nombre entier avec séparateurs de milliers français */
export function formatNumber(n: number | undefined | null): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));
}

/** Variation signée « +12,5 % » */
export function formatVariation(pct: number | undefined | null): string {
  const v = Number(pct) || 0;
  return `${v > 0 ? '+' : ''}${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
}

/** Date + heure (horodatage d'audit, pièces de caisse) */
export function formatDateTime(value: string | undefined | null): string {
  const d = parseAppDate(value);
  if (!d) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
