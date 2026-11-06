/**
 * Formate un montant entier en FCFA avec séparateurs de milliers.
 * Ex: 100000 -> "100 000 FCFA"
 */
export function formatFCFA(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 FCFA';
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('XOF', 'FCFA');
}

/**
 * Formate une date ISO en format lisible français.
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

