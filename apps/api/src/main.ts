import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { buildContainer } from './container.js';
import { createPrisma } from './prisma.js';

const config = loadConfig();
const prisma = createPrisma(config.databaseUrl);
await prisma.$connect();

const app = createApp(buildContainer(config, prisma), config);
const server = app.listen(config.port, () => {
  console.log(`API running at http://localhost:${config.port}/api (docs at /api/docs)`);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}
