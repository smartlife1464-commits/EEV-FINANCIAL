import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  pocketbaseUrl: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090',
  pbAdminEmail: process.env.POCKETBASE_ADMIN_EMAIL || 'admin@espritvie.org',
  pbAdminPassword: process.env.POCKETBASE_ADMIN_PASSWORD || 'AdminEspritVie2026!',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(','),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-eev-financial-2026-key',
};
