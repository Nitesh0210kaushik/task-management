import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideArrowRight,
  LucideCheckCircle2,
  LucideLayoutDashboard,
  LucideListFilter,
  LucideListTodo,
  LucideLogOut,
  LucideMenu,
  LucidePlus,
  LucideRefreshCw,
  LucideUsers,
  LucideX
} from '@lucide/angular';
import { Subscription, filter, finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { DashboardService } from '../../core/dashboard.service';
import { NotificationService } from '../../core/notification.service';
import { SocketService } from '../../core/socket.service';
import { TaskService } from '../../core/task.service';
import { ToastService } from '../../core/toast.service';
import { CreateUserPayload, UserService } from '../../core/user.service';
import { NotificationBellComponent } from '../notifications/notification-bell.component';
import { NotificationNavItemComponent } from '../notifications/notification-nav-item.component';
import { NotificationPageComponent } from '../notifications/notification-page.component';
import { TaskFormModalComponent } from '../tasks/task-form-modal.component';
import { TaskWorkspaceComponent } from '../tasks/task-workspace.component';
import {
  DashboardOverview,
  DashboardStageMetric,
  DashboardStats,
  DashboardWorkload,
  Task,
  TaskStatus,
  User
} from '../../core/models';

type WorkspaceSection = 'dashboard' | 'tasks' | 'team' | 'notifications';

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  total: 0,
  backlog: 0,
  inProgress: 0,
  completed: 0,
  completionRate: 0
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    NotificationBellComponent,
    NotificationNavItemComponent,
    NotificationPageComponent,
    TaskFormModalComponent,
    TaskWorkspaceComponent,
    LucideArrowRight,
    LucideCheckCircle2,
    LucideLayoutDashboard,
    LucideListFilter,
    LucideListTodo,
    LucideLogOut,
    LucideMenu,
    LucidePlus,
    LucideRefreshCw,
    LucideUsers,
    LucideX
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly notificationService = inject(NotificationService);
  private readonly taskService = inject(TaskService);
  private readonly userService = inject(UserService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  dashboardOverview: DashboardOverview | null = null;
  tasks: Task[] = [];
  users: User[] = [];
  activeSection: WorkspaceSection = 'dashboard';
  isTaskComposerOpen = false;
  isMemberComposerOpen = false;
  editingTask: Task | null = null;
  isCreatingMember = false;
  isLoadingDashboard = false;
  isLoadingTasks = false;
  isLoadingUsers = false;
  isMobileSidebarOpen = false;
  taskStatusFilter: TaskStatus | null = null;
  taskSearchTerm: string | null = null;

  private socketSubscription?: Subscription;
  private notificationSocketSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private dashboardRequestSubscription?: Subscription;
  private tasksRequestSubscription?: Subscription;
  private usersRequestSubscription?: Subscription;
  private dashboardWarmupTimer?: ReturnType<typeof setTimeout>;
  private taskWarmupTimer?: ReturnType<typeof setTimeout>;
  private userWarmupTimer?: ReturnType<typeof setTimeout>;

  memberForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(120)]]
  });

  get canViewUsers(): boolean {
    return this.currentUser?.role === 'manager' || this.currentUser?.role === 'teamLead';
  }

  get canAssignTasks(): boolean {
    return this.currentUser?.role === 'manager' || this.currentUser?.role === 'teamLead';
  }

  get canCreateUsers(): boolean {
    return this.currentUser?.role === 'manager';
  }

  get assignableUsers(): User[] {
    if (!this.currentUser) {
      return [];
    }

    const currentUserId = this.currentUser.id;

    if (this.currentUser.role === 'manager') {
      return this.users.filter((user) => user.id !== currentUserId);
    }

    if (this.currentUser.role === 'teamLead') {
      return this.users.filter((user) => user.id !== currentUserId && user.teamLeadId === currentUserId);
    }

    return [];
  }

  get teamLeads(): User[] {
    return this.users.filter((user) => user.role === 'teamLead');
  }

  get employeeUsers(): User[] {
    return this.users.filter((user) => user.role === 'employee');
  }

  get dashboardStats(): DashboardStats {
    return this.dashboardOverview?.stats ?? EMPTY_DASHBOARD_STATS;
  }

  get dashboardStageMetrics(): DashboardStageMetric[] {
    return (
      this.dashboardOverview?.stageMetrics ?? [
        { label: 'Backlog', status: 'backlog', count: 0, percent: 0 },
        { label: 'In Progress', status: 'inProgress', count: 0, percent: 0 },
        { label: 'Done', status: 'completed', count: 0, percent: 0 }
      ]
    );
  }

  get dashboardRecentTasks(): Task[] {
    return this.dashboardOverview?.recentTasks ?? [];
  }

  get dashboardWorkload(): DashboardWorkload[] {
    return this.dashboardOverview?.workload ?? [];
  }

  get isDashboardPage(): boolean {
    return this.activeSection === 'dashboard';
  }

  get isTasksPage(): boolean {
    return this.activeSection === 'tasks';
  }

  get isTeamPage(): boolean {
    return this.activeSection === 'team';
  }

  get isNotificationsPage(): boolean {
    return this.activeSection === 'notifications';
  }

  get pageCrumb(): string {
    const labels: Record<WorkspaceSection, string> = {
      dashboard: 'Dashboard',
      tasks: 'Tasks',
      team: 'Team',
      notifications: 'Notifications'
    };

    return labels[this.activeSection];
  }

  get pageTitle(): string {
    if (this.isNotificationsPage) {
      return 'Notifications';
    }

    if (this.isTeamPage) {
      return this.currentUser?.role === 'manager' ? 'Workspace team' : 'My team';
    }

    if (this.isTasksPage) {
      return this.taskListTitle;
    }

    return 'Workspace overview';
  }

  get pageSummary(): string {
    if (this.isNotificationsPage) {
      return 'Realtime task updates from your workspace';
    }

    if (this.isTeamPage) {
      return this.currentUser?.role === 'manager' ? 'Team leads and employees in this workspace' : 'Team members and assigned work ownership';
    }

    if (this.isTasksPage) {
      return 'Plan, assign, and move work across stages';
    }

    return this.roleSummary;
  }

  get dashboardTitle(): string {
    const name = this.currentUser?.username?.trim();

    return name ? `${name}'s tasks` : 'Tasks';
  }

  get roleSummary(): string {
    if (this.currentUser?.role === 'manager') {
      return 'Workspace overview and team ownership';
    }

    if (this.currentUser?.role === 'teamLead') {
      return 'Team work, assignments, and progress';
    }

    return 'Personal tasks and account access';
  }

  get taskListTitle(): string {
    if (this.currentUser?.role === 'manager') {
      return 'Workspace tasks';
    }

    if (this.currentUser?.role === 'teamLead') {
      return 'Team tasks';
    }

    return 'My tasks';
  }

  get currentUserInitial(): string {
    return this.currentUser?.username?.trim().charAt(0).toUpperCase() || 'U';
  }

  ngOnInit(): void {
    this.activeSection = this.sectionFromUrl(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.activeSection = this.sectionFromUrl(event.urlAfterRedirects);
        this.closeMobileSidebar();
        this.enforceSectionAccess();
        this.refreshActiveSection();
      });

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
    this.routerSubscription?.unsubscribe();
    this.socketSubscription?.unsubscribe();
    this.notificationSocketSubscription?.unsubscribe();
    this.dashboardRequestSubscription?.unsubscribe();
    this.tasksRequestSubscription?.unsubscribe();
    this.usersRequestSubscription?.unsubscribe();
    this.clearWarmupTimers();
    this.socketService.disconnect();
  }

  initializeDashboard(): void {
    this.enforceSectionAccess();
    this.refreshActiveSection();

    this.socketService.connect();
    this.socketSubscription = this.socketService.onTaskChanges().subscribe((payload) => {
      if (this.isDashboardPage) {
        this.loadDashboardOverview();
      }

      if (this.isTasksPage) {
        this.loadTasks();
      }
    });

    this.notificationSocketSubscription = this.socketService.onNotifications().subscribe((notification) => {
      this.notificationService.addRealtimeNotification(notification);
    });
  }

  enforceSectionAccess(): void {
    if (!this.currentUser || !this.isTeamPage || this.canViewUsers) {
      return;
    }

    this.toast.error('Team page is available for managers and team leads only.');
    void this.router.navigate(['/tasks']);
  }

  refreshActiveSection(): void {
    this.refreshSectionData(this.activeSection);
  }

  prefetchSection(section: WorkspaceSection): void {
    this.activeSection = section;
    this.closeMobileSidebar();
    this.refreshSectionData(section);
  }

  openMobileSidebar(): void {
    this.isMobileSidebarOpen = true;
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.closeMobileSidebar();
  }

  private refreshSectionData(section: WorkspaceSection): void {
    if (!this.currentUser) {
      return;
    }

    if (section === 'dashboard') {
      this.loadDashboardOverviewWithWarmup();
    }

    if (section === 'tasks') {
      this.loadTasksWithWarmup();
    }

    if (this.canViewUsers) {
      this.loadUsersWithWarmup();
    }
  }

  private loadDashboardOverviewWithWarmup(): void {
    this.loadDashboardOverview();
    clearTimeout(this.dashboardWarmupTimer);

    this.dashboardWarmupTimer = setTimeout(() => {
      if (this.currentUser && this.isDashboardPage && !this.dashboardOverview && !this.isLoadingDashboard) {
        this.loadDashboardOverview();
      }
    }, 450);
  }

  private loadTasksWithWarmup(): void {
    this.loadTasks();
    clearTimeout(this.taskWarmupTimer);

    this.taskWarmupTimer = setTimeout(() => {
      if (this.currentUser && !this.isTeamPage && !this.tasks.length) {
        this.loadTasks();
      }
    }, 450);
  }

  private loadUsersWithWarmup(): void {
    this.loadUsers();
    clearTimeout(this.userWarmupTimer);

    this.userWarmupTimer = setTimeout(() => {
      if (this.currentUser && this.canViewUsers && !this.users.length) {
        this.loadUsers();
      }
    }, 450);
  }

  loadDashboardOverview(): void {
    if (this.isLoadingDashboard) {
      return;
    }

    this.dashboardRequestSubscription?.unsubscribe();
    this.isLoadingDashboard = true;

    this.dashboardRequestSubscription = this.dashboardService
      .overview()
      .pipe(
        finalize(() => {
          this.isLoadingDashboard = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
      next: (overview) => {
        this.dashboardOverview = this.normalizeDashboardOverview(overview);
        this.isLoadingDashboard = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.dashboardOverview = null;
        this.isLoadingDashboard = false;
        this.toast.fromError(error, 'Unable to load dashboard.');
        this.cdr.markForCheck();
      }
    });
  }

  private normalizeDashboardOverview(overview: DashboardOverview): DashboardOverview {
    return {
      stats: overview?.stats ?? EMPTY_DASHBOARD_STATS,
      stageMetrics: overview?.stageMetrics ?? [],
      recentTasks: overview?.recentTasks ?? [],
      workload: overview?.workload ?? []
    };
  }

  loadTasks(status: TaskStatus | null = this.taskStatusFilter, search: string | null = this.taskSearchTerm): void {
    this.taskStatusFilter = status;
    this.taskSearchTerm = search;
    this.tasksRequestSubscription?.unsubscribe();
    this.isLoadingTasks = true;

    this.tasksRequestSubscription = this.taskService
      .list(status ?? undefined, search ?? undefined)
      .pipe(
        finalize(() => {
          this.isLoadingTasks = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks ?? [];
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.tasks = [];
          this.toast.fromError(error, 'Unable to load tasks.');
        }
      });
  }

  loadUsers(): void {
    this.usersRequestSubscription?.unsubscribe();
    this.isLoadingUsers = true;

    this.usersRequestSubscription = this.userService
      .list()
      .pipe(
        finalize(() => {
          this.isLoadingUsers = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (users) => {
          this.users = users ?? [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.users = [];
          this.toast.error('Unable to load team members.');
        }
      });
  }

  private clearWarmupTimers(): void {
    clearTimeout(this.dashboardWarmupTimer);
    clearTimeout(this.taskWarmupTimer);
    clearTimeout(this.userWarmupTimer);
  }

  editTask(task: Task): void {
    this.editingTask = task;
    this.isTaskComposerOpen = true;
    this.refreshAssignableUsers();
  }

  openTaskComposer(): void {
    this.editingTask = null;
    this.isTaskComposerOpen = true;
    this.refreshAssignableUsers();
  }

  closeTaskComposer(): void {
    this.editingTask = null;
    this.isTaskComposerOpen = false;
  }

  handleTaskSaved(): void {
    this.closeTaskComposer();
    this.refreshTaskDataAfterMutation();
  }

  handleTaskChanged(): void {
    this.refreshTaskDataAfterMutation();
  }

  handleTaskStatusFilterChanged = (status: TaskStatus | null): void => {
    this.loadTasks(status, this.taskSearchTerm);
  };

  handleTaskSearchChanged = (search: string | null): void => {
    this.loadTasks(this.taskStatusFilter, search);
  };

  openMemberComposer(): void {
    this.resetMemberForm();
    this.isMemberComposerOpen = true;
  }

  closeMemberComposer(): void {
    this.resetMemberForm();
    this.isMemberComposerOpen = false;
  }

  submitMember(): void {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      this.toast.error('Please complete the required member fields.', 'Check the member');
      return;
    }

    this.isCreatingMember = true;

    const rawValue = this.memberForm.getRawValue();
    const payload: CreateUserPayload = {
      username: rawValue.username,
      email: rawValue.email,
      password: rawValue.password,
      role: 'teamLead'
    };

    this.userService.create(payload).subscribe({
      next: (response) => {
        this.closeMemberComposer();
        this.loadUsers();
        this.toast.success(`${this.roleLabel(response.data.role)} created successfully.`, 'Team lead added');
        this.isCreatingMember = false;
      },
      error: (error) => {
        this.toast.fromError(error, 'Unable to create team lead.');
        this.isCreatingMember = false;
      }
    });
  }

  private refreshTaskDataAfterMutation(): void {
    if (this.isDashboardPage) {
      this.loadDashboardOverview();
    }

    if (this.isTasksPage) {
      this.loadTasks();
    }
  }

  private refreshAssignableUsers(): void {
    if (this.canAssignTasks) {
      this.loadUsers();
    }
  }

  private resetMemberForm(): void {
    this.memberForm.reset({
      username: '',
      email: '',
      password: ''
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

  private normalizeStatusValue(status: TaskStatus | string): TaskStatus {
    return status === 'pending' ? 'backlog' : (status as TaskStatus);
  }

  taskCountLabel(count: number): string {
    return count === 1 ? 'task' : 'tasks';
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

  private sectionFromUrl(url: string): WorkspaceSection {
    if (url.startsWith('/notifications')) {
      return 'notifications';
    }

    if (url.startsWith('/team')) {
      return 'team';
    }

    if (url.startsWith('/tasks')) {
      return 'tasks';
    }

    return 'dashboard';
  }

  logout(): void {
    this.closeMobileSidebar();
    this.socketService.disconnect();
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
