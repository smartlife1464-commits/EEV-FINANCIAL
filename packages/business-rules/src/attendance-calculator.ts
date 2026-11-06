export interface AttendanceCounts {
  menCount: number;
  womenCount: number;
  youthCount: number;
  childrenCount: number;
  newVisitorsCount: number;
  salvationsCount?: number;
}

export interface AttendanceCalculationResult {
  totalAttendance: number;
  newVisitorsCount: number;
  salvationsCount: number;
  isConsistent: boolean;
}

/**
 * Calcule le total strict des présences au culte.
 * RÈGLE D'OR :
 * TOTAL = HOMMES + FEMMES + JEUNES + ENFANTS
 * Les nouveaux visiteurs sont un indicateur analytique complémentaire
 * et ne doivent JAMAIS être additionnés au total.
 */
export function calculateAttendanceTotal(counts: AttendanceCounts): AttendanceCalculationResult {
  const men = Math.max(0, Math.floor(counts.menCount || 0));
  const women = Math.max(0, Math.floor(counts.womenCount || 0));
  const youth = Math.max(0, Math.floor(counts.youthCount || 0));
  const children = Math.max(0, Math.floor(counts.childrenCount || 0));
  const newVisitors = Math.max(0, Math.floor(counts.newVisitorsCount || 0));
  const salvations = Math.max(0, Math.floor(counts.salvationsCount || 0));

  const total = men + women + youth + children;

  return {
    totalAttendance: total,
    newVisitorsCount: newVisitors,
    salvationsCount: salvations,
    isConsistent: total >= 0,
  };
}

