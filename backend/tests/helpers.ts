import request from 'supertest';
import type { Types } from 'mongoose';
import { createApp } from '../src/app';
import { USER_ROLES, type UserRole } from '../src/constants/roles';
import { User, type IUser } from '../src/modules/users/models/user.model';

export const app = createApp();
export const api = request(app);
export const testPassword = 'Password123!';

let sequence = 0;

interface CreateTestUserOptions {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  teamLeadId?: Types.ObjectId | string | null;
}

export const uniqueEmail = (prefix: string): string => {
  sequence += 1;
  return `${prefix}.${Date.now()}.${sequence}@example.com`;
};

export const createTestUser = async (options: CreateTestUserOptions = {}): Promise<IUser> => {
  const role = options.role ?? USER_ROLES.EMPLOYEE;
  const username = options.username ?? `${role}-${sequence + 1}`;

  return User.create({
    username,
    email: options.email ?? uniqueEmail(role),
    password: options.password ?? testPassword,
    role,
    teamLeadId: options.teamLeadId ?? null
  });
};

export const loginTestUser = async (user: IUser) => {
  const response = await api.post('/api/auth/login').send({
    email: user.email,
    password: testPassword
  });

  return {
    response,
    token: response.body.data?.accessToken as string,
    user: response.body.data?.user
  };
};

export const bearer = (token: string): string => `Bearer ${token}`;

export const getRecordId = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  const record = value as { id?: unknown; _id?: unknown; toString?: () => string };

  if (typeof record.id === 'string') {
    return record.id;
  }

  if (typeof record._id === 'string') {
    return record._id;
  }

  return typeof record.toString === 'function' ? record.toString() : '';
};

export const seedWorkspace = async () => {
  const manager = await createTestUser({
    username: 'Demo Manager',
    email: uniqueEmail('manager'),
    role: USER_ROLES.MANAGER
  });
  const teamLead = await createTestUser({
    username: 'Demo Team Lead',
    email: uniqueEmail('lead'),
    role: USER_ROLES.TEAM_LEAD
  });
  const otherTeamLead = await createTestUser({
    username: 'Other Team Lead',
    email: uniqueEmail('other-lead'),
    role: USER_ROLES.TEAM_LEAD
  });
  const employee = await createTestUser({
    username: 'Demo Employee',
    email: uniqueEmail('employee'),
    role: USER_ROLES.EMPLOYEE,
    teamLeadId: teamLead._id
  });
  const outsideEmployee = await createTestUser({
    username: 'Outside Employee',
    email: uniqueEmail('outside-employee'),
    role: USER_ROLES.EMPLOYEE
  });

  return {
    manager,
    teamLead,
    otherTeamLead,
    employee,
    outsideEmployee
  };
};
