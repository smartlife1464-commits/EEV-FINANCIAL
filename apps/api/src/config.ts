import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv,
  isDevelopment: ['development', 'test'].includes(nodeEnv),
  pocketbaseUrl: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090',
  pbAdminEmail: process.env.POCKETBASE_ADMIN_EMAIL || 'admin@espritvie.org',
  pbAdminPassword: process.env.POCKETBASE_ADMIN_PASSWORD || 'AdminEspritVie2026!',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-eev-financial-2026-key',
  /** Capacité d'accueil de la salle (0 = non configurée → taux d'occupation masqué) */
  venueCapacity: parseInt(process.env.VENUE_CAPACITY || '0', 10) || 0,
  /** Base de prévision des encaissements mensuels (0 = moyenne réelle des 3 derniers mois) */
  forecastMonthlyInflow: parseInt(process.env.FORECAST_MONTHLY_INFLOW || '0', 10) || 0,
};

if (!config.isDevelopment && config.pbAdminPassword === 'AdminEspritVie2026!') {
  console.warn(
    '⚠️ SÉCURITÉ : POCKETBASE_ADMIN_PASSWORD utilise la valeur par défaut. Définissez un mot de passe fort en production.'
  );
}
