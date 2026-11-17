import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from './app.js';
import { FastifyInstance } from 'fastify';

describe('API EEV-FINANCIAL Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health doit renvoyer status: ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('EEV-FINANCIAL API');
  });

  it('POST /api/auth/login refuse des identifiants invalides (aucun compte de démonstration)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'inconnu@example.org', password: 'MauvaisMotDePasse1!' },
    });
    expect([401, 503]).toContain(res.statusCode);
  });

  it('GET /api/platform/public expose la configuration publique sans authentification', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/platform/public' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.currency.label).toBeDefined();
    expect(typeof body.setupRequired).toBe('boolean');
  });

  it('PUT /api/platform/config est refusé à un utilisateur qui n’est pas admin plateforme', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/platform/config',
      headers: { authorization: 'Bearer test-token-admin' },
      payload: { modules: { analytics: false } },
    });
    expect(res.statusCode).toBe(403);
  });

  it('GET /api/dashboard/overview renvoie la trésorerie et la fréquentation pour le Leader', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/overview',
      headers: {
        authorization: 'Bearer test-token-lead_pastor',
      },
    });
    // 200 si PocketBase est démarré, 503 explicite sinon (plus jamais de données fictives)
    expect([200, 503]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      const body = JSON.parse(res.body);
      expect(body.treasury).toBeDefined();
      expect(body.finance).toBeDefined();
      expect(Array.isArray(body.attendance.byServiceType)).toBe(true);
      const last = body.attendance.lastService;
      if (last) {
        expect(last.totalAttendance).toBe(last.menCount + last.womenCount + last.youthCount + last.childrenCount);
      }
    }
  });

  it('GET /api/finance/overview renvoie la trésorerie consolidée et le détail analytique', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/finance/overview',
      headers: {
        authorization: 'Bearer test-token-lead_pastor',
      },
    });
    expect([200, 503]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      const body = JSON.parse(res.body);
      expect(body.consolidatedPhysicalBalance).toBeDefined();
      expect(Array.isArray(body.funds)).toBe(true);
    }
  });

  it('Interdit toute donnée financière au rôle Protocole', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/finance/overview',
      headers: { authorization: 'Bearer test-token-protocol_lead' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('Refuse l’accès aux endpoints protégés sans token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/overview',
    });
    expect(res.statusCode).toBe(401);
  });
});

