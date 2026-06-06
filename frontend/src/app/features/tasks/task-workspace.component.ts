import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs';
import {
  LucideCheckCircle2,
  LucideGripVertical,
  LucideLayoutDashboard,
  LucideListFilter,
  LucideListTodo,
  LucidePencil,
  LucideSearch,
  LucideTrash2,
  LucideX
} from '@lucide/angular';
import { Task, TaskStatus, User } from '../../core/models';
import { TaskService } from '../../core/task.service';
import { ToastService } from '../../core/toast.service';

type TaskFilter = TaskStatus | 'all';
type TaskViewMode = 'kanban' | 'list';

@Component({
  selector: 'app-task-workspace',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideCheckCircle2,
    LucideGripVertical,
    LucideLayoutDashboard,
    LucideListFilter,
    LucideListTodo,
    LucidePencil,
    LucideSearch,
    LucideTrash2,
    LucideX
  ],
  templateUrl: './task-workspace.component.html',
  styleUrl: './task-workspace.component.scss'
})
export class TaskWorkspaceComponent implements OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly toast = inject(ToastService);
  private localTasks: Task[] = [];
  private readonly searchTermChanges = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  private lastAppliedSearch: string | null = null;

  @Input() isLoading = false;
  @Input() currentUser: User | null = null;

  @Input()
  set tasks(value: Task[] | null) {
    this.localTasks = value ?? [];
  }

  get tasks(): Task[] {
    return this.localTasks;
  }

  @Output() editRequested = new EventEmitter<Task>();
  @Output() taskChanged = new EventEmitter<void>();
  @Output() statusFilterChanged = new EventEmitter<TaskStatus | null>();
  @Output() searchChanged = new EventEmitter<string | null>();

  filter: TaskFilter = 'all';
  taskView: TaskViewMode = 'kanban';
  searchInput = '';
  draggedTaskId: string | null = null;
  dragTargetStatus: TaskStatus | null = null;
  taskPendingDelete: Task | null = null;
  isDeletingTask = false;

  constructor() {
    this.searchTermChanges
      .pipe(
        debounceTime(500),
        map((value) => {
          const normalizedSearch = value.trim();
          return normalizedSearch.length >= 3 ? normalizedSearch : null;
        }),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((normalizedSearch) => {
        if (normalizedSearch === null && this.lastAppliedSearch === null) {
          return;
        }

        this.lastAppliedSearch = normalizedSearch;
        this.searchChanged.emit(normalizedSearch);
      });
  }

  get displayedTasks(): Task[] {
    return this.tasks.filter((task) => {
      const matchesStatus = this.filter === 'all' || this.normalizedStatus(task) === this.filter;
      return matchesStatus;
    });
  }

  get displayedBacklogTasks(): Task[] {
    return this.displayedTasks.filter((task) => this.normalizedStatus(task) === 'backlog');
  }

  get displayedInProgressTasks(): Task[] {
    return this.displayedTasks.filter((task) => this.normalizedStatus(task) === 'inProgress');
  }

  get displayedCompletedTasks(): Task[] {
    return this.displayedTasks.filter((task) => this.normalizedStatus(task) === 'completed');
  }

  canManageTask(task: Task): boolean {
    if (!this.currentUser) {
      return false;
    }

    if (this.currentUser.role === 'manager' || this.currentUser.role === 'teamLead') {
      return true;
    }

    return task.assignedTo.id === this.currentUser.id;
  }

  setTaskView(view: TaskViewMode): void {
    this.taskView = view;
  }

  changeSearchTerm(value: string): void {
    this.searchInput = value;
    this.searchTermChanges.next(value);
  }

  changeFilter(filter: TaskFilter): void {
    this.filter = filter;
    this.statusFilterChanged.emit(filter === 'all' ? null : filter);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchTermChanges.complete();
  }

  requestEdit(task: Task): void {
    if (!this.canManageTask(task)) {
      return;
    }

    this.editRequested.emit(task);
  }

  markComplete(task: Task): void {
    if (!this.canManageTask(task) || this.normalizedStatus(task) === 'completed') {
      return;
    }

    this.moveTaskToStatus(task, 'completed');
  }

  moveTaskToStatus(task: Task, status: TaskStatus): void {
    if (!this.canManageTask(task)) {
      return;
    }

    const previousStatus = this.normalizedStatus(task);

    if (previousStatus === status) {
      return;
    }

    this.setLocalTaskStatus(task.id, status);

    this.taskService.update(task.id, { status }).subscribe({
      next: () => {
        this.taskChanged.emit();
        this.toast.success(`Task moved to ${this.statusLabel(status)}.`, 'Updated');
      },
      error: (error) => {
        this.setLocalTaskStatus(task.id, previousStatus);
        this.toast.fromError(error, 'Unable to update task status.');
      }
    });
  }

  startTaskDrag(event: DragEvent, task: Task): void {
    if (!this.canManageTask(task)) {
      event.preventDefault();
      return;
    }

    this.draggedTaskId = task.id;
    this.dragTargetStatus = this.normalizedStatus(task);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id);
    }
  }

  allowTaskDrop(event: DragEvent, status: TaskStatus): void {
    if (!this.draggedTaskId) {
      return;
    }

    event.preventDefault();
    this.dragTargetStatus = status;

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  dropTaskOnStatus(event: DragEvent, status: TaskStatus): void {
    event.preventDefault();

    const taskId = event.dataTransfer?.getData('text/plain') || this.draggedTaskId;
    const task = this.tasks.find((item) => item.id === taskId);

    this.endTaskDrag();

    if (!task || this.normalizedStatus(task) === status) {
      return;
    }

    this.moveTaskToStatus(task, status);
  }

  endTaskDrag(): void {
    this.draggedTaskId = null;
    this.dragTargetStatus = null;
  }

  isTaskDragging(task: Task): boolean {
    return this.draggedTaskId === task.id;
  }

  deleteTask(task: Task): void {
    if (!this.canManageTask(task)) {
      return;
    }

    this.taskPendingDelete = task;
  }

  closeDeleteConfirmation(): void {
    if (this.isDeletingTask) {
      return;
    }

    this.taskPendingDelete = null;
  }

  confirmDeleteTask(): void {
    const task = this.taskPendingDelete;

    if (!task || this.isDeletingTask) {
      return;
    }

    this.isDeletingTask = true;

    this.taskService.delete(task.id).subscribe({
      next: () => {
        this.localTasks = this.localTasks.filter((item) => item.id !== task.id);
        this.taskPendingDelete = null;
        this.isDeletingTask = false;
        this.taskChanged.emit();
        this.toast.success(`"${task.title}" was removed from active tasks.`, 'Task deleted');
      },
      error: (error) => {
        this.isDeletingTask = false;
        this.toast.fromError(error, 'Unable to delete task.');
      }
    });
  }

  statusLabel(status: TaskStatus | string): string {
    const labels: Record<TaskStatus, string> = {
      backlog: 'Backlog',
      inProgress: 'In Progress',
      completed: 'Done'
    };

    return labels[this.normalizeStatusValue(status)];
  }

  normalizedStatus(task: Task): TaskStatus {
    return this.normalizeStatusValue(task.status);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  formatShortDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }).format(new Date(value));
  }

  private normalizeStatusValue(status: TaskStatus | string): TaskStatus {
    return status === 'pending' ? 'backlog' : (status as TaskStatus);
  }

  private setLocalTaskStatus(taskId: string, status: TaskStatus): void {
    this.localTasks = this.localTasks.map((task) => (task.id === taskId ? { ...task, status } : task));
  }
}
