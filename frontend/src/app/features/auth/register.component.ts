import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowRight, LucideLock, LucideMail, LucideUser, LucideUserPlus } from '@lucide/angular';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideArrowRight,
    LucideLock,
    LucideMail,
    LucideUser,
    LucideUserPlus
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  isSubmitting = false;

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please complete the highlighted fields before creating your account.', 'Check the form');
      return;
    }

    this.isSubmitting = true;

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Your workspace account is ready.', 'Account created');
        void this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.toast.fromError(error, 'Registration failed. Please try again.');
        this.isSubmitting = false;
      }
    });
  }
}
