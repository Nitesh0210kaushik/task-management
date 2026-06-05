import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../../config/env';

const authCookieOptions = (maxAge: number, path: string): CookieOptions => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax',
  maxAge,
  path
});

const clearCookieOptions = (path: string): CookieOptions => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax',
  path
});

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie(env.accessTokenCookieName, accessToken, authCookieOptions(env.accessTokenMaxAgeMs, '/'));
  res.cookie(env.refreshTokenCookieName, refreshToken, authCookieOptions(env.refreshTokenMaxAgeMs, '/api/auth'));
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(env.accessTokenCookieName, clearCookieOptions('/'));
  res.clearCookie(env.refreshTokenCookieName, clearCookieOptions('/api/auth'));
};

export const getAccessTokenFromRequest = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  return cookies?.[env.accessTokenCookieName];
};

export const getRefreshTokenFromRequest = (req: Request): string | undefined => {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const body = req.body as { refreshToken?: unknown } | undefined;

  if (cookies?.[env.refreshTokenCookieName]) {
    return cookies[env.refreshTokenCookieName];
  }

  return typeof body?.refreshToken === 'string' ? body.refreshToken : undefined;
};

export const parseCookieHeader = (cookieHeader: string | undefined): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((cookies, item) => {
    const separatorIndex = item.indexOf('=');

    if (separatorIndex === -1) {
      return cookies;
    }

    const key = item.slice(0, separatorIndex).trim();
    const value = item.slice(separatorIndex + 1).trim();

    if (key) {
      cookies[key] = decodeURIComponent(value);
    }

    return cookies;
  }, {});
};
