import { ServiceType, ServiceStatus, AttendanceSheetStatus } from './enums.js';

export interface Service {
  id: string;
  name: string;
  serviceType: ServiceType;
  date: string; // ISO date YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: ServiceStatus;
  description?: string;
  protocolLeaderId?: string;
  created: string;
  updated: string;
}

export interface ServiceTypeDefinition {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface AttendanceSheet {
  id: string;
  serviceId?: string;
  serviceTypeId?: string;
  serviceTypeSlug?: string;
  serviceDate: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  menCount: number;
  womenCount: number;
  youthCount: number;
  childrenCount: number;
  /**
   * TOTAL STRICT : menCount + womenCount + youthCount + childrenCount
   */
  totalAttendance: number;
  /**
   * INDICATEUR COMPLÉMENTAIRE : NE DOIT JAMAIS ÊTRE AJOUTÉ AU TOTAL
   */
  newVisitorsCount: number;
  salvationsCount: number;
  notes?: string;
  responsibleUserId?: string;
  submittedById: string;
  validatedById?: string;
  status: AttendanceSheetStatus;
  created: string;
  updated: string;
  serviceType?: ServiceTypeDefinition;
}

export interface AttendanceSummary {
  serviceId: string;
  serviceName: string;
  serviceType: ServiceType;
  date: string;
  menCount: number;
  womenCount: number;
  youthCount: number;
  childrenCount: number;
  totalAttendance: number;
  newVisitorsCount: number;
  salvationsCount: number;
}

