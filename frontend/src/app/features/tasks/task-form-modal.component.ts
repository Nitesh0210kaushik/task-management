import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePencil, LucidePlus, LucideX } from '@lucide/angular';
import { Task, TaskStatus, User } from '../../core/models';
import { TaskFormPayload, TaskService } from '../../core/task.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-task-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucidePencil, LucidePlus, LucideX],
  templateUrl: './task-form-modal.component.html',
  styleUrl: './task-form-modal.component.scss'
})
export class TaskFormModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly toast = inject(ToastService);

  @Input() editingTask: Task | null = null;
  @Input() canAssignTasks = false;
  @Input() assignableUsers: User[] = [];
  @Input() currentUserId: string | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  isSaving = false;

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1000)]],
    status: ['backlog' as TaskStatus, [Validators.required]],
    assignedTo: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingTask']) {
      this.syncFormWithTask();
    }
  }

  submitTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      this.toast.error('Please complete the required task fields.', 'Check the task');
      return;
    }

    this.isSaving = true;

    const rawValue = this.taskForm.getRawValue();
    const payload: TaskFormPayload = {
      title: rawValue.title,
      description: rawValue.description,
      status: rawValue.status,
      ...(this.canAssignTasks && rawValue.assignedTo ? { assignedTo: rawValue.assignedTo } : {})
    };

    const isEditing = Boolean(this.editingTask);
    const request = this.editingTask
      ? this.taskService.update(this.editingTask.id, payload)
      : this.taskService.create(payload);

    request.subscribe({
      next: () => {
        this.toast.success(isEditing ? 'Task updated successfully.' : 'Task created successfully.', 'Saved');
        this.isSaving = false;
        this.saved.emit();
      },
      error: (error) => {
        this.toast.fromError(error, 'Unable to save task.');
        this.isSaving = false;
      }
    });
  }

  close(): void {
    if (this.isSaving) {
      return;
    }

    this.closed.emit();
  }

  roleLabel(role: User['role']): string {
    const labels: Record<User['role'], string> = {
      manager: 'Manager',
      teamLead: 'Team Lead',
      employee: 'Employee'
    };

    return labels[role];
  }

  private syncFormWithTask(): void {
    if (!this.editingTask) {
      this.taskForm.reset({
        title: '',
        description: '',
        status: 'backlog',
        assignedTo: ''
      });
      return;
    }

    this.taskForm.reset({
      title: this.editingTask.title,
      description: this.editingTask.description,
      status: this.normalizedStatus(this.editingTask),
      assignedTo: this.editingTask.assignedTo.id === this.currentUserId ? '' : this.editingTask.assignedTo.id
    });
  }

  private normalizedStatus(task: Task): TaskStatus {
    return this.normalizeStatusValue(task.status);
  }

  private normalizeStatusValue(status: TaskStatus | string): TaskStatus {
    return status === 'pending' ? 'backlog' : (status as TaskStatus);
  }
}
