import type { Types } from 'mongoose';
import type { UserRole } from '../../../constants/roles';

export interface UserFilter {
  _id?: string | Types.ObjectId;
  role?: UserRole;
  teamLeadId?: string | Types.ObjectId | null;
}

