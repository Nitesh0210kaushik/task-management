import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../constants/http';
import { ApiError } from '../../../utils/ApiError';
import { apiResponse } from '../../../utils/ApiResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { AuthService } from '../services/auth.service';
import { clearAuthCookies, getRefreshTokenFromRequest, setAuthCookies } from '../utils/cookie.util';
import { loginSchema, registerSchema } from '../validations/auth.validation';

const authService = new AuthService();

const getAuthContext = (req: Request) => ({
  userAgent: req.get('user-agent'),
  ip: req.ip
});

const getRouteParam = (value: string | string[]): string => {
  return Array.isArray(value) ? value[0] : value;
};

const sendAuthResponse = (res: Response, statusCode: number, result: Awaited<ReturnType<AuthService['login']>>, message: string): void => {
  const { refreshToken, ...response } = result;
  setAuthCookies(res, response.accessToken, refreshToken);
  apiResponse(res, statusCode, response, message);
};

export const register = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const payload = registerSchema.parse(req.body);
  const result = await authService.register(payload, getAuthContext(req));

  sendAuthResponse(res, HTTP_STATUS.CREATED, result, 'Registration successful.');
});

export const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const payload = loginSchema.parse(req.body);
  const result = await authService.login(payload, getAuthContext(req));

  sendAuthResponse(res, HTTP_STATUS.OK, result, 'Login successful.');
});

export const refresh = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.refresh(getRefreshTokenFromRequest(req), getAuthContext(req));

  sendAuthResponse(res, HTTP_STATUS.OK, result, 'Session refreshed.');
});

export const logout = catchAsync(async (req: Request, res: Response): Promise<void> => {
  await authService.logout(getRefreshTokenFromRequest(req));
  clearAuthCookies(res);

  apiResponse(res, HTTP_STATUS.OK, { success: true }, 'Logout successful.');
});

export const logoutAll = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  await authService.logoutAll(req.user.id);
  clearAuthCookies(res);

  apiResponse(res, HTTP_STATUS.OK, { success: true }, 'All sessions logged out.');
});

export const listSessions = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const sessions = await authService.listSessions(req.user.id);
  apiResponse(res, HTTP_STATUS.OK, sessions);
});

export const revokeSession = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  await authService.revokeSession(req.user.id, getRouteParam(req.params.id));
  apiResponse(res, HTTP_STATUS.OK, { success: true }, 'Session revoked.');
});

export const getMe = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const user = await authService.getCurrentUser(req.user.id);
  apiResponse(res, HTTP_STATUS.OK, user);
});
