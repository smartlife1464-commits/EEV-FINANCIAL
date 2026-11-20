import { FastifyInstance } from 'fastify';
import PocketBase from 'pocketbase';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { loginSchema, createUserSchema } from '@eev/shared-validation';
import { authenticateRequest, requireRoles } from '../middleware/auth.js';
import { UserRole } from '@eev/shared-types';
import { PERMISSIONS_MATRIX } from '@eev/business-rules';
import { pb, ensureAdminAuth } from '../services/pocketbase.js';
import { createAuditLog } from '../services/audit.js';
import { sendServiceError } from '../utils/http.js';
import { isMailConfigured, sendMail } from '../services/mailer.js';
import { clearAttempts, tooManyAttempts } from '../utils/rateLimit.js';
import { getMinistrySettings } from './settings.routes.js';

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
    is_platform_admin: u.is_platform_admin === true,
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
    const limitKey = `login:${request.ip}:${parsed.data.email.toLowerCase()}`;
    const wait = tooManyAttempts(limitKey, 8, 15 * 60 * 1000);
    if (wait) {
      return reply.status(429).send({ error: `Trop de tentatives. Réessayez dans ${Math.ceil(wait / 60)} minute(s).` });
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
      clearAttempts(limitKey);

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
          isPlatformAdmin: userRecord.is_platform_admin === true,
          permissions: PERMISSIONS_MATRIX[role],
        },
      });
    } catch (err: any) {
      // PocketBase injoignable : message explicite plutôt qu'un faux « mot de passe incorrect »
      if (err?.status === 0) {
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
      const target = await pb.collection('users').getOne(id);
      if (target.is_platform_admin === true && !request.user!.isPlatformAdmin) {
        return reply.status(403).send({ error: 'Seul l’administrateur de la plateforme peut modifier ce compte.' });
      }
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

  // Réinitialisation du mot de passe par l'administration (repli quand la messagerie n'est pas configurée)
  app.post('/api/users/:id/password', { preHandler: requireRoles([UserRole.ADMIN, UserRole.LEAD_PASTOR]) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { password } = (request.body as { password?: string }) || {};
    if (!password || password.length < 8) {
      return reply.status(400).send({ error: 'Le mot de passe doit comporter au moins 8 caractères.' });
    }
    try {
      await ensureAdminAuth();
      const target = await pb.collection('users').getOne(id);
      // Seul un administrateur plateforme peut modifier le mot de passe d'un autre administrateur plateforme
      if (target.is_platform_admin === true && !request.user!.isPlatformAdmin) {
        return reply.status(403).send({ error: 'Seul l’administrateur de la plateforme peut modifier ce compte.' });
      }
      await pb.collection('users').update(id, { password, passwordConfirm: password });
      await createAuditLog({
        userId: request.user!.id,
        action: 'admin_password_reset',
        collectionName: 'users',
        recordId: id,
        reason: `Mot de passe réinitialisé par ${request.user!.email}`,
      });
      return reply.send({ success: true });
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de réinitialiser le mot de passe.');
    }
  });

  // --- Réinitialisation de mot de passe par code à 6 chiffres envoyé par email ---
  const otpStore = new Map<
    string,
    { otp: string; expiresAt: number; attempts: number; resetToken?: string; resetTokenExpiresAt?: number }
  >();
  const MAX_OTP_ATTEMPTS = 5;

  const findUserByEmail = async (email: string) => {
    await ensureAdminAuth();
    const records = await pb.collection('users').getList(1, 1, { filter: pb.filter('email = {:email}', { email }) });
    return records.items[0] || null;
  };

  // 1. Demande d'envoi du code
  app.post('/api/auth/request-password-reset', async (request, reply) => {
    const { email } = (request.body as { email?: string }) || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return reply.status(400).send({ error: 'Adresse email invalide.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (tooManyAttempts(`otp-request:${request.ip}`, 5, 15 * 60 * 1000)) {
      return reply.status(429).send({ error: 'Trop de demandes. Réessayez dans quelques minutes.' });
    }
    const genericMessage = 'Si cette adresse est rattachée à un compte actif, un code de vérification y a été envoyé.';

    if (!isMailConfigured() && !config.isDevelopment) {
      return reply.status(503).send({
        error: 'L’envoi d’emails n’est pas configuré sur ce serveur. Demandez à votre administrateur de réinitialiser votre mot de passe.',
      });
    }

    let user: any = null;
    try {
      user = await findUserByEmail(normalizedEmail);
    } catch (err) {
      return sendServiceError(reply, err, 'Service indisponible. Réessayez dans un instant.');
    }
    // Ne jamais divulguer l'existence d'un compte
    if (!user || user.is_active === false) {
      return reply.send({ success: true, message: genericMessage });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    otpStore.set(normalizedEmail, { otp, expiresAt: Date.now() + 15 * 60 * 1000, attempts: 0 });

    let devOtp: string | undefined;
    if (isMailConfigured()) {
      try {
        const platform = await getMinistrySettings().catch(() => null);
        await sendMail(
          normalizedEmail,
          'Votre code de réinitialisation',
          `Bonjour ${user.name || ''},\n\nVotre code de vérification est : ${otp}\nIl est valable 15 minutes.\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\n${platform?.name || ''}`
        );
      } catch (err) {
        otpStore.delete(normalizedEmail);
        return sendServiceError(reply, err, 'L’email n’a pas pu être envoyé. Réessayez plus tard ou contactez votre administrateur.');
      }
    } else {
      // Développement local sans messagerie : le code est renvoyé pour pouvoir tester le parcours
      devOtp = otp;
    }

    await createAuditLog({
      userId: user.id,
      action: 'password_reset_requested',
      collectionName: 'users',
      recordId: user.id,
      reason: 'Demande de code de réinitialisation',
      ipAddress: request.ip,
      userAgent: String(request.headers['user-agent'] || ''),
    });

    return reply.send({ success: true, message: genericMessage, devOtp });
  });

  // 2. Vérification du code (5 essais maximum)
  app.post('/api/auth/verify-otp', async (request, reply) => {
    const { email, otp } = (request.body as { email?: string; otp?: string }) || {};
    if (!email || !otp) {
      return reply.status(400).send({ error: 'L’email et le code sont obligatoires.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const record = otpStore.get(normalizedEmail);

    if (!record || record.expiresAt < Date.now()) {
      otpStore.delete(normalizedEmail);
      return reply.status(400).send({ error: 'Le code a expiré ou n’existe pas. Demandez un nouveau code.' });
    }
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(normalizedEmail);
      return reply.status(429).send({ error: 'Trop de tentatives. Demandez un nouveau code.' });
    }
    if (record.otp !== String(otp).trim()) {
      record.attempts += 1;
      return reply.status(400).send({
        error: `Code incorrect (${MAX_OTP_ATTEMPTS - record.attempts} essai(s) restant(s)).`,
      });
    }

    const resetToken = crypto.randomUUID();
    record.resetToken = resetToken;
    record.resetTokenExpiresAt = Date.now() + 15 * 60 * 1000;
    return reply.send({ success: true, message: 'Code validé.', resetToken });
  });

  // 3. Nouveau mot de passe
  app.post('/api/auth/reset-password', async (request, reply) => {
    const { email, resetToken, newPassword } = (request.body as { email?: string; resetToken?: string; newPassword?: string }) || {};
    if (!email || !resetToken || !newPassword) {
      return reply.status(400).send({ error: 'Paramètres incomplets pour la réinitialisation.' });
    }
    if (newPassword.length < 8) {
      return reply.status(400).send({ error: 'Le mot de passe doit comporter au moins 8 caractères.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const record = otpStore.get(normalizedEmail);
    if (!record || record.resetToken !== resetToken || !record.resetTokenExpiresAt || record.resetTokenExpiresAt < Date.now()) {
      return reply.status(400).send({ error: 'Jeton de réinitialisation invalide ou expiré.' });
    }

    try {
      const user = await findUserByEmail(normalizedEmail);
      if (!user) return reply.status(400).send({ error: 'Compte introuvable.' });
      await pb.collection('users').update(user.id, { password: newPassword, passwordConfirm: newPassword });
      otpStore.delete(normalizedEmail);
      await createAuditLog({
        userId: user.id,
        action: 'password_reset_completed',
        collectionName: 'users',
        recordId: user.id,
        reason: 'Mot de passe réinitialisé par code',
        ipAddress: request.ip,
        userAgent: String(request.headers['user-agent'] || ''),
      });
      return reply.send({ success: true, message: 'Votre mot de passe a été réinitialisé avec succès.' });
    } catch (err) {
      return sendServiceError(reply, err, 'Impossible de réinitialiser le mot de passe.');
    }
  });
}
