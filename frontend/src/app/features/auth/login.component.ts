import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-panel">
        <div class="auth-copy">
          <p class="eyebrow">Task Management</p>
          <h1>Sign in to your workspace</h1>
          <p>Manage assignments with role-aware visibility for managers, team leads, and employees.</p>
        </div>

        <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <h2>Login</h2>
            <p class="muted">Use your registered email and password.</p>
          </div>

          <label>
            Email
            <input type="email" formControlName="email" autocomplete="email" placeholder="manager@example.com" />
            <span class="field-error" *ngIf="form.controls.email.touched && form.controls.email.invalid">
              Enter a valid email.
            </span>
          </label>

          <label>
            Password
            <input type="password" formControlName="password" autocomplete="current-password" placeholder="Password@123" />
            <span class="field-error" *ngIf="form.controls.password.touched && form.controls.password.invalid">
              Password is required.
            </span>
          </label>

          <div class="error-box" *ngIf="errorMessage">{{ errorMessage }}</div>

          <button class="primary-button" type="submit" [disabled]="form.invalid || isSubmitting">
            {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
          </button>

          <p class="switch-link">New here? <a routerLink="/register">Create an account</a></p>
        </form>
      </section>
    </main>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  isSubmitting = false;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Login failed. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}

