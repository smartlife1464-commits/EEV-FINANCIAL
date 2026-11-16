import { describe, it, expect } from 'vitest';
import {
  calculateMetricVariation,
  resolvePeriodDateRange,
  summarizeAttendance,
  summarizeFinance,
  monthlyFinanceTrends,
  buildBuckets,
  toCsv,
  Snapshot,
} from './services/analytics.service.js';

describe('Analytics Calculations Engine & Statistical Accuracy', () => {
  it('correctly calculates percentage variations avoiding division by zero', () => {
    // Cas 0 -> 100 : pas de division par zéro, 100% de hausse
    const zeroToPos = calculateMetricVariation(100, 0, true);
    expect(zeroToPos.percentage).toBe(100);
    expect(zeroToPos.difference).toBe(100);
    expect(zeroToPos.direction).toBe('up');
    expect(zeroToPos.isFavorable).toBe(true);

    // Cas 0 -> 0 : variation nulle
    const zeroToZero = calculateMetricVariation(0, 0, true);
    expect(zeroToZero.percentage).toBe(0);
    expect(zeroToZero.direction).toBe('neutral');

    // Cas standard : 500 fidèles vs 400 fidèles
    const attGrowth = calculateMetricVariation(500, 400, true);
    expect(attGrowth.difference).toBe(100);
    expect(attGrowth.percentage).toBe(25);
    expect(attGrowth.direction).toBe('up');
    expect(attGrowth.isFavorable).toBe(true);

    // Cas baisse : 450 fidèles vs 500 fidèles
    const attDrop = calculateMetricVariation(450, 500, true);
    expect(attDrop.difference).toBe(-50);
    expect(attDrop.percentage).toBe(-10);
    expect(attDrop.direction).toBe('down');
    expect(attDrop.isFavorable).toBe(false);

    // Cas dépense : une baisse est favorable
    const expenseDrop = calculateMetricVariation(400000, 500000, false);
    expect(expenseDrop.difference).toBe(-100000);
    expect(expenseDrop.direction).toBe('down');
    expect(expenseDrop.isFavorable).toBe(true); // favorable car dépense réduite
  });

  it('accurately resolves pre-set and custom period date ranges with comparison intervals', () => {
    const fixedDate = new Date('2026-11-15T12:00:00Z');

    const thisMonth = resolvePeriodDateRange('this_month', undefined, undefined, fixedDate);
    expect(thisMonth.startDate.getDate()).toBe(1);
    expect(thisMonth.startDate.getMonth()).toBe(10); // Novembre = index 10
    expect(thisMonth.previousStartDate.getMonth()).toBe(9); // Octobre = index 9

    const thisWeek = resolvePeriodDateRange('this_week', undefined, undefined, fixedDate);
    expect(thisWeek.startDate.getDay()).toBe(1); // Lundi

    const custom = resolvePeriodDateRange('custom', '2026-05-01', '2026-05-31', fixedDate);
    expect(custom.startDate.getDate()).toBe(1);
    expect(custom.endDate.getDate()).toBe(31);
    expect(custom.previousEndDate.getDate()).toBe(30);
  });

  // Jeu de données en mémoire : tests déterministes, indépendants de PocketBase
  const snapshot: Snapshot = {
    serviceTypes: [
      { slug: 'sunday_service_1', name: '1er Service Dimanche', is_active: true },
      { slug: 'tuesday_service', name: 'Culte de Mardi', is_active: true },
    ],
    sheets: [
      { id: 'a', service_type_slug: 'sunday_service_1', service_date: '2026-11-08', status: 'validated', men_count: 100, women_count: 150, youth_count: 60, children_count: 40, new_visitors_count: 12, salvations_count: 3 },
      { id: 'b', service_type_slug: 'tuesday_service', service_date: '2026-11-03', status: 'submitted', men_count: 30, women_count: 50, youth_count: 10, children_count: 10, new_visitors_count: 4, salvations_count: 1 },
      { id: 'c', service_type_slug: 'sunday_service_1', service_date: '2026-10-25', status: 'validated', men_count: 90, women_count: 140, youth_count: 50, children_count: 30, new_visitors_count: 8, salvations_count: 2 },
    ],
    entries: [
      { id: 'e1', amount: 1000001, collected_at: '2026-11-08', status: 'validated', expand: { category: { code: 'tithes', name: 'Dîmes', allocation_rule: 'standard_split_80_10_10' } } },
      { id: 'e2', amount: 333333, collected_at: '2026-11-08', status: 'validated', expand: { category: { code: 'offerings', name: 'Offrandes', allocation_rule: 'standard_split_80_10_10' } } },
      { id: 'e3', amount: 500000, collected_at: '2026-11-09', status: 'validated', expand: { category: { code: 'building', name: 'Auditorium', allocation_rule: 'direct_allocated' } } },
      { id: 'e4', amount: 200000, collected_at: '2026-10-10', status: 'validated', expand: { category: { code: 'tithes', name: 'Dîmes', allocation_rule: 'standard_split_80_10_10' } } },
    ],
    expenses: [
      { id: 'x1', amount: 150000, status: 'paid', paid_at: '2026-11-05 10:00:00.000Z', expand: { category: { name: 'Électricité' }, fund_account: { code: 'GENERAL' } } },
      { id: 'x2', amount: 80000, status: 'pending_approval', expense_date: '2026-11-06', expand: { category: { name: 'Transport' } } },
      { id: 'x3', amount: 50000, status: 'rejected', expense_date: '2026-11-07', category_name: 'Matériel' },
    ],
    treasury: { consolidatedPhysicalBalance: 0, funds: [], pendingCommitmentsTotal: 0, generalFundFreeBalance: 0 },
  };
  const nov = resolvePeriodDateRange('this_month', undefined, undefined, new Date('2026-11-15T12:00:00Z'));

  it('computes attendance analytics respecting strict separation of new visitors', () => {
    const att = summarizeAttendance(snapshot, nov.startDate, nov.endDate);

    // TOTAL = HOMMES + FEMMES + JEUNES + ENFANTS (les nouveaux visiteurs ne sont jamais additionnés)
    expect(att.grandTotal).toBe(350 + 100);
    expect(att.demographics.reduce((acc, d) => acc + d.count, 0)).toBe(att.grandTotal);
    expect(att.totalNewVisitors).toBe(16);

    // Moyenne = total / nombre de cultes de la période (octobre exclu)
    expect(att.servicesCount).toBe(2);
    expect(att.averagePerService).toBe(225);
    expect(att.best?.total).toBe(350);
    expect(att.byType.find((t) => t.code === 'sunday_service_1')?.count).toBe(1);
  });

  it('computes financial analytics respecting the 80/10/10 split on gross ordinary revenues', () => {
    const fin = summarizeFinance(snapshot, nov.startDate, nov.endDate);
    const { generalFund, titheOfTithes, welfareAid } = fin.split80_10_10;

    expect(fin.ordinaryCombined).toBe(1333334);
    // Précision exacte FCFA : la somme des parts égale le brut ordinaire
    expect(generalFund + titheOfTithes + welfareAid).toBe(fin.ordinaryCombined);
    // Les fonds affectés ne subissent aucun prélèvement
    expect(fin.designated.buildingAuditorium).toBe(500000);
    expect(fin.totalGross).toBe(1833334);

    // Seules les dépenses payées sont des sorties effectives
    expect(fin.expensesPaid).toBe(150000);
    expect(fin.generalFundPaid).toBe(150000);
    expect(fin.expensesPending).toBe(80000);
    expect(fin.rejectedCount).toBe(1);
    expect(fin.byCategory[0].name).toBe('Électricité');
  });

  it('builds monthly trends and time buckets from real data only', () => {
    const trends = monthlyFinanceTrends(snapshot, nov.endDate, 2);
    expect(trends).toHaveLength(2);
    expect(trends[0].revenues).toBe(200000); // octobre
    expect(trends[1].revenues).toBe(1833334); // novembre

    const buckets = buildBuckets(nov.startDate, nov.endDate);
    expect(buckets.length).toBeGreaterThanOrEqual(4);

    const empty = summarizeFinance({ ...snapshot, entries: [], expenses: [] }, nov.startDate, nov.endDate);
    expect(empty.totalGross).toBe(0); // aucune donnée de démonstration injectée
  });

  it('escapes CSV values safely', () => {
    const csv = toCsv(['A', 'B'], [['x;y', 'He said "hi"']]);
    expect(csv).toContain('"x;y"');
    expect(csv).toContain('"He said ""hi"""');
  });
});
