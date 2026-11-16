import { describe, it, expect } from 'vitest';
import { withRelations, normalizePeriod, pbString, isProtocolRole } from './utils/http.js';
import { dayOf } from './services/analytics.service.js';

describe('Utilitaires HTTP & normalisation', () => {
  it('expose les relations développées sans perdre le bloc expand', () => {
    const rec = { id: 'e1', category: 'c1', expand: { category: { id: 'c1', name: 'Dîmes' } } };
    const out: any = withRelations(rec);
    expect(out.category.name).toBe('Dîmes');
    expect(out.expand.category.id).toBe('c1');
    expect(withRelations({ id: 'x', category: 'c2' } as any).category).toBe('c2');
  });

  it('convertit les anciennes périodes des rapports', () => {
    expect(normalizePeriod('monthly')).toBe('this_month');
    expect(normalizePeriod('annual')).toBe('this_year');
    expect(normalizePeriod('last_30_days')).toBe('last_30_days');
    expect(normalizePeriod(undefined)).toBe('this_month');
  });

  it('échappe les valeurs injectées dans les filtres PocketBase', () => {
    expect(pbString('a"b')).toBe('a\\"b');
    // Aucun guillemet non échappé ne subsiste (impossible de sortir de la chaîne du filtre)
    expect(/(^|[^\\])"/.test(pbString('x" || id != "'))).toBe(false);
  });

  it('identifie les rôles du Protocole', () => {
    expect(isProtocolRole('protocol_agent')).toBe(true);
    expect(isProtocolRole('lead_pastor')).toBe(false);
  });

  it('extrait le jour des dates PocketBase et ISO', () => {
    expect(dayOf('2026-11-06 22:41:31.218Z')).toBe('2026-11-06');
    expect(dayOf('2026-11-06T10:00:00Z')).toBe('2026-11-06');
    expect(dayOf(undefined)).toBe('');
  });
});
