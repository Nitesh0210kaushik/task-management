import type { UserRole } from '../../../constants/roles';
import type { IUser } from '../models/user.model';

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'teamLead'>;
}

export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  teamLeadId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignTeamLeadDto {
  teamLeadId: string | null;
}

export const mapUserToResponse = (user: IUser): UserResponseDto => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  teamLeadId: user.teamLeadId?.toString() ?? null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});
