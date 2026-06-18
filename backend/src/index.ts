import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { initSocket } from './socket';
import { prisma } from './prisma';

async function main() {
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(config.port, () => {
    console.log(`🚀 Family Requests API listening on http://localhost:${config.port}`);
  });

  // Graceful shutdown.
  const shutdown = async () => {
    console.log('\nShutting down...');
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
