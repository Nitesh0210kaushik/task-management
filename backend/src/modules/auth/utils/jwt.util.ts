import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../../../config/env';
import type { AccessTokenPayload, AuthUser, RefreshTokenPayload, TokenPayload } from '../types/auth.types';

const assertObjectPayload = (payload: string | JwtPayload): JwtPayload => {
  if (typeof payload === 'string') {
    throw new Error('Invalid token payload.');
  }

  return payload;
};

const assertAccessTokenPayload = (payload: string | JwtPayload): AccessTokenPayload => {
  const value = assertObjectPayload(payload);

  if (value['type'] !== 'access' || typeof value.sub !== 'string' || typeof value['role'] !== 'string') {
    throw new Error('Invalid access token payload.');
  }

  return value as AccessTokenPayload;
};

const assertRefreshTokenPayload = (payload: string | JwtPayload): RefreshTokenPayload => {
  const value = assertObjectPayload(payload);

  if (
    value['type'] !== 'refresh' ||
    typeof value.sub !== 'string' ||
    typeof value['role'] !== 'string' ||
    typeof value['sid'] !== 'string' ||
    typeof value['jti'] !== 'string'
  ) {
    throw new Error('Invalid refresh token payload.');
  }

  return value as RefreshTokenPayload;
};

export const signAccessToken = (user: AuthUser): string => {
  const options: SignOptions = {
    expiresIn: env.accessTokenExpiresIn as SignOptions['expiresIn']
  };

  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      type: 'access'
    },
    env.accessTokenSecret,
    options
  );
};

export const signRefreshToken = (user: AuthUser, sessionId: string, refreshTokenId: string): string => {
  const options: SignOptions = {
    expiresIn: env.refreshTokenExpiresIn as SignOptions['expiresIn']
  };

  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      type: 'refresh',
      sid: sessionId,
      jti: refreshTokenId
    },
    env.refreshTokenSecret,
    options
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return assertAccessTokenPayload(jwt.verify(token, env.accessTokenSecret));
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return assertRefreshTokenPayload(jwt.verify(token, env.refreshTokenSecret));
};

export const signAuthToken = signAccessToken;
export const verifyAuthToken = (token: string): TokenPayload => verifyAccessToken(token);
