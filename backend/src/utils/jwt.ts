import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUser } from '../types/auth';

interface TokenPayload {
  sub: string;
  role: AuthUser['role'];
}

export const signAuthToken = (user: AuthUser): string => {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn']
  };

  return jwt.sign(
    {
      sub: user.id,
      role: user.role
    },
    env.jwtSecret,
    options
  );
};

export const verifyAuthToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
};
