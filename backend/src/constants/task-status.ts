export const TASK_STATUSES = {
  BACKLOG: 'backlog',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed'
} as const;

export const LEGACY_TASK_STATUSES = {
  PENDING: 'pending'
} as const;

export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];

export const TASK_STATUS_VALUES = Object.values(TASK_STATUSES);
export const TASK_STATUS_VALUES_WITH_LEGACY = [...TASK_STATUS_VALUES, LEGACY_TASK_STATUSES.PENDING];
