import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-panel">
        <div class="auth-copy">
          <p class="eyebrow">Task Management</p>
          <h1>Create your account</h1>
          <p>Select a role for machine-test review. The API still enforces every permission server-side.</p>
        </div>

        <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <h2>Register</h2>
            <p class="muted">Username, email, password, and role are required.</p>
          </div>

          <label>
            Username
            <input type="text" formControlName="username" autocomplete="name" placeholder="Nitesh" />
            <span class="field-error" *ngIf="form.controls.username.touched && form.controls.username.invalid">
              Username must be at least 2 characters.
            </span>
          </label>

          <label>
            Email
            <input type="email" formControlName="email" autocomplete="email" placeholder="you@example.com" />
            <span class="field-error" *ngIf="form.controls.email.touched && form.controls.email.invalid">
              Enter a valid email.
            </span>
          </label>

          <label>
            Password
            <input type="password" formControlName="password" autocomplete="new-password" placeholder="Minimum 8 characters" />
            <span class="field-error" *ngIf="form.controls.password.touched && form.controls.password.invalid">
              Password must be at least 8 characters.
            </span>
          </label>

          <label>
            Role
            <select formControlName="role">
              <option value="employee">Employee</option>
              <option value="teamLead">Team Lead</option>
              <option value="manager">Manager</option>
            </select>
          </label>

          <div class="error-box" *ngIf="errorMessage">{{ errorMessage }}</div>

          <button class="primary-button" type="submit" [disabled]="form.invalid || isSubmitting">
            {{ isSubmitting ? 'Creating account...' : 'Create account' }}
          </button>

          <p class="switch-link">Already registered? <a routerLink="/login">Sign in</a></p>
        </form>
      </section>
    </main>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  isSubmitting = false;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['employee' as UserRole, [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Registration failed. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}

