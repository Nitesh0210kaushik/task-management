import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideCheckCircle2,
  LucideListFilter,
  LucideLogOut,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideShieldCheck,
  LucideTrash2
} from '@lucide/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { SocketService } from '../../core/socket.service';
import { TaskFormPayload, TaskService } from '../../core/task.service';
import { UserService } from '../../core/user.service';
import { Task, TaskStatus, User } from '../../core/models';

type TaskFilter = TaskStatus | 'all';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideCheckCircle2,
    LucideListFilter,
    LucideLogOut,
    LucidePencil,
    LucidePlus,
    LucideRefreshCw,
    LucideShieldCheck,
    LucideTrash2
  ],
  template: `
    <main class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Task Management</p>
          <h1>Workspace Dashboard</h1>
        </div>

        <div class="user-pill" *ngIf="currentUser">
          <svg lucideShieldCheck aria-hidden="true"></svg>
          <span>{{ currentUser.username }}</span>
          <strong>{{ roleLabel(currentUser.role) }}</strong>
          <button class="icon-button" type="button" (click)="logout()" title="Logout" aria-label="Logout">
            <svg lucideLogOut aria-hidden="true"></svg>
          </button>
        </div>
      </header>

      <section class="stats-grid">
        <article>
          <span>Total</span>
          <strong>{{ tasks.length }}</strong>
        </article>
        <article>
          <span>Pending</span>
          <strong>{{ pendingCount }}</strong>
        </article>
        <article>
          <span>Completed</span>
          <strong>{{ completedCount }}</strong>
        </article>
      </section>

      <section class="workspace-grid">
        <aside class="side-panel" *ngIf="canViewUsers">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">People</p>
              <h2>{{ currentUser?.role === 'manager' ? 'Users and Team Leads' : 'My Team' }}</h2>
            </div>
            <button class="icon-button" type="button" (click)="loadUsers()" title="Refresh users" aria-label="Refresh users">
              <svg lucideRefreshCw aria-hidden="true"></svg>
            </button>
          </div>

          <div class="empty-state" *ngIf="!users.length && !isLoadingUsers">No users visible for your role.</div>
          <div class="user-list">
            <article class="user-row" *ngFor="let user of users">
              <div>
                <strong>{{ user.username }}</strong>
                <span>{{ user.email }}</span>
                <small>{{ roleLabel(user.role) }}</small>
              </div>

              <label class="compact-select" *ngIf="currentUser?.role === 'manager' && user.role === 'employee'">
                Lead
                <select [ngModel]="user.teamLeadId || ''" (ngModelChange)="assignLead(user, $event)">
                  <option value="">Unassigned</option>
                  <option *ngFor="let lead of teamLeads" [value]="lead.id">{{ lead.username }}</option>
                </select>
              </label>
            </article>
          </div>
        </aside>

        <section class="task-area">
          <form class="task-form" [formGroup]="taskForm" (ngSubmit)="submitTask()">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">{{ editingTask ? 'Edit Task' : 'New Task' }}</p>
                <h2>{{ editingTask ? editingTask.title : 'Create task' }}</h2>
              </div>
              <button class="ghost-button" type="button" *ngIf="editingTask" (click)="resetForm()">Cancel</button>
            </div>

            <div class="form-grid">
              <label>
                Title
                <input type="text" formControlName="title" placeholder="Task title" />
                <span class="field-error" *ngIf="taskForm.controls.title.touched && taskForm.controls.title.invalid">
                  Title must be 2 to 120 characters.
                </span>
              </label>

              <label>
                Status
                <select formControlName="status">
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label class="wide">
                Description
                <textarea rows="3" formControlName="description" placeholder="Task details"></textarea>
                <span class="field-error" *ngIf="taskForm.controls.description.touched && taskForm.controls.description.invalid">
                  Description must be 2 to 1000 characters.
                </span>
              </label>

              <label *ngIf="canAssignTasks">
                Assign to
                <select formControlName="assignedTo">
                  <option value="">Self</option>
                  <option *ngFor="let user of assignableUsers" [value]="user.id">{{ user.username }} - {{ roleLabel(user.role) }}</option>
                </select>
              </label>
            </div>

            <div class="error-box" *ngIf="errorMessage">{{ errorMessage }}</div>

            <button class="primary-button with-icon" type="submit" [disabled]="taskForm.invalid || isSaving">
              <svg *ngIf="editingTask; else createIcon" lucidePencil aria-hidden="true"></svg>
              <ng-template #createIcon>
                <svg lucidePlus aria-hidden="true"></svg>
              </ng-template>
              {{ isSaving ? 'Saving...' : editingTask ? 'Update task' : 'Create task' }}
            </button>
          </form>

          <section class="task-list-panel">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Tasks</p>
                <h2>Visible tasks</h2>
              </div>
              <label class="filter-control">
                <svg lucideListFilter aria-hidden="true"></svg>
                <select [(ngModel)]="filter" (ngModelChange)="loadTasks()">
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>

            <div class="empty-state" *ngIf="!tasks.length && !isLoadingTasks">No tasks found for this filter.</div>

            <article class="task-card" *ngFor="let task of tasks">
              <div class="task-main">
                <div>
                  <span class="status-badge" [class.complete]="task.status === 'completed'">{{ task.status }}</span>
                  <h3>{{ task.title }}</h3>
                  <p>{{ task.description }}</p>
                </div>

                <div class="task-meta">
                  <span>Created by <strong>{{ task.createdBy.username }}</strong></span>
                  <span>Assigned to <strong>{{ task.assignedTo.username }}</strong></span>
                </div>
              </div>

              <div class="task-actions">
                <button class="icon-button" type="button" (click)="markComplete(task)" [disabled]="task.status === 'completed'" title="Mark complete" aria-label="Mark complete">
                  <svg lucideCheckCircle2 aria-hidden="true"></svg>
                </button>
                <button class="icon-button" type="button" (click)="editTask(task)" title="Edit task" aria-label="Edit task">
                  <svg lucidePencil aria-hidden="true"></svg>
                </button>
                <button class="icon-button danger" type="button" (click)="deleteTask(task)" title="Delete task" aria-label="Delete task">
                  <svg lucideTrash2 aria-hidden="true"></svg>
                </button>
              </div>
            </article>
          </section>
        </section>
      </section>
    </main>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly userService = inject(UserService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);

  currentUser: User | null = null;
  tasks: Task[] = [];
  users: User[] = [];
  filter: TaskFilter = 'all';
  editingTask: Task | null = null;
  errorMessage = '';
  isSaving = false;
  isLoadingTasks = false;
  isLoadingUsers = false;

  private socketSubscription?: Subscription;

  taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1000)]],
    status: ['pending' as TaskStatus, [Validators.required]],
    assignedTo: ['']
  });

  get canViewUsers(): boolean {
    return this.currentUser?.role === 'manager' || this.currentUser?.role === 'teamLead';
  }

  get canAssignTasks(): boolean {
    return this.currentUser?.role === 'manager' || this.currentUser?.role === 'teamLead';
  }

  get assignableUsers(): User[] {
    if (!this.currentUser) {
      return [];
    }

    if (this.currentUser.role === 'manager') {
      return this.users;
    }

    if (this.currentUser.role === 'teamLead') {
      return this.users.filter((user) => user.id === this.currentUser?.id || user.teamLeadId === this.currentUser?.id);
    }

    return [this.currentUser];
  }

  get teamLeads(): User[] {
    return this.users.filter((user) => user.role === 'teamLead');
  }

  get pendingCount(): number {
    return this.tasks.filter((task) => task.status === 'pending').length;
  }

  get completedCount(): number {
    return this.tasks.filter((task) => task.status === 'completed').length;
  }

  ngOnInit(): void {
    this.currentUser = this.auth.currentUser;

    if (!this.currentUser) {
      this.auth.loadProfile().subscribe({
        next: (response) => {
          this.currentUser = response.data;
          this.initializeDashboard();
        },
        error: () => this.logout()
      });
      return;
    }

    this.initializeDashboard();
  }

  ngOnDestroy(): void {
    this.socketSubscription?.unsubscribe();
    this.socketService.disconnect();
  }

  initializeDashboard(): void {
    this.loadTasks();

    if (this.canViewUsers) {
      this.loadUsers();
    }

    const token = this.auth.token;

    if (token) {
      this.socketService.connect(token);
      this.socketSubscription = this.socketService.onTaskChanges().subscribe(() => {
        this.loadTasks();
      });
    }
  }

  loadTasks(): void {
    this.isLoadingTasks = true;
    const status = this.filter === 'all' ? undefined : this.filter;

    this.taskService.list(status).subscribe({
      next: (response) => {
        this.tasks = response.data;
        this.isLoadingTasks = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to load tasks.';
        this.isLoadingTasks = false;
      }
    });
  }

  loadUsers(): void {
    this.isLoadingUsers = true;

    this.userService.list().subscribe({
      next: (response) => {
        this.users = response.data;
        this.isLoadingUsers = false;
      },
      error: () => {
        this.users = [];
        this.isLoadingUsers = false;
      }
    });
  }

  submitTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const rawValue = this.taskForm.getRawValue();
    const payload: TaskFormPayload = {
      title: rawValue.title,
      description: rawValue.description,
      status: rawValue.status,
      ...(this.canAssignTasks && rawValue.assignedTo ? { assignedTo: rawValue.assignedTo } : {})
    };

    const request = this.editingTask
      ? this.taskService.update(this.editingTask.id, payload)
      : this.taskService.create(payload);

    request.subscribe({
      next: () => {
        this.resetForm();
        this.loadTasks();
        this.isSaving = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to save task.';
        this.isSaving = false;
      }
    });
  }

  editTask(task: Task): void {
    this.editingTask = task;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      status: task.status,
      assignedTo: task.assignedTo.id
    });
  }

  markComplete(task: Task): void {
    if (task.status === 'completed') {
      return;
    }

    this.taskService.update(task.id, { status: 'completed' }).subscribe({
      next: () => this.loadTasks(),
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to update task status.';
      }
    });
  }

  deleteTask(task: Task): void {
    const confirmed = window.confirm(`Delete task "${task.title}"?`);

    if (!confirmed) {
      return;
    }

    this.taskService.delete(task.id).subscribe({
      next: () => this.loadTasks(),
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to delete task.';
      }
    });
  }

  assignLead(user: User, teamLeadId: string): void {
    this.userService.assignTeamLead(user.id, teamLeadId || null).subscribe({
      next: () => this.loadUsers(),
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to update team lead.';
      }
    });
  }

  resetForm(): void {
    this.editingTask = null;
    this.taskForm.reset({
      title: '',
      description: '',
      status: 'pending',
      assignedTo: ''
    });
  }

  roleLabel(role: User['role']): string {
    const labels: Record<User['role'], string> = {
      manager: 'Manager',
      teamLead: 'Team Lead',
      employee: 'Employee'
    };

    return labels[role];
  }

  logout(): void {
    this.socketService.disconnect();
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
