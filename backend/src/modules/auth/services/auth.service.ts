import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { env } from '../../../config/env';
import { HTTP_STATUS } from '../../../constants/http';
import { USER_ROLES } from '../../../constants/roles';
import { ApiError } from '../../../utils/ApiError';
import { mapUserToResponse } from '../../users/dtos/user.dto';
import type { IUser } from '../../users/models/user.model';
import type { UserResponseDto } from '../../users/dtos/user.dto';
import type { AuthResponseDto, LoginDto, RegisterDto, SessionResponseDto } from '../dtos/auth.dto';
import type { AuthUser } from '../types/auth.types';
import { SessionRepository } from '../repositories/session.repository';
import { AuthRepository } from '../repositories/auth.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { hashToken, tokenHashesEqual } from '../utils/token-hash.util';
import type { ISession } from '../models/session.model';

interface AuthContext {
  userAgent?: string;
  ip?: string;
}

interface AuthSessionResult extends AuthResponseDto {
  refreshToken: string;
}

export class AuthService {
  private readonly authRepository = new AuthRepository();
  private readonly sessionRepository = new SessionRepository();

  async register(payload: RegisterDto, context: AuthContext): Promise<AuthSessionResult> {
    const existingUser = await this.authRepository.findUserByEmail(payload.email);

    if (existingUser) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Email is already registered.');
    }

    const user = await this.authRepository.createUser({
      ...payload,
      role: USER_ROLES.EMPLOYEE
    });

    return this.createAuthPayload(user, context);
  }

  async login(payload: LoginDto, context: AuthContext): Promise<AuthSessionResult> {
    const user = await this.authRepository.findUserByEmailWithPassword(payload.email);

    if (!user || !(await user.comparePassword(payload.password))) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password.');
    }

    return this.createAuthPayload(user, context);
  }

  async refresh(refreshToken: string | undefined, context: AuthContext): Promise<AuthSessionResult> {
    if (!refreshToken) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token is required.');
    }

    let payload: ReturnType<typeof verifyRefreshToken>;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired refresh token.');
    }
    const session = await this.sessionRepository.findByIdWithToken(payload.sid, payload.sub);

    if (!session) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh session.');
    }

    if (session.revokedAt) {
      await this.sessionRepository.revokeAllForUser(payload.sub);
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token reuse detected. Please sign in again.');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessionRepository.revokeByIdForUser(payload.sid, payload.sub);
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh session expired. Please sign in again.');
    }

    const incomingTokenHash = hashToken(refreshToken);

    if (!tokenHashesEqual(incomingTokenHash, session.refreshTokenHash)) {
      await this.sessionRepository.revokeAllForUser(payload.sub);
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token reuse detected. Please sign in again.');
    }

    const user = await this.authRepository.findUserById(payload.sub);

    if (!user) {
      await this.sessionRepository.revokeAllForUser(payload.sub);
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authenticated user no longer exists.');
    }

    return this.rotateSession(user, session, context);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      await this.sessionRepository.revokeByIdForUser(payload.sid, payload.sub);
    } catch {
      // Logout should always clear client cookies even if the refresh token is already invalid.
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionRepository.revokeAllForUser(userId);
  }

  async listSessions(userId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.listActiveForUser(userId);
    return sessions.map((session) => this.mapSessionToResponse(session));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid session id.');
    }

    const session = await this.sessionRepository.revokeByIdForUser(sessionId, userId);

    if (!session) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Session not found.');
    }
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
    }

    return mapUserToResponse(user);
  }

  private async createAuthPayload(user: IUser, context: AuthContext): Promise<AuthSessionResult> {
    const authUser = this.mapUserToAuthUser(user);
    const accessToken = signAccessToken(authUser);
    const sessionId = new Types.ObjectId();
    const refreshTokenId = randomUUID();
    const refreshToken = signRefreshToken(authUser, sessionId.toString(), refreshTokenId);

    await this.sessionRepository.create({
      _id: sessionId,
      user: user._id,
      refreshTokenHash: hashToken(refreshToken),
      refreshTokenId,
      expiresAt: new Date(Date.now() + env.refreshTokenMaxAgeMs),
      userAgent: context.userAgent,
      ip: context.ip
    });

    return this.createAuthResponse(user, accessToken, refreshToken);
  }

  private async rotateSession(user: IUser, session: ISession, context: AuthContext): Promise<AuthSessionResult> {
    const authUser = this.mapUserToAuthUser(user);
    const accessToken = signAccessToken(authUser);
    const refreshTokenId = randomUUID();
    const refreshToken = signRefreshToken(authUser, session.id, refreshTokenId);

    session.refreshTokenHash = hashToken(refreshToken);
    session.refreshTokenId = refreshTokenId;
    session.lastUsedAt = new Date();
    session.userAgent = context.userAgent ?? session.userAgent;
    session.ip = context.ip ?? session.ip;

    await session.save();

    return this.createAuthResponse(user, accessToken, refreshToken);
  }

  private createAuthResponse(user: IUser, accessToken: string, refreshToken: string): AuthSessionResult {
    return {
      accessToken,
      token: accessToken,
      refreshToken,
      user: mapUserToResponse(user)
    };
  }

  private mapUserToAuthUser(user: IUser): AuthUser {
    const authUser = {
      id: user.id,
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      teamLeadId: user.teamLeadId
    };

    return authUser;
  }

  private mapSessionToResponse(session: ISession): SessionResponseDto {
    return {
      id: session.id,
      userAgent: session.userAgent,
      ip: session.ip,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt
    };
  }
}
