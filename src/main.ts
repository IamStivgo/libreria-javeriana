// Load and validate env vars first — throws immediately if any are missing
import './util/env.js';

import { buildServer } from './infrastructure/api/server.js';
import { closeDatabasePool } from './configuration/database.js';
import { env } from './util/env.js';

const app = buildServer();

async function shutdown(signal: string): Promise<void> {
  console.info(`\n[main] Received ${signal} — graceful shutdown started`);

  try {
    await app.close();
    console.info('[main] Fastify server closed');
  } catch (err) {
    console.error('[main] Error closing Fastify server:', err);
  }

  try {
    await closeDatabasePool();
    console.info('[main] Database pool drained');
  } catch (err) {
    console.error('[main] Error draining DB pool:', err);
  }

  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  console.info(`[main] Server running on http://0.0.0.0:${env.PORT}`);
} catch (err) {
  console.error('[main] Failed to start server:', err);
  process.exit(1);
}
