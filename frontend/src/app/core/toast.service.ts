import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastInput {
  type: ToastType;
  title: string;
  message: string;
  durationMs?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<Toast[]>([]);
  private nextId = 0;

  readonly toasts = this.items.asReadonly();

  success(message: string, title = 'Success'): void {
    this.show({ type: 'success', title, message, durationMs: 3600 });
  }

  error(message: string, title = 'Request failed'): void {
    this.show({ type: 'error', title, message, durationMs: 5200 });
  }

  info(message: string, title = 'Notice'): void {
    this.show({ type: 'info', title, message, durationMs: 4200 });
  }

  fromError(error: unknown, fallback: string, title = 'Request failed'): void {
    this.error(this.errorMessage(error, fallback), title);
  }

  dismiss(id: number): void {
    this.items.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(input: ToastInput): void {
    const toast: Toast = {
      id: ++this.nextId,
      type: input.type,
      title: input.title,
      message: input.message
    };

    this.items.update((toasts) => [toast, ...toasts].slice(0, 4));
    window.setTimeout(() => this.dismiss(toast.id), input.durationMs ?? 4500);
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') {
      return fallback;
    }

    const response = error as { error?: unknown; message?: unknown };
    const payload = response.error;

    if (payload && typeof payload === 'object') {
      const body = payload as { message?: unknown; errors?: unknown };

      if (typeof body.message === 'string' && body.message.trim()) {
        return body.message;
      }

      const validationMessage = this.validationMessage(body.errors);

      if (validationMessage) {
        return validationMessage;
      }
    }

    if (typeof response.message === 'string' && response.message.trim()) {
      return response.message;
    }

    return fallback;
  }

  private validationMessage(errors: unknown): string {
    const messages = this.collectValidationMessages(errors);

    return messages[0] ?? '';
  }

  private collectValidationMessages(value: unknown): string[] {
    if (typeof value === 'string') {
      return value.trim() ? [value] : [];
    }

    if (Array.isArray(value)) {
      return value.flatMap((item) => this.collectValidationMessages(item));
    }

    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).flatMap((item) => this.collectValidationMessages(item));
    }

    return [];
  }
}
