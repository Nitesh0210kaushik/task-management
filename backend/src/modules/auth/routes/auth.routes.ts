import { Router, type RequestHandler } from 'express';
import {
  getMe,
  listSessions,
  login,
  logout,
  logoutAll,
  refresh,
  register,
  revokeSession
} from '../controllers/auth.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

export const createAuthRouter = (credentialLimiter: RequestHandler): Router => {
  const authRouter = Router();

  authRouter.post('/register', credentialLimiter, register);
  authRouter.post('/login', credentialLimiter, login);
  authRouter.post('/refresh', refresh);
  authRouter.post('/logout', logout);
  authRouter.get('/me', authenticate, getMe);
  authRouter.post('/logout-all', authenticate, logoutAll);
  authRouter.get('/sessions', authenticate, listSessions);
  authRouter.delete('/sessions/:id', authenticate, revokeSession);

  return authRouter;
};
