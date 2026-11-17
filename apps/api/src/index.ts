import { buildApp } from './app.js';
import { config, assertProductionConfig } from './config.js';

async function start() {
  try {
    assertProductionConfig();
  } catch (err: any) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
  const app = await buildApp();

  try {
    const address = await app.listen({
      port: config.port,
      host: config.host,
    });
    console.log(`🚀 Serveur API démarré sur : ${address}`);
    console.log(`📑 Documentation Swagger interactive sur : ${address}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

