import { LEGACY_TASK_STATUSES, TASK_STATUSES, type TaskStatus } from '../../../constants/task-status';
import type { AuthUser } from '../../auth/types/auth.types';
import type { ITask } from '../../tasks/models/task.model';
import { TaskRepository } from '../../tasks/repositories/task.repository';
import { PermissionService } from '../../users/services/permission.service';
import type {
  DashboardOverviewDto,
  DashboardStageMetricDto,
  DashboardStatsDto,
  DashboardWorkloadDto
} from '../dtos/dashboard.dto';
import type { IUser } from '../../users/models/user.model';

const emptyStats = (): DashboardStatsDto => ({
  total: 0,
  backlog: 0,
  inProgress: 0,
  completed: 0,
  completionRate: 0
});

const isPopulatedUser = (value: unknown): value is IUser => {
  return Boolean(value && typeof value === 'object' && 'username' in value && 'email' in value);
};

export class DashboardService {
  private readonly taskRepository = new TaskRepository();
  private readonly permissionService = new PermissionService();

  async getOverview(currentUser: AuthUser): Promise<DashboardOverviewDto> {
    const visibilityQuery = await this.permissionService.getTaskVisibilityQuery(currentUser);
    const tasks = await this.taskRepository.findVisible(visibilityQuery);
    const stats = this.calculateStats(tasks);

    return {
      stats,
      stageMetrics: this.buildStageMetrics(stats),
      recentTasks: tasks.slice(0, 5),
      workload: this.buildWorkload(tasks)
    };
  }

  private calculateStats(tasks: ITask[]): DashboardStatsDto {
    const stats = emptyStats();

    for (const task of tasks) {
      const status = this.normalizeStatus(task.status);
      stats.total += 1;
      stats[status] += 1;
    }

    stats.completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
    return stats;
  }

  private buildStageMetrics(stats: DashboardStatsDto): DashboardStageMetricDto[] {
    const total = stats.total || 1;

    return [
      {
        label: 'Backlog',
        status: TASK_STATUSES.BACKLOG,
        count: stats.backlog,
        percent: Math.round((stats.backlog / total) * 100)
      },
      {
        label: 'In Progress',
        status: TASK_STATUSES.IN_PROGRESS,
        count: stats.inProgress,
        percent: Math.round((stats.inProgress / total) * 100)
      },
      {
        label: 'Done',
        status: TASK_STATUSES.COMPLETED,
        count: stats.completed,
        percent: Math.round((stats.completed / total) * 100)
      }
    ];
  }

  private buildWorkload(tasks: ITask[]): DashboardWorkloadDto[] {
    const workload = new Map<string, DashboardWorkloadDto>();

    for (const task of tasks) {
      const user = isPopulatedUser(task.assignedTo) ? task.assignedTo : null;

      if (!user) {
        continue;
      }

      const userId = user.id;
      const summary =
        workload.get(userId) ??
        ({
          user,
          ...emptyStats()
        } satisfies DashboardWorkloadDto);

      const status = this.normalizeStatus(task.status);
      summary.total += 1;
      summary[status] += 1;
      summary.completionRate = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0;
      workload.set(userId, summary);
    }

    return Array.from(workload.values()).sort((first, second) => second.total - first.total);
  }

  private normalizeStatus(status: TaskStatus | string): TaskStatus {
    return status === LEGACY_TASK_STATUSES.PENDING ? TASK_STATUSES.BACKLOG : (status as TaskStatus);
  }
}
