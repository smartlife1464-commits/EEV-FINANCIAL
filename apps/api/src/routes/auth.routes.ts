import { FastifyInstance } from 'fastify';
import PocketBase from 'pocketbase';
import { config } from '../config.js';
import { loginSchema, createUserSchema } from '@eev/shared-validation';
import { authenticateRequest, requireRoles } from '../middleware/auth.js';
import { UserRole } from '@eev/shared-types';
import { PERMISSIONS_MATRIX } from '@eev/business-rules';
import { pb, ensureAdminAuth } from '../services/pocketbase.js';
import { createAuditLog } from '../services/audit.js';
import { sendServiceError } from '../utils/http.js';

/** Comptes de démonstration utilisables UNIQUEMENT en développement quand PocketBase est arrêté */
const DEV_ACCOUNTS: Record<string, { password: string; token: string; user: { id: string; email: string; name: string; role: UserRole } }> = {
  'leader@espritvie.org': { password: 'Leader2026!', token: 'dev-token-leader', user: { id: '88196e8a7d26spt', email: 'leader@espritvie.org', name: 'Pasteur Principal', role: UserRole.LEAD_PASTOR } },
  'admin@espritvie.org': { password: 'Admin2026!', token: 'dev-token-admin', user: { id: '900286e90az8m1k', email: 'admin@espritvie.org', name: 'Administrateur Général', role: UserRole.ADMIN } },
  'finance@espritvie.org': { password: 'Finance2026!', token: 'dev-token-finance', user: { id: '997whsmow930w37', email: 'finance@espritvie.org', name: 'Responsable Finances', role: UserRole.FINANCE_LEAD } },
  'caissier@espritvie.org': { password: 'Caissier2026!', token: 'dev-token-cashier', user: { id: '7lh063hmv9x4y5a', email: 'caissier@espritvie.org', name: 'Caissier Principal', role: UserRole.CASHIER } },
  'protocol@espritvie.org': { password: 'Protocol2026!', token: 'dev-token-protocol', user: { id: 'h070a28998183ge', email: 'protocol@espritvie.org', name: 'Responsable Protocole', role: UserRole.PROTOCOL_LEAD } },
  'agent@espritvie.org': { password: 'Agent2026!', token: 'dev-token-protocol_agent', user: { id: '91mui0shch2ehn5', email: 'agent@espritvie.org', name: 'Agent Protocole', role: UserRole.PROTOCOL_AGENT } },
  'auditeur@espritvie.org': { password: 'Auditeur2026!', token: 'dev-token-auditor', user: { id: '1515au79574ss4x', email: 'auditeur@espritvie.org', name: 'Auditeur / Contrôleur', role: UserRole.AUDITOR } },
};

/** Champs sûrs d'un utilisateur renvoyés au frontend */
function publicUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    phone: u.phone || '',
    department: u.department || '',
    is_active: u.is_active !== false,
    isActive: u.is_active !== false,
    verified: u.verified,
    created: u.created,
    updated: u.updated,
  };
}

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

      // Un compte désactivé par l'administration ne peut plus se connecter
      if (userRecord.is_active === false) {
        await createAuditLog({
          userId: userRecord.id,
          action: 'login_denied',
          collectionName: 'users',
          recordId: userRecord.id,
          reason: 'Tentative de connexion sur un compte désactivé',
          ipAddress: request.ip,
          userAgent: String(request.headers['user-agent'] || ''),
        });
        return reply.status(403).send({ error: 'Ce compte a été désactivé. Contactez l’administrateur.' });
      }

      const role = (userRecord.role as UserRole) || UserRole.PROTOCOL_AGENT;

      await createAuditLog({
        userId: userRecord.id,
        action: 'login',
        collectionName: 'users',
        recordId: userRecord.id,
        reason: 'Connexion réussie',
        ipAddress: request.ip,
        userAgent: String(request.headers['user-agent'] || ''),
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
      // PocketBase injoignable : message explicite plutôt qu'un faux « mot de passe incorrect »
      if (err?.status === 0) {
        // Mode démonstration hors-ligne réservé au développement local
        const devUser = config.isDevelopment ? DEV_ACCOUNTS[parsed.data.email] : undefined;
        if (devUser && devUser.password === parsed.data.password) {
          return reply.send({
            token: devUser.token,
            user: { ...devUser.user, permissions: PERMISSIONS_MATRIX[devUser.user.role] },
          });
        }
        return reply.status(503).send({ error: 'Service d’authentification indisponible. Réessayez dans un instant.' });
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
      const list = await pb.collection('users').getFullList({ sort: '-created' });
      return reply.send(list.map(publicUser));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de charger la liste des utilisateurs.');
    }
  });

  // Création d'utilisateurs par l'Admin Général ou le Superviseur Général (Leader Principal)
  app.post('/api/users', { preHandler: requireRoles([UserRole.ADMIN, UserRole.LEAD_PASTOR]) }, async (request, reply) => {
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

      return reply.status(201).send(publicUser(record));
    } catch (err: any) {
      const emailTaken = err?.response?.data?.email;
      if (emailTaken) {
        return reply.status(409).send({ error: 'Un compte existe déjà avec cette adresse email.' });
      }
      return sendServiceError(reply, err, 'Erreur lors de la création de l’utilisateur.');
    }
  });

  // Activation / Désactivation d'un compte utilisateur (Admin Général ou Superviseur Général)
  app.patch('/api/users/:id/status', { preHandler: requireRoles([UserRole.ADMIN, UserRole.LEAD_PASTOR]) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { is_active } = (request.body as { is_active?: boolean }) || {};

    if (id === request.user?.id && is_active === false) {
      return reply.status(400).send({ error: 'Vous ne pouvez pas désactiver votre propre compte.' });
    }

    try {
      await ensureAdminAuth();
      const updated = await pb.collection('users').update(id, {
        is_active: Boolean(is_active),
      });

      await createAuditLog({
        userId: request.user!.id,
        action: 'update_user_status',
        collectionName: 'users',
        recordId: id,
        newValues: { is_active: Boolean(is_active) },
      });

      return reply.send(publicUser(updated));
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de mettre à jour le statut du compte.');
    }
  });
}

