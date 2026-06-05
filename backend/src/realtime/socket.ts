import type { Server } from 'socket.io';
import { env } from '../config/env';
import { User } from '../modules/users/models/user.model';
import { parseCookieHeader } from '../modules/auth/utils/cookie.util';
import { verifyAccessToken } from '../modules/auth/utils/jwt.util';

export const configureSocket = (io: Server): void => {
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie);
      const token = socket.handshake.auth?.token ?? cookies[env.accessTokenCookieName];

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication token is required.'));
      }

      const payload = verifyAccessToken(token);
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
