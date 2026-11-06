import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config.js';
import { authRoutes } from './routes/auth.routes.js';
import { serviceRoutes } from './routes/services.routes.js';
import { financeRoutes } from './routes/finance.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { reportRoutes } from './routes/reports.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'info' : 'warn',
    },
  });

  // CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Swagger OpenAPI Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Ministère Esprit & Vie — API Gestion Financière & Statistique',
        description: 'Spécification de l’API backend pour la plateforme EEV-FINANCIAL.',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${config.port}`,
          description: 'Serveur de développement local',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'EEV-FINANCIAL API',
    version: '1.0.0',
  }));

  // Enregistrement des routes métier
  await app.register(authRoutes);
  await app.register(serviceRoutes);
  await app.register(financeRoutes);
  await app.register(dashboardRoutes);
  await app.register(reportRoutes);
  await app.register(analyticsRoutes);

  return app;
}

