export type UserRole = 'manager' | 'teamLead' | 'employee';
export type TaskStatus = 'backlog' | 'inProgress' | 'completed';

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
  isDeleted?: boolean;
  deletedAt?: string | null;
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
}

export interface AuthResponse {
  accessToken: string;
  token: string;
  user: User;
}

export interface Session {
  id: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export type TaskRealtimeEvent = 'task:created' | 'task:updated' | 'task:deleted';

export interface TaskRealtimePayload {
  event: TaskRealtimeEvent;
  taskId: string;
  task: Task;
}

export interface Notification {
  id: string;
  recipient: string;
  actor?: string | null;
  event: TaskRealtimeEvent;
  taskId: string;
  title: string;
  message: string;
  status: TaskStatus;
  read: boolean;
  readAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardStats {
  total: number;
  backlog: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

export interface DashboardStageMetric {
  label: string;
  status: TaskStatus;
  count: number;
  percent: number;
}

export interface DashboardWorkload extends DashboardStats {
  user: User;
}

export interface DashboardOverview {
  stats: DashboardStats;
  stageMetrics: DashboardStageMetric[];
  recentTasks: Task[];
  workload: DashboardWorkload[];
}
