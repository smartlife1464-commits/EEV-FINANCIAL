import { buildApp } from './app.js';
import { config } from './config.js';

async function start() {
  const app = await buildApp();

  try {
    const address = await app.listen({
      port: config.port,
      host: config.host,
    });
    console.log(`🚀 Serveur API Esprit & Vie démarré sur : ${address}`);
    console.log(`📑 Documentation Swagger interactive sur : ${address}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

