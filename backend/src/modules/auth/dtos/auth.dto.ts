import type { UserResponseDto } from '../../users/dtos/user.dto';
import type { UserRole } from '../../../constants/roles';

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface CreateAuthUserDto extends RegisterDto {
  role: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  token: string;
  user: UserResponseDto;
}

export interface SessionResponseDto {
  id: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}
