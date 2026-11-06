import { UserRole } from './enums.js';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string;
  avatar?: string;
  isActive: boolean;
  phone?: string;
  created: string;
  updated: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  leaderId?: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  collectionName: string;
  recordId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  created: string;
}

