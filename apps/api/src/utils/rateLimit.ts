/**
 * Limiteur de tentatives en mémoire (connexion, codes de réinitialisation, installation).
 * Suffisant pour une installation mono-serveur : protège contre le forçage de mots de passe.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function tooManyAttempts(key: string, max: number, windowMs: number): number | null {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  b.count += 1;
  if (b.count > max) return Math.ceil((b.resetAt - now) / 1000);
  return null;
}

export function clearAttempts(key: string) {
  buckets.delete(key);
}
