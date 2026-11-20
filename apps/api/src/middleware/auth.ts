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
  /** Administrateur de la plateforme : configure l'installation pour son église */
  isPlatformAdmin: boolean;
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

  // Jetons synthétiques réservés aux tests automatisés (NODE_ENV=test, jamais en développement ni en production)
  if (config.nodeEnv === 'test' && token.startsWith('test-token-')) {
    const role = token.slice('test-token-'.length) as UserRole;
    if (Object.values(UserRole).includes(role)) {
      request.user = { id: `test_${role}`, email: `${role}@test.local`, name: `Test ${role}`, role, isPlatformAdmin: false };
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
    if (rec.is_active === false) {
      reply.status(403).send({ error: 'Ce compte a été désactivé. Contactez l’administrateur.' });
      return;
    }
    request.user = {
      id: rec.id,
      email: rec.email,
      name: rec.name || rec.email,
      role: (rec.role as UserRole) || UserRole.PROTOCOL_AGENT,
      departmentId: rec.department || undefined,
      isPlatformAdmin: rec.is_platform_admin === true,
    };
  } catch (err: any) {
    if (err?.status === 0) {
      reply.status(503).send({ error: 'Service d’authentification indisponible (PocketBase injoignable).' });
      return;
    }
    reply.status(401).send({ error: 'Session expirée ou jeton invalide. Veuillez vous reconnecter.' });
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

/** Réservé à l'administrateur de la plateforme (console de configuration de l'installation) */
export async function requirePlatformAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    await authenticateRequest(request, reply);
    if (reply.sent) return;
  }
  if (!request.user?.isPlatformAdmin) {
    reply.status(403).send({ error: 'Accès réservé à l’administrateur de la plateforme.' });
  }
}
