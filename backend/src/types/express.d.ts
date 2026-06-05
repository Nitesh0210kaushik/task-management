import type { AuthUser } from '../modules/auth/types/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
