import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  format,
  parseISO,
  isWithinInterval,
  differenceInDays,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { pb, ensureAdminAuth } from './pocketbase.js';
import { LedgerService } from './ledger.js';
import { calculateEntryAllocations } from '@eev/business-rules';
import { getPlatformConfig, money, type PlatformConfig } from './platform.js';
import { AllocationRule, ConsolidatedTreasury } from '@eev/shared-types';
import { config } from '../config.js';

export type PeriodKey =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_semester'
  | 'last_semester'
  | 'this_year'
  | 'last_year'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'last_12_months'
  | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
  previousStartDate: Date;
  previousEndDate: Date;
  previousLabel: string;
}

export interface MetricVariation {
  current: number;
  previous: number;
  difference: number;
  percentage: number;
  direction: 'up' | 'down' | 'neutral';
  isFavorable: boolean;
}

/**
 * Calcul sécurisé de la variation entre deux périodes (évite toute division par zéro)
 */
export function calculateMetricVariation(
  current: number,
  previous: number,
  favorableWhenHigher = true
): MetricVariation {
  const difference = current - previous;
  let percentage = 0;

  if (previous === 0) {
    percentage = current > 0 ? 100 : 0;
  } else {
    percentage = Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
  }

  const direction: 'up' | 'down' | 'neutral' =
    difference > 0 ? 'up' : difference < 0 ? 'down' : 'neutral';

  const isFavorable =
    direction === 'neutral'
      ? true
      : favorableWhenHigher
      ? direction === 'up'
      : direction === 'down';

  return {
    current,
    previous,
    difference,
    percentage,
    direction,
    isFavorable,
  };
}

/**
 * Résolution des bornes temporelles et de la période de comparaison correspondante
 */
export function resolvePeriodDateRange(
  period: PeriodKey = 'this_month',
  customStart?: string,
  customEnd?: string,
  now: Date = new Date()
): DateRange {
  let startDate: Date;
  let endDate: Date;
  let previousStartDate: Date;
  let previousEndDate: Date;
  let label = '';
  let previousLabel = '';

  switch (period) {
    case 'today':
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      previousStartDate = startOfDay(subDays(now, 1));
      previousEndDate = endOfDay(subDays(now, 1));
      label = `Aujourd'hui (${format(startDate, 'dd/MM/yyyy')})`;
      previousLabel = `Hier (${format(previousStartDate, 'dd/MM/yyyy')})`;
      break;

    case 'yesterday':
      startDate = startOfDay(subDays(now, 1));
      endDate = endOfDay(subDays(now, 1));
      previousStartDate = startOfDay(subDays(now, 2));
      previousEndDate = endOfDay(subDays(now, 2));
      label = `Hier (${format(startDate, 'dd/MM/yyyy')})`;
      previousLabel = `Avant-hier (${format(previousStartDate, 'dd/MM/yyyy')})`;
      break;

    case 'this_week':
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      previousEndDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      label = `Cette semaine (du ${format(startDate, 'dd/MM')} au ${format(endDate, 'dd/MM/yyyy')})`;
      previousLabel = `Semaine précédente (du ${format(previousStartDate, 'dd/MM')} au ${format(previousEndDate, 'dd/MM')})`;
      break;

    case 'last_week':
      startDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      endDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      previousStartDate = startOfWeek(subWeeks(now, 2), { weekStartsOn: 1 });
      previousEndDate = endOfWeek(subWeeks(now, 2), { weekStartsOn: 1 });
      label = `Semaine passée (du ${format(startDate, 'dd/MM')} au ${format(endDate, 'dd/MM')})`;
      previousLabel = `Semaine S-2 (du ${format(previousStartDate, 'dd/MM')} au ${format(previousEndDate, 'dd/MM')})`;
      break;

    case 'this_month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      previousStartDate = startOfMonth(subMonths(now, 1));
      previousEndDate = endOfMonth(subMonths(now, 1));
      label = `Ce mois-ci (${format(startDate, 'MMMM yyyy', { locale: fr })})`;
      previousLabel = `Mois précédent (${format(previousStartDate, 'MMMM yyyy', { locale: fr })})`;
      break;

    case 'last_month':
      startDate = startOfMonth(subMonths(now, 1));
      endDate = endOfMonth(subMonths(now, 1));
      previousStartDate = startOfMonth(subMonths(now, 2));
      previousEndDate = endOfMonth(subMonths(now, 2));
      label = `Mois dernier (${format(startDate, 'MMMM yyyy', { locale: fr })})`;
      previousLabel = `Mois M-2 (${format(previousStartDate, 'MMMM yyyy', { locale: fr })})`;
      break;

    case 'this_quarter':
      startDate = startOfQuarter(now);
      endDate = endOfQuarter(now);
      previousStartDate = startOfQuarter(subQuarters(now, 1));
      previousEndDate = endOfQuarter(subQuarters(now, 1));
      label = `Ce trimestre (T${Math.floor(startDate.getMonth() / 3) + 1} ${format(startDate, 'yyyy')})`;
      previousLabel = `Trimestre précédent (T${Math.floor(previousStartDate.getMonth() / 3) + 1} ${format(previousStartDate, 'yyyy')})`;
      break;

    case 'last_quarter':
      startDate = startOfQuarter(subQuarters(now, 1));
      endDate = endOfQuarter(subQuarters(now, 1));
      previousStartDate = startOfQuarter(subQuarters(now, 2));
      previousEndDate = endOfQuarter(subQuarters(now, 2));
      label = `Trimestre dernier (T${Math.floor(startDate.getMonth() / 3) + 1} ${format(startDate, 'yyyy')})`;
      previousLabel = `Trimestre T-2 (T${Math.floor(previousStartDate.getMonth() / 3) + 1} ${format(previousStartDate, 'yyyy')})`;
      break;

    case 'this_semester': {
      const isSecondSemester = now.getMonth() >= 6;
      startDate = new Date(now.getFullYear(), isSecondSemester ? 6 : 0, 1);
      endDate = new Date(now.getFullYear(), isSecondSemester ? 11 : 5, isSecondSemester ? 31 : 30, 23, 59, 59);
      previousStartDate = new Date(isSecondSemester ? now.getFullYear() : now.getFullYear() - 1, isSecondSemester ? 0 : 6, 1);
      previousEndDate = new Date(isSecondSemester ? now.getFullYear() : now.getFullYear() - 1, isSecondSemester ? 5 : 11, isSecondSemester ? 30 : 31, 23, 59, 59);
      label = `Semestre S${isSecondSemester ? 2 : 1} ${now.getFullYear()}`;
      previousLabel = `Semestre précédent (S${isSecondSemester ? 1 : 2} ${isSecondSemester ? now.getFullYear() : now.getFullYear() - 1})`;
      break;
    }

    case 'last_semester': {
      const isCurrSecond = now.getMonth() >= 6;
      const targetYear = isCurrSecond ? now.getFullYear() : now.getFullYear() - 1;
      const targetSemester = isCurrSecond ? 1 : 2;
      startDate = new Date(targetYear, targetSemester === 1 ? 0 : 6, 1);
      endDate = new Date(targetYear, targetSemester === 1 ? 5 : 11, targetSemester === 1 ? 30 : 31, 23, 59, 59);
      const prevTargetYear = targetSemester === 1 ? targetYear - 1 : targetYear;
      const prevSemester = targetSemester === 1 ? 2 : 1;
      previousStartDate = new Date(prevTargetYear, prevSemester === 1 ? 0 : 6, 1);
      previousEndDate = new Date(prevTargetYear, prevSemester === 1 ? 5 : 11, prevSemester === 1 ? 30 : 31, 23, 59, 59);
      label = `Semestre passé (S${targetSemester} ${targetYear})`;
      previousLabel = `Semestre S-2 (S${prevSemester} ${prevTargetYear})`;
      break;
    }

    case 'this_year':
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      previousStartDate = startOfYear(subYears(now, 1));
      previousEndDate = endOfYear(subYears(now, 1));
      label = `Année en cours (${format(startDate, 'yyyy')})`;
      previousLabel = `Année précédente (${format(previousStartDate, 'yyyy')})`;
      break;

    case 'last_year':
      startDate = startOfYear(subYears(now, 1));
      endDate = endOfYear(subYears(now, 1));
      previousStartDate = startOfYear(subYears(now, 2));
      previousEndDate = endOfYear(subYears(now, 2));
      label = `Année dernière (${format(startDate, 'yyyy')})`;
      previousLabel = `Année A-2 (${format(previousStartDate, 'yyyy')})`;
      break;

    case 'last_7_days':
      endDate = endOfDay(now);
      startDate = startOfDay(subDays(now, 6));
      previousEndDate = endOfDay(subDays(startDate, 1));
      previousStartDate = startOfDay(subDays(previousEndDate, 6));
      label = `7 derniers jours`;
      previousLabel = `7 jours précédents`;
      break;

    case 'last_30_days':
      endDate = endOfDay(now);
      startDate = startOfDay(subDays(now, 29));
      previousEndDate = endOfDay(subDays(startDate, 1));
      previousStartDate = startOfDay(subDays(previousEndDate, 29));
      label = `30 derniers jours`;
      previousLabel = `30 jours précédents`;
      break;

    case 'last_90_days':
      endDate = endOfDay(now);
      startDate = startOfDay(subDays(now, 89));
      previousEndDate = endOfDay(subDays(startDate, 1));
      previousStartDate = startOfDay(subDays(previousEndDate, 89));
      label = `90 derniers jours`;
      previousLabel = `90 jours précédents`;
      break;

    case 'last_12_months':
      endDate = endOfDay(now);
      startDate = startOfDay(subMonths(now, 12));
      previousEndDate = endOfDay(subDays(startDate, 1));
      previousStartDate = startOfDay(subMonths(previousEndDate, 12));
      label = `12 derniers mois`;
      previousLabel = `12 mois précédents`;
      break;

    case 'custom':
    default:
      if (customStart && customEnd) {
        startDate = startOfDay(parseISO(customStart));
        endDate = endOfDay(parseISO(customEnd));
        const days = Math.max(1, differenceInDays(endDate, startDate) + 1);
        previousEndDate = endOfDay(subDays(startDate, 1));
        previousStartDate = startOfDay(subDays(previousEndDate, days - 1));
        label = `Du ${format(startDate, 'dd/MM/yyyy')} au ${format(endDate, 'dd/MM/yyyy')}`;
        previousLabel = `Du ${format(previousStartDate, 'dd/MM/yyyy')} au ${format(previousEndDate, 'dd/MM/yyyy')}`;
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
        label = `Ce mois-ci (${format(startDate, 'MMMM yyyy', { locale: fr })})`;
        previousLabel = `Mois précédent (${format(previousStartDate, 'MMMM yyyy', { locale: fr })})`;
      }
      break;
  }

  return {
    startDate,
    endDate,
    label,
    previousStartDate,
    previousEndDate,
    previousLabel,
  };
}


// =============================================================================
// MOTEUR STATISTIQUE — calculs exclusivement à partir des données réelles
// (aucune donnée de démonstration : une base vide produit des indicateurs à zéro)
// =============================================================================


const PALETTE = ['#FFBC00', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#64748B'];

/** Libellés de repli des programmes (si la collection service_types est vide) */
const DEFAULT_SERVICE_TYPE_NAMES: Record<string, string> = {
  tuesday_service: 'Culte de Mardi',
  thursday_service: 'Culte de Jeudi',
  sunday_service_1: '1er Service Dimanche',
  sunday_service_2: '2ème Service Dimanche',
  mission_camp: 'Camp Missionnaire',
  shepherds_camp: 'Camp des Bergers',
  special_programs: 'Programmes Spéciaux',
};

/** Fiches non comptabilisées dans les statistiques officielles */
const EXCLUDED_SHEET_STATUSES = ['draft', 'rejected', 'cancelled'];

export interface Snapshot {
  entries: any[];
  expenses: any[];
  sheets: any[];
  serviceTypes: any[];
  treasury: ConsolidatedTreasury;
  platform: PlatformConfig;
}

/** Extrait la partie AAAA-MM-JJ d'une date PocketBase ("2026-11-06 22:41:31.218Z") ou ISO */
export function dayOf(value?: string | null): string {
  return (value || '').slice(0, 10);
}

function toDate(day: string): Date | null {
  if (!day || day.length < 10) return null;
  const d = parseISO(day);
  return isNaN(d.getTime()) ? null : d;
}

function inRange(value: string | undefined | null, start: Date, end: Date): boolean {
  const d = toDate(dayOf(value));
  return !!d && d >= startOfDay(start) && d <= end;
}

const sum = <T>(list: T[], pick: (x: T) => number) => list.reduce((acc, x) => acc + (Number(pick(x)) || 0), 0);
const pct = (part: number, total: number, decimals = 0) => {
  if (!total) return 0;
  const f = Math.pow(10, decimals);
  return Math.round((part / total) * 100 * f) / f;
};

export const entryDay = (e: any) => dayOf(e.collected_at || e.created);
export const sheetDay = (s: any) => dayOf(s.service_date || s.expand?.service?.date || s.created);
/** Date de décaissement pour une dépense payée, date d'engagement sinon */
export const expenseDay = (x: any) =>
  dayOf(x.status === 'paid' ? x.paid_at || x.expense_date || x.created : x.expense_date || x.created);

export const entryCategoryCode = (e: any): string => e.expand?.category?.code || '';
export const isOrdinaryEntry = (e: any): boolean =>
  e.expand?.category?.allocation_rule === AllocationRule.STANDARD_SPLIT_80_10_10 ||
  ['tithes', 'offerings'].includes(entryCategoryCode(e));

export const expenseCategoryName = (x: any): string =>
  x.expand?.category?.name || x.category_name || 'Autres dépenses';

/**
 * Charge en une fois les données nécessaires aux statistiques.
 * Lève une erreur explicite si PocketBase est indisponible (pas de repli silencieux).
 */
export async function loadSnapshot(options: { finance?: boolean } = {}): Promise<Snapshot> {
  const withFinance = options.finance !== false;
  await ensureAdminAuth();

  const [sheets, serviceTypes, entries, expenses, treasury, platform] = await Promise.all([
    pb.collection('attendance_sheets').getFullList({ sort: '-service_date', expand: 'service,service_type' }),
    pb.collection('service_types').getFullList({ sort: 'display_order' }),
    withFinance
      ? pb.collection('financial_entries').getFullList({ sort: '-collected_at', expand: 'category' })
      : Promise.resolve([] as any[]),
    withFinance
      ? pb.collection('expenses').getFullList({ sort: '-created', expand: 'category,fund_account' })
      : Promise.resolve([] as any[]),
    withFinance
      ? LedgerService.getConsolidatedTreasury()
      : Promise.resolve({
          consolidatedPhysicalBalance: 0,
          funds: [],
          pendingCommitmentsTotal: 0,
          generalFundFreeBalance: 0,
        } as ConsolidatedTreasury),
    getPlatformConfig(),
  ]);

  return {
    sheets: sheets.filter((s: any) => !EXCLUDED_SHEET_STATUSES.includes(s.status)),
    serviceTypes,
    entries: entries.filter((e: any) => e.status !== 'cancelled'),
    expenses,
    treasury,
    platform,
  };
}

// -----------------------------------------------------------------------------
// Découpage temporel
// -----------------------------------------------------------------------------
export interface Bucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

export function buildBuckets(start: Date, end: Date): Bucket[] {
  const days = Math.max(1, differenceInDays(end, start) + 1);
  const buckets: Bucket[] = [];

  if (days <= 14) {
    for (let i = 0; i < days; i++) {
      const d = startOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
      buckets.push({ key: format(d, 'yyyy-MM-dd'), label: format(d, 'dd/MM'), start: d, end: endOfDay(d) });
    }
    return buckets;
  }

  if (days <= 100) {
    let cursor = startOfWeek(start, { weekStartsOn: 1 });
    while (cursor <= end) {
      const wEnd = endOfWeek(cursor, { weekStartsOn: 1 });
      const bStart = cursor < start ? start : cursor;
      buckets.push({ key: format(cursor, 'yyyy-MM-dd'), label: format(bStart, 'dd/MM'), start: bStart, end: wEnd > end ? end : wEnd });
      cursor = startOfDay(new Date(wEnd.getTime() + 1));
    }
    return buckets;
  }

  let cursor = startOfMonth(start);
  while (cursor <= end) {
    const mEnd = endOfMonth(cursor);
    buckets.push({
      key: format(cursor, 'yyyy-MM'),
      label: format(cursor, 'MMM yy', { locale: fr }),
      start: cursor < start ? start : cursor,
      end: mEnd > end ? end : mEnd,
    });
    cursor = startOfMonth(new Date(mEnd.getTime() + 1));
  }
  return buckets;
}

// -----------------------------------------------------------------------------
// Fréquentation
// -----------------------------------------------------------------------------
function serviceTypeName(snapshot: Snapshot, slug: string): string {
  const st = snapshot.serviceTypes.find((t: any) => t.slug === slug);
  return st?.name || DEFAULT_SERVICE_TYPE_NAMES[slug] || slug || 'Culte';
}

export function sheetToRecord(snapshot: Snapshot, s: any) {
  const slug = s.service_type_slug || s.expand?.service_type?.slug || s.expand?.service?.service_type || '';
  const men = s.men_count || 0;
  const women = s.women_count || 0;
  const youth = s.youth_count || 0;
  const children = s.children_count || 0;
  const date = sheetDay(s);
  const typeName = s.expand?.service?.name || serviceTypeName(snapshot, slug);
  return {
    id: s.id,
    serviceName: date ? `${typeName} (${format(parseISO(date), 'dd/MM')})` : typeName,
    serviceTypeName: serviceTypeName(snapshot, slug),
    serviceType: slug,
    date,
    status: s.status,
    men,
    women,
    youth,
    children,
    // Règle d'or : TOTAL = H + F + J + E (les nouveaux visiteurs ne sont JAMAIS additionnés)
    total: men + women + youth + children,
    newVisitors: s.new_visitors_count || 0,
    salvations: s.salvations_count || 0,
  };
}

export function summarizeAttendance(snapshot: Snapshot, start: Date, end: Date) {
  const records = snapshot.sheets
    .filter((s) => inRange(sheetDay(s), start, end))
    .map((s) => sheetToRecord(snapshot, s))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalMen = sum(records, (r) => r.men);
  const totalWomen = sum(records, (r) => r.women);
  const totalYouth = sum(records, (r) => r.youth);
  const totalChildren = sum(records, (r) => r.children);
  const grandTotal = totalMen + totalWomen + totalYouth + totalChildren;
  const totalNewVisitors = sum(records, (r) => r.newVisitors);
  const totalSalvations = sum(records, (r) => r.salvations);
  const servicesCount = records.length;

  // Comparaison dynamique par programme (à partir des types officiels configurés)
  const slugs = Array.from(
    new Set([...snapshot.serviceTypes.map((t: any) => t.slug), ...records.map((r) => r.serviceType)].filter(Boolean))
  );
  const byType = slugs
    .map((slug, i) => {
      const list = records.filter((r) => r.serviceType === slug);
      const total = sum(list, (r) => r.total);
      return {
        type: serviceTypeName(snapshot, slug),
        code: slug,
        count: list.length,
        total,
        average: list.length ? Math.round(total / list.length) : 0,
        percentage: pct(total, grandTotal),
        color: PALETTE[i % PALETTE.length],
      };
    })
    .filter((t) => t.count > 0 || snapshot.serviceTypes.some((st: any) => st.slug === t.code && st.is_active !== false));

  const best = records.reduce<any>((b, r) => (!b || r.total > b.total ? r : b), null);
  const lowest = records.reduce<any>((l, r) => (!l || r.total < l.total ? r : l), null);

  return {
    records,
    servicesCount,
    grandTotal,
    totalMen,
    totalWomen,
    totalYouth,
    totalChildren,
    totalNewVisitors,
    totalSalvations,
    averagePerService: servicesCount ? Math.round(grandTotal / servicesCount) : 0,
    averageVisitorsPerService: servicesCount ? Math.round((totalNewVisitors / servicesCount) * 10) / 10 : 0,
    visitorRate: pct(totalNewVisitors, grandTotal, 1),
    byType,
    best,
    lowest,
    demographics: [
      { name: 'Femmes', count: totalWomen, percentage: pct(totalWomen, grandTotal), color: '#EC4899' },
      { name: 'Hommes', count: totalMen, percentage: pct(totalMen, grandTotal), color: '#3B82F6' },
      { name: 'Jeunes', count: totalYouth, percentage: pct(totalYouth, grandTotal), color: '#FFBC00' },
      { name: 'Enfants', count: totalChildren, percentage: pct(totalChildren, grandTotal), color: '#10B981' },
    ],
  };
}

// -----------------------------------------------------------------------------
// Finances
// -----------------------------------------------------------------------------
export function summarizeFinance(snapshot: Snapshot, start: Date, end: Date) {
  const entries = snapshot.entries.filter((e) => inRange(entryDay(e), start, end));
  const expenses = snapshot.expenses.filter((x) => inRange(expenseDay(x), start, end));

  const byCode = (code: string) => sum(entries.filter((e) => entryCategoryCode(e) === code), (e) => e.amount);
  const tithes = byCode('tithes');
  const ordinaryOfferings = byCode('offerings');
  const ordinaryEntries = entries.filter(isOrdinaryEntry);
  const ordinaryCombined = sum(ordinaryEntries, (e) => e.amount);

  // Ventilation des recettes ordinaires recalculée écriture par écriture selon la règle de l'église
  const { split: splitRule, remainderFund } = snapshot.platform.finance;
  const splitTotals = new Map<string, number>(splitRule.map((l) => [l.fundCode, 0]));
  for (const e of ordinaryEntries) {
    const split = calculateEntryAllocations(e.amount || 0, AllocationRule.STANDARD_SPLIT_80_10_10, undefined, splitRule, remainderFund);
    for (const a of split.allocations) splitTotals.set(a.fundCode, (splitTotals.get(a.fundCode) || 0) + a.amount);
  }
  const fundName = (code: string) => snapshot.treasury.funds.find((f: any) => f.account?.code === code)?.account?.name || code;
  const splitBreakdown = splitRule.map((l) => ({
    fundCode: l.fundCode,
    label: l.label || fundName(l.fundCode),
    percentage: l.percentage,
    amount: splitTotals.get(l.fundCode) || 0,
    isRemainder: l.fundCode === remainderFund,
  }));
  const generalFund = splitTotals.get(remainderFund) || 0;
  const titheOfTithes = splitTotals.get('TITHE_OF_TITHES') || 0;
  const welfareAid = splitTotals.get('WELFARE_AID') || 0;

  const buildingAuditorium = byCode('building');
  const friendsOfJesus = byCode('friends_of_jesus');
  const totalGross = sum(entries, (e) => e.amount);
  const otherDesignated = totalGross - ordinaryCombined - buildingAuditorium - friendsOfJesus;

  const byStatus = (status: string) => expenses.filter((x) => x.status === status);
  const paidList = byStatus('paid');
  const paid = sum(paidList, (x) => x.amount);
  const approved = sum(byStatus('approved'), (x) => x.amount);
  const pending = sum(byStatus('pending_approval'), (x) => x.amount);
  const rejected = sum(byStatus('rejected'), (x) => x.amount);

  const generalFundPaid = sum(
    paidList.filter((x) => x.expand?.fund_account?.code === 'GENERAL'),
    (x) => x.amount
  );

  const categoryTotals = new Map<string, number>();
  for (const x of paidList) {
    const name = expenseCategoryName(x);
    categoryTotals.set(name, (categoryTotals.get(name) || 0) + (x.amount || 0));
  }
  const byCategory = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount], i) => ({ name, amount, percentage: pct(amount, paid), color: PALETTE[i % PALETTE.length] }));

  const revenueCategoryTotals = new Map<string, { name: string; amount: number }>();
  for (const e of entries) {
    const code = entryCategoryCode(e) || 'other';
    const name = e.expand?.category?.name || 'Autres recettes';
    const cur = revenueCategoryTotals.get(code) || { name, amount: 0 };
    cur.amount += e.amount || 0;
    revenueCategoryTotals.set(code, cur);
  }
  const revenueByCategory = Array.from(revenueCategoryTotals.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([code, v], i) => ({ code, name: v.name, amount: v.amount, percentage: pct(v.amount, totalGross), color: PALETTE[i % PALETTE.length] }));

  const decided = expenses.filter((x) => ['approved', 'paid', 'rejected'].includes(x.status));
  const approvedOrPaidCount = decided.filter((x) => x.status !== 'rejected').length;
  const rejectedCount = decided.length - approvedOrPaidCount;

  return {
    entries,
    expenses,
    entriesCount: entries.length,
    totalGross,
    tithes,
    ordinaryOfferings,
    ordinaryCombined,
    split80_10_10: { generalFund, titheOfTithes, welfareAid },
    splitBreakdown,
    designated: {
      buildingAuditorium,
      friendsOfJesus,
      other: otherDesignated,
      total: buildingAuditorium + friendsOfJesus + otherDesignated,
    },
    revenueByCategory,
    expensesPaid: paid,
    expensesApproved: approved,
    expensesPending: pending,
    expensesRejected: rejected,
    generalFundPaid,
    byCategory,
    approvedCount: approvedOrPaidCount,
    rejectedCount,
    pendingCount: byStatus('pending_approval').length,
    approvalRate: pct(approvedOrPaidCount, decided.length, 1),
    rejectionRate: pct(rejectedCount, decided.length, 1),
  };
}

/** Tendances mensuelles sur les N derniers mois se terminant au mois de `end` */
export function monthlyFinanceTrends(snapshot: Snapshot, end: Date, months = 6) {
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const mStart = startOfMonth(subMonths(end, i));
    const mEnd = endOfMonth(mStart);
    const f = summarizeFinance(snapshot, mStart, mEnd);
    result.push({
      month: format(mStart, 'MMM yy', { locale: fr }),
      key: format(mStart, 'yyyy-MM'),
      tithes: f.tithes,
      offerings: f.ordinaryOfferings,
      building: f.designated.buildingAuditorium,
      friendsOfJesus: f.designated.friendsOfJesus,
      designated: f.designated.total,
      revenues: f.totalGross,
      paidExpenses: f.expensesPaid,
      expenses: f.expensesPaid,
      netFlow: f.totalGross - f.expensesPaid,
    });
  }
  return result;
}

// -----------------------------------------------------------------------------
// Activité récente (fil d'actualité du tableau de bord)
// -----------------------------------------------------------------------------
export function recentActivity(snapshot: Snapshot, includeFinance: boolean, limit = 6) {
  const items: { type: string; title: string; amount?: number; at: string; status: string }[] = [];

  for (const s of snapshot.sheets.slice(0, 20)) {
    const r = sheetToRecord(snapshot, s);
    items.push({
      type: 'attendance',
      title: `Fiche de présence : ${r.serviceTypeName} — ${r.total} participants`,
      at: s.created || s.service_date,
      status: s.status === 'validated' ? 'Validée' : 'Soumise',
    });
  }

  if (includeFinance) {
    for (const e of snapshot.entries.slice(0, 20)) {
      items.push({
        type: 'entry',
        title: `Recette ${e.entry_number || ''} — ${e.expand?.category?.name || 'Encaissement'}`,
        amount: e.amount,
        at: e.created || e.collected_at,
        status: 'Encaissée',
      });
    }
    const labels: Record<string, string> = {
      pending_approval: 'En attente',
      approved: 'Approuvée',
      rejected: 'Rejetée',
      paid: 'Payée',
      cancelled: 'Annulée',
    };
    for (const x of snapshot.expenses.slice(0, 20)) {
      items.push({
        type: 'expense',
        title: `Dépense ${x.expense_number || ''} — ${x.beneficiary || expenseCategoryName(x)}`,
        amount: x.amount,
        at: x.paid_at || x.approved_at || x.created,
        status: labels[x.status] || x.status,
      });
    }
  }

  return items
    .filter((i) => i.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, limit);
}

// -----------------------------------------------------------------------------
// Service principal
// -----------------------------------------------------------------------------
export class AnalyticsService {
  /** Tableau de bord exécutif (Leader, Admin, Auditeur) et vue Protocole sans finances */
  static async getDashboard(period: PeriodKey = 'this_month', customStart?: string, customEnd?: string, includeFinance = true) {
    const range = resolvePeriodDateRange(period, customStart, customEnd);
    const snapshot = await loadSnapshot({ finance: includeFinance });

    const att = summarizeAttendance(snapshot, range.startDate, range.endDate);
    const prevAtt = summarizeAttendance(snapshot, range.previousStartDate, range.previousEndDate);
    const lastSheet = snapshot.sheets[0] ? sheetToRecord(snapshot, snapshot.sheets[0]) : null;
    const buckets = buildBuckets(range.startDate, range.endDate);

    const attendance = {
      lastService: lastSheet
        ? {
            name: lastSheet.serviceTypeName,
            date: lastSheet.date,
            totalAttendance: lastSheet.total,
            menCount: lastSheet.men,
            womenCount: lastSheet.women,
            youthCount: lastSheet.youth,
            childrenCount: lastSheet.children,
            newVisitorsCount: lastSheet.newVisitors,
            salvationsCount: lastSheet.salvations,
          }
        : null,
      periodTotal: att.grandTotal,
      previousPeriodTotal: prevAtt.grandTotal,
      totalVariation: calculateMetricVariation(att.grandTotal, prevAtt.grandTotal),
      servicesCount: att.servicesCount,
      previousServicesCount: prevAtt.servicesCount,
      averagePerService: att.averagePerService,
      newVisitors: att.totalNewVisitors,
      previousNewVisitors: prevAtt.totalNewVisitors,
      salvations: att.totalSalvations,
      byServiceType: att.byType,
      bestService: att.best ? { name: att.best.serviceTypeName, date: att.best.date, total: att.best.total } : null,
      topServiceType: [...att.byType].sort((a, b) => b.total - a.total)[0] || null,
      recentServices: snapshot.sheets
        .slice(0, 8)
        .map((s) => sheetToRecord(snapshot, s))
        .reverse()
        .map((r) => ({ date: r.date, label: r.date ? format(parseISO(r.date), 'dd/MM') : '', total: r.total, newVisitors: r.newVisitors })),
      trend: buckets.map((b) => {
        const a = summarizeAttendance(snapshot, b.start, b.end);
        return { label: b.label, total: a.grandTotal, newVisitors: a.totalNewVisitors, services: a.servicesCount };
      }),
    };

    const base = {
      period,
      range: {
        start: format(range.startDate, 'yyyy-MM-dd'),
        end: format(range.endDate, 'yyyy-MM-dd'),
        label: range.label,
        previousLabel: range.previousLabel,
      },
      attendance,
      recentActivity: recentActivity(snapshot, includeFinance),
    };

    if (!includeFinance) return base;

    const fin = summarizeFinance(snapshot, range.startDate, range.endDate);
    const prevFin = summarizeFinance(snapshot, range.previousStartDate, range.previousEndDate);
    const pendingAll = snapshot.expenses.filter((x) => x.status === 'pending_approval');

    return {
      ...base,
      treasury: snapshot.treasury,
      finance: {
        revenues: fin.totalGross,
        previousRevenues: prevFin.totalGross,
        revenuesVariation: calculateMetricVariation(fin.totalGross, prevFin.totalGross),
        entriesCount: fin.entriesCount,
        previousEntriesCount: prevFin.entriesCount,
        expensesPaid: fin.expensesPaid,
        previousExpensesPaid: prevFin.expensesPaid,
        generalFundPaid: fin.generalFundPaid,
        previousGeneralFundPaid: prevFin.generalFundPaid,
        netCashFlow: fin.totalGross - fin.expensesPaid,
        previousNetCashFlow: prevFin.totalGross - prevFin.expensesPaid,
        approvedCount: fin.approvedCount,
        rejectedCount: fin.rejectedCount,
        approvalRate: fin.approvalRate,
        rejectionRate: fin.rejectionRate,
        revenueByCategory: fin.revenueByCategory,
        trend: buckets.map((b) => {
          const f = summarizeFinance(snapshot, b.start, b.end);
          return { label: b.label, revenues: f.totalGross, expenses: f.expensesPaid };
        }),
      },
      pendingApprovalsCount: pendingAll.length,
      pendingApprovalsTotalAmount: sum(pendingAll, (x) => x.amount),
    };
  }

  /** Tableau de bord Finances / Caisse */
  static async getFinanceDashboard(period: PeriodKey = 'this_month', customStart?: string, customEnd?: string) {
    const range = resolvePeriodDateRange(period, customStart, customEnd);
    const snapshot = await loadSnapshot();
    const fin = summarizeFinance(snapshot, range.startDate, range.endDate);
    const prevFin = summarizeFinance(snapshot, range.previousStartDate, range.previousEndDate);
    const fundBalance = (code: string) => snapshot.treasury.funds.find((f) => f.account.code === code)?.balance || 0;
    const buckets = buildBuckets(range.startDate, range.endDate);

    return {
      period,
      range: { start: format(range.startDate, 'yyyy-MM-dd'), end: format(range.endDate, 'yyyy-MM-dd'), label: range.label, previousLabel: range.previousLabel },
      totalRevenueMonth: fin.totalGross,
      previousRevenue: prevFin.totalGross,
      revenueVariation: calculateMetricVariation(fin.totalGross, prevFin.totalGross),
      totalExpensesMonth: fin.expensesPaid,
      previousExpenses: prevFin.expensesPaid,
      expensesVariation: calculateMetricVariation(fin.expensesPaid, prevFin.expensesPaid, false),
      netCashFlow: fin.totalGross - fin.expensesPaid,
      consolidatedCash: snapshot.treasury.consolidatedPhysicalBalance,
      generalFundAvailable: snapshot.treasury.generalFundFreeBalance,
      pendingCommitments: snapshot.treasury.pendingCommitmentsTotal,
      tithesSplitTotal: fin.split80_10_10.titheOfTithes,
      welfareAidTotal: fundBalance('WELFARE_AID'),
      buildingFundTotal: fundBalance('BUILDING'),
      split80_10_10: fin.split80_10_10,
      splitBreakdown: fin.splitBreakdown,
      revenueByCategory: fin.revenueByCategory,
      expensesByCategory: fin.byCategory,
      entriesCount: fin.entriesCount,
      pendingApprovalCount: fin.pendingCount,
      trend: buckets.map((b) => {
        const f = summarizeFinance(snapshot, b.start, b.end);
        return { label: b.label, revenues: f.totalGross, expenses: f.expensesPaid };
      }),
      funds: snapshot.treasury.funds,
    };
  }

  /** Tableau de bord Protocole (aucune donnée financière) */
  static async getAttendanceDashboard(period: PeriodKey = 'this_month', customStart?: string, customEnd?: string) {
    const range = resolvePeriodDateRange(period, customStart, customEnd);
    const snapshot = await loadSnapshot({ finance: false });
    const att = summarizeAttendance(snapshot, range.startDate, range.endDate);
    const prevAtt = summarizeAttendance(snapshot, range.previousStartDate, range.previousEndDate);
    const last = snapshot.sheets[0] ? sheetToRecord(snapshot, snapshot.sheets[0]) : null;
    const { getMinistrySettings } = await import('../routes/settings.routes.js');
    const capacity = (await getMinistrySettings().catch(() => null))?.venueCapacity || config.venueCapacity;
    const buckets = buildBuckets(range.startDate, range.endDate);

    return {
      period,
      range: { start: format(range.startDate, 'yyyy-MM-dd'), end: format(range.endDate, 'yyyy-MM-dd'), label: range.label, previousLabel: range.previousLabel },
      lastService: last,
      lastServiceTotal: last?.total || 0,
      men: last?.men || 0,
      women: last?.women || 0,
      youth: last?.youth || 0,
      children: last?.children || 0,
      newVisitors: last?.newVisitors || 0,
      salvations: last?.salvations || 0,
      venueCapacity: capacity || null,
      occupancyRate: capacity && last ? pct(last.total, capacity) : null,
      period_summary: {
        servicesCount: att.servicesCount,
        grandTotal: att.grandTotal,
        averagePerService: att.averagePerService,
        totalNewVisitors: att.totalNewVisitors,
        totalSalvations: att.totalSalvations,
        totalVariation: calculateMetricVariation(att.grandTotal, prevAtt.grandTotal),
        visitorsVariation: calculateMetricVariation(att.totalNewVisitors, prevAtt.totalNewVisitors),
      },
      demographics: att.demographics,
      byServiceType: att.byType,
      trend: buckets.map((b) => {
        const a = summarizeAttendance(snapshot, b.start, b.end);
        return { label: b.label, total: a.grandTotal, newVisitors: a.totalNewVisitors, salvations: a.totalSalvations };
      }),
      pendingValidationCount: snapshot.sheets.filter((s) => s.status === 'submitted').length,
    };
  }

  /**
   * Synthèse globale des indicateurs KPI Fréquentation + Finances avec variations
   */
  static async getOverview(period: PeriodKey = 'this_month', customStart?: string, customEnd?: string, includeFinance = true) {
    const range = resolvePeriodDateRange(period, customStart, customEnd);
    const snapshot = await loadSnapshot({ finance: includeFinance });

    const att = summarizeAttendance(snapshot, range.startDate, range.endDate);
    const prevAtt = summarizeAttendance(snapshot, range.previousStartDate, range.previousEndDate);
    const fin = summarizeFinance(snapshot, range.startDate, range.endDate);
    const prevFin = summarizeFinance(snapshot, range.previousStartDate, range.previousEndDate);

    const attendanceVar = calculateMetricVariation(att.grandTotal, prevAtt.grandTotal, true);
    const visitorsVar = calculateMetricVariation(att.totalNewVisitors, prevAtt.totalNewVisitors, true);
    const revenueVar = calculateMetricVariation(fin.totalGross, prevFin.totalGross, true);
    const expensesVar = calculateMetricVariation(fin.expensesPaid, prevFin.expensesPaid, false);

    const avgRevenue = att.servicesCount ? Math.round(fin.totalGross / att.servicesCount) : 0;
    const prevAvgRevenue = prevAtt.servicesCount ? Math.round(prevFin.totalGross / prevAtt.servicesCount) : 0;

    const insights: { id: string; type: string; category: string; title: string; description: string }[] = [];

    if (att.servicesCount === 0) {
      insights.push({
        id: 'ins-att-empty',
        type: 'info',
        category: 'attendance',
        title: 'Aucune fiche de présence sur la période',
        description: 'Saisissez les fiches de fréquentation après chaque culte pour alimenter les statistiques.',
      });
    } else {
      insights.push({
        id: 'ins-att',
        type: attendanceVar.isFavorable ? 'success' : 'warning',
        category: 'attendance',
        title: `Évolution de la fréquentation : ${attendanceVar.percentage >= 0 ? '+' : ''}${attendanceVar.percentage}%`,
        description: `La participation est passée de ${prevAtt.grandTotal.toLocaleString('fr-FR')} à ${att.grandTotal.toLocaleString('fr-FR')} participants (${att.servicesCount} culte(s)).`,
      });
      const top = [...att.byType].sort((a, b) => b.average - a.average)[0];
      if (top && top.count > 0) {
        insights.push({
          id: 'ins-top',
          type: 'info',
          category: 'attendance',
          title: 'Programme le plus fréquenté',
          description: `${top.type} enregistre la plus forte affluence moyenne avec ${top.average} participants par réunion.`,
        });
      }
    }

    if (includeFinance) {
      insights.push({
        id: 'ins-rev',
        type: revenueVar.isFavorable ? 'success' : 'neutral',
        category: 'finance',
        title: `Recettes brutes : ${revenueVar.percentage >= 0 ? '+' : ''}${revenueVar.percentage}%`,
        description: `Total de ${money(fin.totalGross)} encaissé (${fin.entriesCount} recette(s)), ventilation appliquée aux recettes ordinaires.`,
      });
      const pendingAll = snapshot.expenses.filter((x) => x.status === 'pending_approval');
      insights.push({
        id: 'ins-pending',
        type: pendingAll.length > 0 ? 'warning' : 'success',
        category: 'finance',
        title: pendingAll.length > 0 ? 'Dépenses en attente d’arbitrage' : 'Aucune dépense en attente',
        description:
          pendingAll.length > 0
            ? `${pendingAll.length} engagement(s) (${money(sum(pendingAll, (x) => x.amount))}) attendent la décision du Leader Principal.`
            : 'Toutes les demandes de dépenses ont été arbitrées.',
      });
    }

    return {
      period,
      range: {
        start: format(range.startDate, 'yyyy-MM-dd'),
        end: format(range.endDate, 'yyyy-MM-dd'),
        label: range.label,
        previousLabel: range.previousLabel,
      },
      kpis: {
        attendance: {
          total: attendanceVar,
          averagePerService: calculateMetricVariation(att.averagePerService, prevAtt.averagePerService, true),
          servicesCount: att.servicesCount,
          newVisitors: visitorsVar,
          averageVisitorsPerService: calculateMetricVariation(att.averageVisitorsPerService, prevAtt.averageVisitorsPerService, true),
          bestAttendanceService: att.best
            ? { name: att.best.serviceTypeName, date: att.best.date, total: att.best.total }
            : null,
        },
        finance: includeFinance
          ? {
              totalRevenues: revenueVar,
              tithes: fin.tithes,
              ordinaryOfferings: fin.ordinaryOfferings,
              ordinaryCombined: fin.ordinaryCombined,
              designatedBuilding: fin.designated.buildingAuditorium,
              designatedFriends: fin.designated.friendsOfJesus,
              paidExpenses: expensesVar,
              pendingCommitments: fin.expensesPending,
              averageRevenuePerService: calculateMetricVariation(avgRevenue, prevAvgRevenue, true),
              consolidatedPhysicalBalance: snapshot.treasury.consolidatedPhysicalBalance,
              generalFundFreeBalance: snapshot.treasury.generalFundFreeBalance,
            }
          : undefined,
      },
      insights,
    };
  }

  /**
   * Analyse détaillée de la fréquentation avec démographie, nouveaux visiteurs et records
   */
  static async getAttendanceAnalytics(period: PeriodKey = 'this_month', customStart?: string, customEnd?: string) {
    const range = resolvePeriodDateRange(period, customStart, customEnd);
    const snapshot = await loadSnapshot({ finance: false });
    const att = summarizeAttendance(snapshot, range.startDate, range.endDate);

    return {
      period,
      range: {
        label: range.label,
        start: format(range.startDate, 'yyyy-MM-dd'),
        end: format(range.endDate, 'yyyy-MM-dd'),
      },
      summary: {
        servicesCount: att.servicesCount,
        grandTotal: att.grandTotal,
        averagePerService: att.averagePerService,
        totalNewVisitors: att.totalNewVisitors,
        averageVisitorsPerService: att.averageVisitorsPerService,
        visitorRate: att.visitorRate,
        totalSalvations: att.totalSalvations,
      },
      demographics: att.demographics,
      serviceTypeComparison: att.byType,
      records: {
        best: { service: att.best?.serviceName || '—', date: att.best?.date || '', total: att.best?.total || 0 },
        lowest: { service: att.lowest?.serviceName || '—', date: att.lowest?.date || '', total: att.lowest?.total || 0 },
      },
      servicesList: att.records,
    };
  }

  /**
   * Évolution temporelle de la fréquentation (courbes multi-séries H/F/J/E/Total)
   */
  static async getAttendanceTrends(granularity: 'day' | 'week' | 'month' | 'quarter' = 'week', now: Date = new Date()) {
    const snapshot = await loadSnapshot({ finance: false });
    const buckets: Bucket[] = [];

    if (granularity === 'day') {
      for (let i = 29; i >= 0; i--) {
        const d = startOfDay(subDays(now, i));
        buckets.push({ key: format(d, 'yyyy-MM-dd'), label: format(d, 'dd/MM'), start: d, end: endOfDay(d) });
      }
    } else if (granularity === 'month') {
      for (let i = 11; i >= 0; i--) {
        const m = startOfMonth(subMonths(now, i));
        buckets.push({ key: format(m, 'yyyy-MM'), label: format(m, 'MMM yy', { locale: fr }), start: m, end: endOfMonth(m) });
      }
    } else if (granularity === 'quarter') {
      for (let i = 7; i >= 0; i--) {
        const q = startOfQuarter(subQuarters(now, i));
        buckets.push({ key: format(q, 'yyyy-QQQ'), label: `T${Math.floor(q.getMonth() / 3) + 1} ${format(q, 'yy')}`, start: q, end: endOfQuarter(q) });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const w = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        buckets.push({ key: format(w, 'yyyy-MM-dd'), label: `Sem. ${format(w, 'II')}`, start: w, end: endOfWeek(w, { weekStartsOn: 1 }) });
      }
    }

    return buckets.map((b) => {
      const a = summarizeAttendance(snapshot, b.start, b.end);
      return {
        period: b.label,
        men: a.totalMen,
        women: a.totalWomen,
        youth: a.totalYouth,
        children: a.totalChildren,
        total: a.grandTotal,
        newVisitors: a.totalNewVisitors,
        salvations: a.totalSalvations,
        services: a.servicesCount,
      };
    });
  }

  /**
   * Module Analyses Financières avancées
   */
  static async getFinancialAnalytics(period: PeriodKey = 'this_month', customStart?: string, customEnd?: string) {
    const range = resolvePeriodDateRange(period, customStart, customEnd);
    const snapshot = await loadSnapshot();
    const fin = summarizeFinance(snapshot, range.startDate, range.endDate);

    return {
      period,
      range: {
        label: range.label,
        start: format(range.startDate, 'yyyy-MM-dd'),
        end: format(range.endDate, 'yyyy-MM-dd'),
      },
      revenues: {
        totalGross: fin.totalGross,
        tithes: fin.tithes,
        ordinaryOfferings: fin.ordinaryOfferings,
        ordinaryCombined: fin.ordinaryCombined,
        split80_10_10: fin.split80_10_10,
        splitBreakdown: fin.splitBreakdown,
        designated: fin.designated,
        byCategory: fin.revenueByCategory,
      },
      expenses: {
        paid: fin.expensesPaid, // Seule sortie réelle de caisse
        approved: fin.expensesApproved,
        pending: fin.expensesPending,
        rejected: fin.expensesRejected,
        totalCommitted: fin.expensesPaid + fin.expensesApproved + fin.expensesPending,
        byCategory: fin.byCategory,
      },
      treasury: {
        consolidatedPhysicalBalance: snapshot.treasury.consolidatedPhysicalBalance,
        generalFundFreeBalance: snapshot.treasury.generalFundFreeBalance,
        pendingCommitmentsTotal: snapshot.treasury.pendingCommitmentsTotal,
      },
      monthlyTrends: monthlyFinanceTrends(snapshot, range.endDate, 6),
    };
  }

  /** Rapport périodique consolidé (page Rapports) */
  static async getReportSummary(period: PeriodKey = 'this_month', customStart?: string, customEnd?: string, includeFinance = true) {
    const range = resolvePeriodDateRange(period, customStart, customEnd);
    const snapshot = await loadSnapshot({ finance: includeFinance });
    const att = summarizeAttendance(snapshot, range.startDate, range.endDate);

    const attendance = {
      totalServicesOrganized: att.servicesCount,
      cumulativeAttendance: att.grandTotal,
      averagePerService: att.averagePerService,
      totalNewVisitors: att.totalNewVisitors,
      totalSalvations: att.totalSalvations,
      demographics: {
        menPercent: pct(att.totalMen, att.grandTotal),
        womenPercent: pct(att.totalWomen, att.grandTotal),
        youthPercent: pct(att.totalYouth, att.grandTotal),
        childrenPercent: pct(att.totalChildren, att.grandTotal),
      },
      byServiceType: att.byType,
    };

    const base = {
      period,
      range: { start: format(range.startDate, 'yyyy-MM-dd'), end: format(range.endDate, 'yyyy-MM-dd'), label: range.label },
      generatedAt: new Date().toISOString(),
      attendance,
    };
    if (!includeFinance) return base;

    const fin = summarizeFinance(snapshot, range.startDate, range.endDate);
    return {
      ...base,
      currency: snapshot.platform.locale.currencyLabel,
      financials: {
        totalGrossRevenues: fin.totalGross,
        ordinaryRevenues: fin.ordinaryCombined,
        splitBreakdown: fin.splitBreakdown,
        standardOfferingsSplit: {
          titheOfTithes_10pct: fin.split80_10_10.titheOfTithes,
          welfareAid_10pct: fin.split80_10_10.welfareAid,
          generalFund_80pct: fin.split80_10_10.generalFund,
        },
        designatedFundsCollected: fin.designated.total,
        totalExpensesCommitted: fin.expensesPaid + fin.expensesApproved + fin.expensesPending,
        totalExpensesPaid: fin.expensesPaid,
        pendingCommitments: snapshot.treasury.pendingCommitmentsTotal,
        consolidatedCashBalance: snapshot.treasury.consolidatedPhysicalBalance,
        revenueByCategory: fin.revenueByCategory,
        expensesByCategory: fin.byCategory,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Exports CSV (séparateur « ; » et BOM UTF-8 pour Excel FR)
  // ---------------------------------------------------------------------------
  static async buildAttendanceCsv(period?: PeriodKey, customStart?: string, customEnd?: string): Promise<string> {
    const snapshot = await loadSnapshot({ finance: false });
    let sheets = snapshot.sheets;
    if (period) {
      const range = resolvePeriodDateRange(period, customStart, customEnd);
      sheets = sheets.filter((s) => inRange(sheetDay(s), range.startDate, range.endDate));
    }
    const rows = sheets.map((s) => sheetToRecord(snapshot, s));
    return toCsv(
      ['Programme', 'Date', 'Statut', 'Hommes', 'Femmes', 'Jeunes', 'Enfants', 'Total_Participants', 'Nouveaux_Visiteurs', 'Decisions_Christ'],
      rows.map((r) => [r.serviceTypeName, r.date, r.status, r.men, r.women, r.youth, r.children, r.total, r.newVisitors, r.salvations])
    );
  }

  static async buildFinanceCsv(period?: PeriodKey, customStart?: string, customEnd?: string): Promise<string> {
    const snapshot = await loadSnapshot();
    let { entries, expenses } = snapshot;
    if (period) {
      const range = resolvePeriodDateRange(period, customStart, customEnd);
      entries = entries.filter((e) => inRange(entryDay(e), range.startDate, range.endDate));
      expenses = expenses.filter((x) => inRange(expenseDay(x), range.startDate, range.endDate));
    }
    const statusLabels: Record<string, string> = {
      validated: 'Validée',
      pending_approval: 'En attente',
      approved: 'Approuvée',
      rejected: 'Rejetée',
      paid: 'Payée',
      cancelled: 'Annulée',
    };
    const rows: (string | number)[][] = [
      ...entries.map((e) => [
        'RECETTE',
        e.entry_number,
        entryDay(e),
        e.expand?.category?.name || '',
        e.amount || 0,
        e.donor_name || '',
        e.payment_method || '',
        statusLabels[e.status] || e.status,
      ]),
      ...expenses.map((x) => [
        'DEPENSE',
        x.expense_number,
        expenseDay(x),
        expenseCategoryName(x),
        x.amount || 0,
        x.beneficiary || '',
        x.payment_method || '',
        statusLabels[x.status] || x.status,
      ]),
    ];
    rows.sort((a, b) => String(b[2]).localeCompare(String(a[2])));
    return toCsv(['Type', 'Numero', 'Date', 'Categorie', 'Montant', 'Donateur_ou_Beneficiaire', 'Mode_Paiement', 'Statut'], rows);
  }
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + [headers.join(';'), ...rows.map((r) => r.map(escape).join(';'))].join('\r\n');
}
