import { Server } from 'socket.io';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './config/logger';
import { configureSocket } from './realtime/socket';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`API running on port ${env.port}`);
  });
  const io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      credentials: true
    }
  });

  configureSocket(io);
  app.set('io', io);
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
