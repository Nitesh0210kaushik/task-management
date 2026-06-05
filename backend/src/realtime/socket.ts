import type { Server } from 'socket.io';
import { User } from '../models/User';
import { verifyAuthToken } from '../utils/jwt';

export const configureSocket = (io: Server): void => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication token is required.'));
      }

      const payload = verifyAuthToken(token);
      const user = await User.findById(payload.sub);

      if (!user) {
        return next(new Error('Authenticated user no longer exists.'));
      }

      socket.data.user = user;
      return next();
    } catch {
      return next(new Error('Invalid or expired authentication token.'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as { id: string; role: string };
    socket.join(`user:${user.id}`);

    if (user.role === 'manager') {
      socket.join('role:manager');
    }
  });
};

