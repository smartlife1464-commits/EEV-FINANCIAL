import { describe, it, expect } from 'vitest';
import {
  calculateMetricVariation,
  resolvePeriodDateRange,
  AnalyticsService,
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

  it('computes attendance analytics respecting strict separation of new visitors', async () => {
    const data = await AnalyticsService.getAttendanceAnalytics('this_month');

    // Vérifie que grandTotal = hommes + femmes + jeunes + enfants
    const demoSum = data.demographics.reduce((sum, d) => sum + d.count, 0);
    expect(demoSum).toBe(data.summary.grandTotal);

    // Vérifie que la moyenne par service divise bien par le nombre de services validés (et JAMAIS par le nombre de jours)
    const expectedAvg = Math.round(data.summary.grandTotal / data.summary.servicesCount);
    expect(data.summary.averagePerService).toBe(expectedAvg);

    // Vérifie la séparation des nouveaux visiteurs
    expect(data.summary.totalNewVisitors).toBeGreaterThan(0);
    expect(data.summary.visitorRate).toBeGreaterThan(0);
  });

  it('computes financial analytics respecting the 80/10/10 split on gross ordinary revenues', async () => {
    const fin = await AnalyticsService.getFinancialAnalytics('this_month');

    const ordinary = fin.revenues.ordinaryCombined;
    const { generalFund, titheOfTithes, welfareAid } = fin.revenues.split80_10_10;

    // Précision exacte FCFA sans écart de centime
    expect(generalFund + titheOfTithes + welfareAid).toBe(ordinary);
    expect(titheOfTithes).toBe(Math.floor(ordinary * 0.1));
    expect(welfareAid).toBe(Math.floor(ordinary * 0.1));

    // Vérifie que seules les dépenses payées sont comptabilisées comme sorties effectives
    expect(fin.expenses.paid).toBeGreaterThan(0);
    expect(fin.expenses.totalCommitted).toBeGreaterThanOrEqual(fin.expenses.paid);
  });

  it('generates multi-series trends and overview with insights', async () => {
    const overview = await AnalyticsService.getOverview('this_month');
    expect(overview.kpis.attendance.total).toBeDefined();
    expect(overview.kpis.finance.totalRevenues).toBeDefined();
    expect(overview.insights.length).toBeGreaterThan(0);

    const trends = await AnalyticsService.getAttendanceTrends('week');
    expect(trends.length).toBeGreaterThan(0);
    expect(trends[0].total).toBe(trends[0].men + trends[0].women + trends[0].youth + trends[0].children);
  });
});
