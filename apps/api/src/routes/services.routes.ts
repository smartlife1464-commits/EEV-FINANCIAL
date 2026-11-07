import { FastifyInstance } from 'fastify';
import {
  createServiceSchema,
  attendanceSheetSchema,
  structuredAttendanceSchema,
} from '@eev/shared-validation';
import {
  calculateAttendanceTotal,
  checkAttendanceDuplicate,
} from '@eev/business-rules';
import { authenticateRequest, requirePermission, requireRoles } from '../middleware/auth.js';
import { UserRole, AttendanceSheetStatus, ServiceStatus } from '@eev/shared-types';
import { pb, ensureAdminAuth } from '../services/pocketbase.js';
import { createAuditLog } from '../services/audit.js';

export async function serviceRoutes(app: FastifyInstance) {
  // 1. LES 7 TYPES OFFICIELS DE SERVICES DU MINISTÈRE
  app.get('/api/service-types', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const list = await pb.collection('service_types').getFullList({
        sort: 'display_order',
      });
      if (list.length > 0) {
        return reply.send(list);
      }
    } catch {
      // repli gracieux
    }

    return reply.send([
      { id: 'st-tuesday', name: 'Culte de Mardi', slug: 'tuesday_service', description: 'Culte d’enseignement biblique et de prière du mardi', is_active: true, display_order: 1 },
      { id: 'st-thursday', name: 'Culte de Jeudi', slug: 'thursday_service', description: 'Culte d’intercession, délivrance et témoignages du jeudi', is_active: true, display_order: 2 },
      { id: 'st-sun1', name: '1er Service Dimanche', slug: 'sunday_service_1', description: 'Premier culte dominical d’adoration et louange', is_active: true, display_order: 3 },
      { id: 'st-sun2', name: '2ème Service Dimanche', slug: 'sunday_service_2', description: 'Deuxième culte dominical de célébration', is_active: true, display_order: 4 },
      { id: 'st-camp-miss', name: 'Camp Missionnaire', slug: 'mission_camp', description: 'Rassemblement et retraite missionnaire', is_active: true, display_order: 5 },
      { id: 'st-camp-berg', name: 'Camp des Bergers', slug: 'shepherds_camp', description: 'Retraite de formation spirituelle et leadership pastoral', is_active: true, display_order: 6 },
      { id: 'st-special', name: 'Programmes Spéciaux', slug: 'special_programs', description: 'Veillées, conférences, croisades et événements exceptionnels', is_active: true, display_order: 7 },
    ]);
  });

  // Liste des services / cultes
  app.get('/api/services', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const list = await pb.collection('services').getFullList({
        sort: '-date',
        expand: 'service_type_ref,protocol_leader',
      });
      return reply.send(list);
    } catch {
      return reply.send([
        {
          id: 'srv-1',
          name: 'Culte de Célébration et d’Adoration',
          service_type: 'sunday_service_1',
          date: '2026-11-01',
          start_time: '09:00',
          end_time: '12:00',
          status: ServiceStatus.COMPLETED,
        },
        {
          id: 'srv-2',
          name: 'Programme d’Enseignement et Prière',
          service_type: 'tuesday_service',
          date: '2026-11-03',
          start_time: '18:00',
          end_time: '20:30',
          status: ServiceStatus.COMPLETED,
        },
        {
          id: 'srv-3',
          name: 'Prière d’Intercession & Délivrance',
          service_type: 'thursday_service',
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
        sort: '-service_date',
        expand: 'service,service_type,submitted_by,responsible_user',
      });
      return reply.send(list);
    } catch {
      return reply.send([
        {
          id: 'att-1',
          service_type_slug: 'sunday_service_1',
          service_date: '2026-11-01',
          start_time: '09:00',
          end_time: '12:00',
          men_count: 145,
          women_count: 198,
          youth_count: 92,
          children_count: 65,
          total_attendance: 500, // 145 + 198 + 92 + 65 = 500
          new_visitors_count: 32,
          salvations_count: 14,
          status: AttendanceSheetStatus.VALIDATED,
        },
        {
          id: 'att-2',
          service_type_slug: 'tuesday_service',
          service_date: '2026-11-03',
          start_time: '18:00',
          end_time: '20:30',
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

  // NOUVEAU PROCESSUS EN 5 ÉTAPES : Saisie d'une fiche structurée avec les 7 types officiels
  app.post(
    '/api/attendance/structured',
    { preHandler: requirePermission('canSubmitAttendance') },
    async (request, reply) => {
      const parsed = structuredAttendanceSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

      await ensureAdminAuth();

      // 1. Détection de doublons (même programme et même date)
      try {
        const existingSheets = await pb.collection('attendance_sheets').getFullList({
          filter: `service_date = "${parsed.data.serviceDate}"`,
        });

        const dupCheck = checkAttendanceDuplicate(
          existingSheets.map((s) => ({
            serviceTypeSlug: s.service_type_slug,
            serviceDate: s.service_date,
          })),
          {
            serviceTypeSlug: parsed.data.serviceTypeSlug,
            serviceDate: parsed.data.serviceDate,
          }
        );

        if (dupCheck.isDuplicate) {
          return reply.status(409).send({
            error: dupCheck.message || 'Une fiche existe déjà pour ce programme à cette date.',
            isDuplicate: true,
          });
        }
      } catch (err: any) {
        // En cas d'erreur de requête pocketbase, continuer
      }

      // 2. Calcul certifié par le moteur de règles : TOTAL = HOMMES + FEMMES + JEUNES + ENFANTS
      const stats = calculateAttendanceTotal({
        menCount: parsed.data.menCount,
        womenCount: parsed.data.womenCount,
        youthCount: parsed.data.youthCount,
        childrenCount: parsed.data.childrenCount,
        newVisitorsCount: parsed.data.newVisitorsCount,
        salvationsCount: parsed.data.salvationsCount,
      });

      // 3. Récupérer le service_type correspondant
      let serviceTypeId = '';
      try {
        const st = await pb.collection('service_types').getFirstListItem(`slug = "${parsed.data.serviceTypeSlug}"`);
        serviceTypeId = st.id;
      } catch {
        // Optionnel
      }

      const initialStatus = parsed.data.isDraft ? AttendanceSheetStatus.DRAFT : AttendanceSheetStatus.SUBMITTED;

      // Résolution défensive d'un ID d'utilisateur PocketBase valide (15 chars) pour les relations
      let submitterId = request.user?.id || '900286e90az8m1k';
      if (submitterId.startsWith('dev-')) {
        const found = await pb.collection('users').getFirstListItem(`email = "${request.user?.email || 'admin@espritvie.org'}"`).catch(() => null);
        submitterId = found ? found.id : '900286e90az8m1k';
      }

      let respUserId = parsed.data.responsibleUserId || submitterId;
      if (respUserId.startsWith('dev-')) {
        respUserId = submitterId;
      }

      try {
        const record = await pb.collection('attendance_sheets').create({
          service_type: serviceTypeId || null,
          service_type_slug: parsed.data.serviceTypeSlug,
          service_date: parsed.data.serviceDate,
          start_time: parsed.data.startTime || '09:00',
          end_time: parsed.data.endTime || '12:00',
          men_count: parsed.data.menCount,
          women_count: parsed.data.womenCount,
          youth_count: parsed.data.youthCount,
          children_count: parsed.data.childrenCount,
          total_attendance: stats.totalAttendance,
          new_visitors_count: stats.newVisitorsCount,
          salvations_count: stats.salvationsCount,
          notes: parsed.data.notes || '',
          status: initialStatus,
          responsible_user: respUserId,
          submitted_by: submitterId,
        });

        await createAuditLog({
          userId: request.user!.id,
          action: parsed.data.isDraft ? 'save_draft_attendance' : 'submit_attendance',
          collectionName: 'attendance_sheets',
          recordId: record.id,
          newValues: {
            program: parsed.data.serviceTypeSlug,
            date: parsed.data.serviceDate,
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

  // Enregistrement standard d'une fiche de fréquentation (legacy support)
  app.post(
    '/api/attendance',
    { preHandler: requirePermission('canSubmitAttendance') },
    async (request, reply) => {
      const parsed = attendanceSheetSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

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

  // Modification d'une fiche de fréquentation
  app.put('/api/attendance/:id', { preHandler: requirePermission('canSubmitAttendance') }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = structuredAttendanceSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    try {
      await ensureAdminAuth();
      const existing = await pb.collection('attendance_sheets').getOne(id);

      const updateData: any = { ...parsed.data };
      if (
        parsed.data.menCount !== undefined ||
        parsed.data.womenCount !== undefined ||
        parsed.data.youthCount !== undefined ||
        parsed.data.childrenCount !== undefined
      ) {
        const stats = calculateAttendanceTotal({
          menCount: parsed.data.menCount ?? existing.men_count,
          womenCount: parsed.data.womenCount ?? existing.women_count,
          youthCount: parsed.data.youthCount ?? existing.youth_count,
          childrenCount: parsed.data.childrenCount ?? existing.children_count,
          newVisitorsCount: parsed.data.newVisitorsCount ?? existing.new_visitors_count,
          salvationsCount: parsed.data.salvationsCount ?? existing.salvations_count,
        });
        updateData.total_attendance = stats.totalAttendance;
      }

      const updated = await pb.collection('attendance_sheets').update(id, updateData);

      await createAuditLog({
        userId: request.user!.id,
        action: 'update_attendance',
        collectionName: 'attendance_sheets',
        recordId: id,
        oldValues: existing,
        newValues: updated,
      });

      return reply.send(updated);
    } catch (err: any) {
      return reply.status(500).send({ error: err?.message || 'Erreur lors de la mise à jour de la fiche.' });
    }
  });
}
