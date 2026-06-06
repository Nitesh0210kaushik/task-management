import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff, LucideLock, LucideMail, LucideUser, LucideUserPlus } from '@lucide/angular';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideEye,
    LucideEyeOff,
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
  showPassword = false;
  showConfirmPassword = false;

  private readonly passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  };

  form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    {
      validators: this.passwordMatchValidator
    }
  );

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please complete the highlighted fields before creating your account.', 'Check the form');
      return;
    }

    this.isSubmitting = true;
    const rawValue = this.form.getRawValue();
    const registerPayload = {
      username: rawValue.username,
      email: rawValue.email,
      password: rawValue.password
    };

    this.auth.register(registerPayload).subscribe({
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
