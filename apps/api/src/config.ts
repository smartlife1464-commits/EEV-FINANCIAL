import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv,
  isDevelopment: ['development', 'test'].includes(nodeEnv),
  pocketbaseUrl: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090',
  pbAdminEmail: process.env.POCKETBASE_ADMIN_EMAIL || '',
  pbAdminPassword: process.env.POCKETBASE_ADMIN_PASSWORD || '',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  /**
   * Jeton d'installation : exigé par l'assistant de première configuration pour créer l'administrateur
   * de la plateforme. Obligatoire en production (sinon n'importe qui atteignant le serveur le premier
   * pourrait s'approprier l'installation).
   */
  setupToken: process.env.SETUP_TOKEN || '',
  /** Messagerie sortante (codes de réinitialisation du mot de passe) */
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || '',
  },
  /** Capacité d'accueil de la salle (0 = non configurée → taux d'occupation masqué) */
  venueCapacity: parseInt(process.env.VENUE_CAPACITY || '0', 10) || 0,
  /** Base de prévision des encaissements mensuels (0 = moyenne réelle des 3 derniers mois) */
  forecastMonthlyInflow: parseInt(process.env.FORECAST_MONTHLY_INFLOW || '0', 10) || 0,
};

/** Vérifications bloquantes au démarrage en production : aucun secret par défaut n'est accepté. */
export function assertProductionConfig(): void {
  if (config.isDevelopment) return;
  const problems: string[] = [];
  if (!config.pbAdminEmail || !config.pbAdminPassword) problems.push('POCKETBASE_ADMIN_EMAIL et POCKETBASE_ADMIN_PASSWORD sont requis.');
  if (config.pbAdminPassword && config.pbAdminPassword.length < 12) problems.push('POCKETBASE_ADMIN_PASSWORD doit faire au moins 12 caractères.');
  if (config.corsOrigin.includes('*')) problems.push('CORS_ORIGIN ne doit pas valoir « * » en production.');
  if (config.setupToken && config.setupToken.length < 16) problems.push('SETUP_TOKEN doit faire au moins 16 caractères.');
  if (problems.length) {
    throw new Error(`Configuration de production invalide :\n - ${problems.join('\n - ')}`);
  }
}
