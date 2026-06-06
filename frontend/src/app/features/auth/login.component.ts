import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff, LucideLock, LucideLogIn, LucideMail } from '@lucide/angular';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideEye,
    LucideEyeOff,
    LucideLock,
    LucideLogIn,
    LucideMail
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  isSubmitting = false;
  showPassword = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Enter your email and password to continue.', 'Check the form');
      return;
    }

    this.isSubmitting = true;

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Welcome back to your workspace.', 'Signed in');
        void this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.toast.fromError(error, 'Login failed. Please try again.');
        this.isSubmitting = false;
      }
    });
  }
}
