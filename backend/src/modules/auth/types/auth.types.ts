import type { Types } from 'mongoose';
import type { UserRole } from '../../../constants/roles';

export interface AuthUser {
  id: string;
  _id: Types.ObjectId;
  username: string;
  email: string;
  role: UserRole;
  teamLeadId?: Types.ObjectId | null;
}

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  role: UserRole;
  type: 'refresh';
  sid: string;
  jti: string;
}

export type TokenPayload = AccessTokenPayload;
