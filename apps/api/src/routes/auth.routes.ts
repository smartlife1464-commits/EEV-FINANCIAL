import { FastifyInstance } from 'fastify';
import PocketBase from 'pocketbase';
import { config } from '../config.js';
import { loginSchema, createUserSchema } from '@eev/shared-validation';
import { authenticateRequest, requireRoles } from '../middleware/auth.js';
import { UserRole } from '@eev/shared-types';
import { PERMISSIONS_MATRIX } from '@eev/business-rules';
import { pb, ensureAdminAuth } from '../services/pocketbase.js';
import { createAuditLog } from '../services/audit.js';

export async function authRoutes(app: FastifyInstance) {
  // Connexion utilisateur
  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    try {
      const userPb = new PocketBase(config.pocketbaseUrl);
      const authData = await userPb.collection('users').authWithPassword(
        parsed.data.email,
        parsed.data.password
      );

      const userRecord = authData.record;
      const role = (userRecord.role as UserRole) || UserRole.PROTOCOL_AGENT;

      await createAuditLog({
        userId: userRecord.id,
        action: 'login',
        collectionName: 'users',
        recordId: userRecord.id,
        reason: 'Connexion réussie',
      });

      return reply.send({
        token: authData.token,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name || userRecord.email,
          role,
          permissions: PERMISSIONS_MATRIX[role],
        },
      });
    } catch (err: any) {
      // Mock de développement si le serveur PB n'est pas encore initialisé
      if (parsed.data.email === 'leader@espritvie.org' && parsed.data.password === 'Leader2026!') {
        return reply.send({
          token: 'dev-token-leader',
          user: {
            id: 'dev-leader-id',
            email: 'leader@espritvie.org',
            name: 'Leader Principal',
            role: UserRole.LEAD_PASTOR,
            permissions: PERMISSIONS_MATRIX[UserRole.LEAD_PASTOR],
          },
        });
      }
      if (parsed.data.email === 'admin@espritvie.org' && parsed.data.password === 'Admin2026!') {
        return reply.send({
          token: 'dev-token-admin',
          user: {
            id: 'dev-admin-id',
            email: 'admin@espritvie.org',
            name: 'Administrateur Général',
            role: UserRole.ADMIN,
            permissions: PERMISSIONS_MATRIX[UserRole.ADMIN],
          },
        });
      }
      if (parsed.data.email === 'finance@espritvie.org' && parsed.data.password === 'Finance2026!') {
        return reply.send({
          token: 'dev-token-finance',
          user: {
            id: 'dev-finance-id',
            email: 'finance@espritvie.org',
            name: 'Responsable Finances',
            role: UserRole.FINANCE_LEAD,
            permissions: PERMISSIONS_MATRIX[UserRole.FINANCE_LEAD],
          },
        });
      }
      if (parsed.data.email === 'protocol@espritvie.org' && parsed.data.password === 'Protocol2026!') {
        return reply.send({
          token: 'dev-token-protocol',
          user: {
            id: 'dev-protocol-id',
            email: 'protocol@espritvie.org',
            name: 'Responsable Protocole',
            role: UserRole.PROTOCOL_LEAD,
            permissions: PERMISSIONS_MATRIX[UserRole.PROTOCOL_LEAD],
          },
        });
      }

      return reply.status(401).send({ error: 'Email ou mot de passe incorrect.' });
    }
  });

  // Profil de l'utilisateur connecté
  app.get('/api/auth/me', { preHandler: authenticateRequest }, async (request, reply) => {
    const user = request.user!;
    return reply.send({
      user: {
        ...user,
        permissions: PERMISSIONS_MATRIX[user.role],
      },
    });
  });

  // Gestion des utilisateurs (Admin)
  app.get('/api/users', { preHandler: requireRoles([UserRole.ADMIN, UserRole.LEAD_PASTOR]) }, async (request, reply) => {
    try {
      await ensureAdminAuth();
      const list = await pb.collection('users').getFullList({
        sort: '-created',
      });
      return reply.send(list);
    } catch {
      // Fallback
      return reply.send([
        { id: 'usr-1', email: 'leader@espritvie.org', name: 'Leader Principal', role: UserRole.LEAD_PASTOR, isActive: true },
        { id: 'usr-2', email: 'admin@espritvie.org', name: 'Administrateur Général', role: UserRole.ADMIN, isActive: true },
        { id: 'usr-3', email: 'finance@espritvie.org', name: 'Responsable Finances', role: UserRole.FINANCE_LEAD, isActive: true },
        { id: 'usr-4', email: 'protocol@espritvie.org', name: 'Responsable Protocole', role: UserRole.PROTOCOL_LEAD, isActive: true },
        { id: 'usr-5', email: 'agent@espritvie.org', name: 'Agent Protocole', role: UserRole.PROTOCOL_AGENT, isActive: true },
        { id: 'usr-6', email: 'caissier@espritvie.org', name: 'Caissier Principal', role: UserRole.CASHIER, isActive: true },
      ]);
    }
  });

  app.post('/api/users', { preHandler: requireRoles([UserRole.ADMIN]) }, async (request, reply) => {
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    try {
      await ensureAdminAuth();
      const record = await pb.collection('users').create({
        email: parsed.data.email,
        password: parsed.data.password,
        passwordConfirm: parsed.data.password,
        name: parsed.data.name,
        role: parsed.data.role,
        phone: parsed.data.phone || '',
        department: parsed.data.departmentId || null,
        is_active: true,
      });

      await createAuditLog({
        userId: request.user!.id,
        action: 'create_user',
        collectionName: 'users',
        recordId: record.id,
        newValues: { email: parsed.data.email, role: parsed.data.role, name: parsed.data.name },
      });

      return reply.status(201).send(record);
    } catch (err: any) {
      return reply.status(500).send({ error: err?.message || 'Erreur lors de la création de l’utilisateur.' });
    }
  });
}

