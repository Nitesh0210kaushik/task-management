import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { configureSocket } from './realtime/socket';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      credentials: true
    }
  });

  configureSocket(io);
  app.set('io', io);

  server.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

