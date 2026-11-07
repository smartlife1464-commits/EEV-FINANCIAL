export interface ExistingAttendanceRecord {
  serviceTypeSlug?: string;
  serviceDate: string;
  sessionId?: string;
}

export interface NewAttendanceRecord {
  serviceTypeSlug?: string;
  serviceDate: string;
  sessionId?: string;
}

export interface AttendanceDuplicateCheckResult {
  isDuplicate: boolean;
  message?: string;
}

/**
 * Détecte les doublons de fiches de présence pour le même type de service et la même date.
 * Si une session est spécifiée (pour cultes multiples le même jour), elle différencie les cultes.
 */
export function checkAttendanceDuplicate(
  existingSheets: ExistingAttendanceRecord[],
  newSheet: NewAttendanceRecord
): AttendanceDuplicateCheckResult {
  if (!newSheet.serviceDate || !newSheet.serviceTypeSlug) {
    return { isDuplicate: false };
  }

  const normalizedNewDate = newSheet.serviceDate.trim().split('T')[0];
  const normalizedNewType = newSheet.serviceTypeSlug.trim().toLowerCase();
  const newSession = (newSheet.sessionId || '').trim().toLowerCase();

  const duplicate = existingSheets.find((sheet) => {
    const existingDate = (sheet.serviceDate || '').trim().split('T')[0];
    const existingType = (sheet.serviceTypeSlug || '').trim().toLowerCase();
    const existingSession = (sheet.sessionId || '').trim().toLowerCase();

    const sameDateAndType = existingDate === normalizedNewDate && existingType === normalizedNewType;
    if (!sameDateAndType) return false;

    // Si pas de session spécifiée ou session identique -> doublon détecté
    if (!newSession && !existingSession) return true;
    return newSession === existingSession;
  });

  if (duplicate) {
    return {
      isDuplicate: true,
      message: `Une fiche de présence existe déjà pour le programme "${newSheet.serviceTypeSlug}" à la date du ${normalizedNewDate}.`,
    };
  }

  return { isDuplicate: false };
}
