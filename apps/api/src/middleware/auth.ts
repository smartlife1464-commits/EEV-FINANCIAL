import { FastifyRequest, FastifyReply } from 'fastify';
import PocketBase from 'pocketbase';
import { config } from '../config.js';
import { UserRole } from '@eev/shared-types';
import { PERMISSIONS_MATRIX } from '@eev/business-rules';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Authentification requise : token Bearer manquant.' });
    return;
  }

  const token = authHeader.substring(7);

  // Mode développement/test tokens
  if (['development', 'test'].includes(config.nodeEnv)) {
    if (token === 'dev-token-leader') {
      request.user = {
        id: 'dev-leader-id',
        email: 'leader@espritvie.org',
        name: 'Leader Principal',
        role: UserRole.LEAD_PASTOR,
      };
      return;
    }
    if (token === 'dev-token-admin') {
      request.user = {
        id: 'dev-admin-id',
        email: 'admin@espritvie.org',
        name: 'Administrateur Général',
        role: UserRole.ADMIN,
      };
      return;
    }
    if (token === 'dev-token-finance') {
      request.user = {
        id: 'dev-finance-id',
        email: 'finance@espritvie.org',
        name: 'Responsable Finances',
        role: UserRole.FINANCE_LEAD,
      };
      return;
    }
    if (token === 'dev-token-protocol') {
      request.user = {
        id: 'dev-protocol-id',
        email: 'protocol@espritvie.org',
        name: 'Responsable Protocole',
        role: UserRole.PROTOCOL_LEAD,
      };
      return;
    }
  }

  try {
    const userPb = new PocketBase(config.pocketbaseUrl);
    userPb.authStore.save(token, null);

    // Vérification du token auprès de PocketBase
    const authRecord = await userPb.collection('users').authRefresh();
    if (!authRecord || !authRecord.record) {
      reply.status(401).send({ error: 'Token invalide ou session expirée.' });
      return;
    }

    const rec = authRecord.record;
    request.user = {
      id: rec.id,
      email: rec.email,
      name: rec.name || rec.email,
      role: (rec.role as UserRole) || UserRole.PROTOCOL_AGENT,
      departmentId: rec.department || undefined,
    };
  } catch (err: any) {
    reply.status(401).send({ error: 'Échec de vérification du jeton d’authentification.' });
  }
}

export function requireRoles(roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      await authenticateRequest(request, reply);
      if (reply.sent) return;
    }

    if (!request.user || !roles.includes(request.user.role)) {
      reply.status(403).send({
        error: `Accès interdit : rôle '${request.user?.role}' non autorisé pour cette opération.`,
      });
    }
  };
}

export function requirePermission(permissionKey: keyof typeof PERMISSIONS_MATRIX[UserRole]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      await authenticateRequest(request, reply);
      if (reply.sent) return;
    }

    const userRole = request.user?.role;
    const permissions = userRole ? PERMISSIONS_MATRIX[userRole] : null;

    if (!permissions || !permissions[permissionKey]) {
      reply.status(403).send({
        error: `Accès interdit : permission '${permissionKey}' refusée pour le rôle '${userRole}'.`,
      });
    }
  };
}
