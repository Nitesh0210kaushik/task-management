import { Types } from 'mongoose';

export type UserRole = 'manager' | 'teamLead' | 'employee';

export interface AuthUser {
  id: string;
  _id: Types.ObjectId;
  username: string;
  email: string;
  role: UserRole;
  teamLeadId?: Types.ObjectId | null;
}

