import type { TaskStatus } from '../../../constants/task-status';
import type { ITask } from '../../tasks/models/task.model';
import type { IUser } from '../../users/models/user.model';

export interface DashboardStatsDto {
  total: number;
  backlog: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

export interface DashboardStageMetricDto {
  label: string;
  status: TaskStatus;
  count: number;
  percent: number;
}

export interface DashboardWorkloadDto extends DashboardStatsDto {
  user: IUser;
}

export interface DashboardOverviewDto {
  stats: DashboardStatsDto;
  stageMetrics: DashboardStageMetricDto[];
  recentTasks: ITask[];
  workload: DashboardWorkloadDto[];
}
