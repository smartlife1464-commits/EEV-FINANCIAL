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

  it('POST /api/auth/login permet au Leader Principal de se connecter', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'leader@espritvie.org',
        password: 'Leader2026!',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.token).toBeDefined();
    expect(body.user.role).toBe('lead_pastor');
    expect(body.user.permissions.canApproveExpense).toBe(true);
  });

  it('GET /api/dashboard/overview renvoie la trésorerie et la fréquentation pour le Leader', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/overview',
      headers: {
        authorization: 'Bearer dev-token-leader',
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
        authorization: 'Bearer dev-token-leader',
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
      headers: { authorization: 'Bearer dev-token-protocol' },
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

