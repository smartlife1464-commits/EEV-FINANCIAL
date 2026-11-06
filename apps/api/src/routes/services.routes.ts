import { FastifyInstance } from 'fastify';
import { createServiceSchema, attendanceSheetSchema } from '@eev/shared-validation';
import { calculateAttendanceTotal } from '@eev/business-rules';
import { authenticateRequest, requirePermission, requireRoles } from '../middleware/auth.js';
import { UserRole, AttendanceSheetStatus, ServiceStatus } from '@eev/shared-types';
import { pb, ensureAdminAuth } from '../services/pocketbase.js';
import { createAuditLog } from '../services/audit.js';

export async function serviceRoutes(app: FastifyInstance) {
  // Liste des services / cultes
  app.get('/api/services', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const list = await pb.collection('services').getFullList({
        sort: '-date',
      });
      return reply.send(list);
    } catch {
      // Mock de repli
      return reply.send([
        {
          id: 'srv-1',
          name: 'Culte de Célébration et d’Adoration',
          service_type: 'sunday_service',
          date: '2026-11-01',
          start_time: '09:00',
          end_time: '12:00',
          status: ServiceStatus.COMPLETED,
        },
        {
          id: 'srv-2',
          name: 'Programme d’Enseignement et Prière',
          service_type: 'tuesday_program',
          date: '2026-11-03',
          start_time: '18:00',
          end_time: '20:30',
          status: ServiceStatus.COMPLETED,
        },
        {
          id: 'srv-3',
          name: 'Prière d’Intercession & Délivrance',
          service_type: 'thursday_program',
          date: '2026-11-05',
          start_time: '18:00',
          end_time: '20:30',
          status: ServiceStatus.COMPLETED,
        },
      ]);
    }
  });

  // Création d'un culte
  app.post(
    '/api/services',
    { preHandler: requirePermission('canCreateService') },
    async (request, reply) => {
      const parsed = createServiceSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

      try {
        await ensureAdminAuth();
        const record = await pb.collection('services').create({
          name: parsed.data.name,
          service_type: parsed.data.serviceType,
          date: parsed.data.date,
          start_time: parsed.data.startTime,
          end_time: parsed.data.endTime,
          status: parsed.data.status,
          description: parsed.data.description || '',
          protocol_leader: parsed.data.protocolLeaderId || request.user!.id,
        });

        await createAuditLog({
          userId: request.user!.id,
          action: 'create_service',
          collectionName: 'services',
          recordId: record.id,
          newValues: record,
        });

        return reply.status(201).send(record);
      } catch (err: any) {
        return reply.status(500).send({ error: err?.message || 'Erreur lors de la création du service.' });
      }
    }
  );

  // Liste des fiches de fréquentation
  app.get('/api/attendance', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const list = await pb.collection('attendance_sheets').getFullList({
        sort: '-created',
        expand: 'service,submitted_by',
      });
      return reply.send(list);
    } catch {
      // Mock de repli
      return reply.send([
        {
          id: 'att-1',
          service_id: 'srv-1',
          service_name: 'Culte de Célébration',
          date: '2026-11-01',
          men_count: 145,
          women_count: 198,
          youth_count: 92,
          children_count: 65,
          total_attendance: 500, // 145 + 198 + 92 + 65 = 500
          new_visitors_count: 32, // Non additionné au total
          salvations_count: 14,
          status: AttendanceSheetStatus.VALIDATED,
        },
        {
          id: 'att-2',
          service_id: 'srv-2',
          service_name: 'Programme du Mardi',
          date: '2026-11-03',
          men_count: 65,
          women_count: 110,
          youth_count: 45,
          children_count: 20,
          total_attendance: 240, // 65 + 110 + 45 + 20 = 240
          new_visitors_count: 8,
          salvations_count: 3,
          status: AttendanceSheetStatus.VALIDATED,
        },
      ]);
    }
  });

  // Enregistrement d'une fiche de fréquentation
  app.post(
    '/api/attendance',
    { preHandler: requirePermission('canSubmitAttendance') },
    async (request, reply) => {
      const parsed = attendanceSheetSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

      // Calcul certifié par le moteur de règles
      const stats = calculateAttendanceTotal(parsed.data);

      try {
        await ensureAdminAuth();
        const record = await pb.collection('attendance_sheets').create({
          service: parsed.data.serviceId,
          men_count: parsed.data.menCount,
          women_count: parsed.data.womenCount,
          youth_count: parsed.data.youthCount,
          children_count: parsed.data.childrenCount,
          total_attendance: stats.totalAttendance,
          new_visitors_count: stats.newVisitorsCount,
          salvations_count: stats.salvationsCount,
          notes: parsed.data.notes || '',
          status: AttendanceSheetStatus.SUBMITTED,
          submitted_by: request.user!.id,
        });

        await createAuditLog({
          userId: request.user!.id,
          action: 'submit_attendance',
          collectionName: 'attendance_sheets',
          recordId: record.id,
          newValues: {
            serviceId: parsed.data.serviceId,
            totalAttendance: stats.totalAttendance,
            newVisitors: stats.newVisitorsCount,
          },
        });

        return reply.status(201).send(record);
      } catch (err: any) {
        return reply.status(500).send({ error: err?.message || 'Erreur lors de l’enregistrement de la fiche.' });
      }
    }
  );
}
