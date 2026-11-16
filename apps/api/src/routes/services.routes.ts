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
import { sendServiceError, pbString, withRelationsList } from '../utils/http.js';

export async function serviceRoutes(app: FastifyInstance) {
  // 1. LES 7 TYPES OFFICIELS DE SERVICES DU MINISTÈRE
  app.get('/api/service-types', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const list = await pb.collection('service_types').getFullList({ sort: 'display_order' });
      return reply.send(list.filter((t: any) => t.is_active !== false));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de charger les types de programmes.');
    }
  });

  // Liste des services / cultes
  app.get('/api/services', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const list = await pb.collection('services').getFullList({
        sort: '-date',
        expand: 'service_type_ref,protocol_leader',
      });
      return reply.send(withRelationsList(list));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de charger les cultes.');
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
        const typeRef = await pb
          .collection('service_types')
          .getFirstListItem(`slug = "${pbString(parsed.data.serviceType)}"`)
          .catch(() => null);
        const record = await pb.collection('services').create({
          name: parsed.data.name,
          service_type: parsed.data.serviceType,
          service_type_ref: typeRef?.id || '',
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
      } catch (err) {
        return sendServiceError(reply, err, 'Erreur lors de la création du culte.');
      }
    }
  );

  // Liste des fiches de fréquentation
  app.get('/api/attendance', { preHandler: authenticateRequest }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const list = await pb.collection('attendance_sheets').getFullList({
        sort: '-service_date,-created',
        expand: 'service,service_type,submitted_by,responsible_user,validated_by',
      });
      return reply.send(withRelationsList(list));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de charger les fiches de présence.');
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
          filter: `service_date = "${pbString(parsed.data.serviceDate)}"`,
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

        if (dupCheck.isDuplicate && !parsed.data.allowDuplicate) {
          return reply.status(409).send({
            error: dupCheck.message || 'Une fiche existe déjà pour ce programme à cette date.',
            isDuplicate: true,
          });
        }
      } catch (err) {
        return sendServiceError(reply, err, 'Impossible de vérifier les doublons de fiche.');
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
        const st = await pb.collection('service_types').getFirstListItem(`slug = "${pbString(parsed.data.serviceTypeSlug)}"`);
        serviceTypeId = st.id;
      } catch {
        // Optionnel
      }

      const initialStatus = parsed.data.isDraft ? AttendanceSheetStatus.DRAFT : AttendanceSheetStatus.SUBMITTED;

      const submitterId = request.user!.id;
      const respUserId = parsed.data.responsibleUserId || submitterId;

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

  // Modification d'une fiche de fréquentation (brouillon, soumise ou rejetée)
  app.put('/api/attendance/:id', { preHandler: requirePermission('canSubmitAttendance') }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = structuredAttendanceSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    try {
      await ensureAdminAuth();
      const existing = await pb.collection('attendance_sheets').getOne(id);

      if (existing.status === AttendanceSheetStatus.VALIDATED) {
        return reply.status(400).send({ error: 'Une fiche validée est verrouillée et ne peut plus être modifiée.' });
      }

      const d = parsed.data;
      const men = d.menCount ?? existing.men_count;
      const women = d.womenCount ?? existing.women_count;
      const youth = d.youthCount ?? existing.youth_count;
      const children = d.childrenCount ?? existing.children_count;
      const stats = calculateAttendanceTotal({
        menCount: men,
        womenCount: women,
        youthCount: youth,
        childrenCount: children,
        newVisitorsCount: d.newVisitorsCount ?? existing.new_visitors_count,
        salvationsCount: d.salvationsCount ?? existing.salvations_count,
      });

      // Correspondance camelCase → snake_case : auparavant les effectifs modifiés étaient ignorés
      const fieldMap: Record<string, unknown> = {
        service_type_slug: d.serviceTypeSlug,
        service_date: d.serviceDate,
        start_time: d.startTime,
        end_time: d.endTime,
        men_count: d.menCount,
        women_count: d.womenCount,
        youth_count: d.youthCount,
        children_count: d.childrenCount,
        new_visitors_count: d.newVisitorsCount,
        salvations_count: d.salvationsCount,
        notes: d.notes,
        responsible_user: d.responsibleUserId,
      };
      const updateData: Record<string, unknown> = Object.fromEntries(
        Object.entries(fieldMap).filter(([, v]) => v !== undefined)
      );
      updateData.total_attendance = stats.totalAttendance;
      if (d.isDraft !== undefined) {
        updateData.status = d.isDraft ? AttendanceSheetStatus.DRAFT : AttendanceSheetStatus.SUBMITTED;
      } else if (existing.status === AttendanceSheetStatus.REJECTED) {
        updateData.status = AttendanceSheetStatus.SUBMITTED;
      }

      const updated = await pb.collection('attendance_sheets').update(id, updateData);

      await createAuditLog({
        userId: request.user!.id,
        action: 'update_attendance',
        collectionName: 'attendance_sheets',
        recordId: id,
        oldValues: { men: existing.men_count, women: existing.women_count, youth: existing.youth_count, children: existing.children_count, total: existing.total_attendance, status: existing.status },
        newValues: updateData,
      });

      return reply.send(updated);
    } catch (err) {
      return sendServiceError(reply, err, 'Erreur lors de la mise à jour de la fiche.');
    }
  });

  // Validation / rejet d'une fiche par le Responsable Protocole (ou la Direction)
  app.post(
    '/api/attendance/:id/validate',
    { preHandler: requirePermission('canValidateAttendance') },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { decision = 'validate', reason } = (request.body as { decision?: 'validate' | 'reject'; reason?: string }) || {};

      try {
        await ensureAdminAuth();
        const sheet = await pb.collection('attendance_sheets').getOne(id);
        if (sheet.status !== AttendanceSheetStatus.SUBMITTED) {
          return reply.status(400).send({ error: `Seule une fiche soumise peut être validée (statut actuel : ${sheet.status}).` });
        }
        if (decision === 'reject' && !reason?.trim()) {
          return reply.status(400).send({ error: 'Le motif du rejet est obligatoire.' });
        }
        // Contrôle à 4 yeux : l'auteur d'une fiche ne la valide pas lui-même
        if (sheet.submitted_by === request.user?.id) {
          return reply.status(403).send({ error: 'Contrôle à 4 yeux : vous ne pouvez pas valider une fiche que vous avez saisie.' });
        }

        const newStatus = decision === 'reject' ? AttendanceSheetStatus.REJECTED : AttendanceSheetStatus.VALIDATED;
        const updated = await pb.collection('attendance_sheets').update(id, {
          status: newStatus,
          validated_by: request.user!.id,
          notes: decision === 'reject' ? `${sheet.notes ? sheet.notes + '\n' : ''}[Rejet] ${reason}` : sheet.notes,
        });

        await createAuditLog({
          userId: request.user!.id,
          action: decision === 'reject' ? 'reject_attendance' : 'validate_attendance',
          collectionName: 'attendance_sheets',
          recordId: id,
          oldValues: { status: sheet.status },
          newValues: { status: newStatus },
          reason,
        });

        return reply.send(updated);
      } catch (err) {
        return sendServiceError(reply, err, 'Erreur lors de la validation de la fiche.');
      }
    }
  );
}
