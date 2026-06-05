export type UserRole = 'manager' | 'teamLead' | 'employee';
export type TaskStatus = 'pending' | 'completed';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  teamLeadId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdBy: User;
  assignedTo: User;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AuthPayload {
  username?: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TaskRealtimePayload {
  event: 'task:created' | 'task:updated' | 'task:deleted';
  taskId: string;
  task: Task;
}

