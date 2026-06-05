import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX } from '@lucide/angular';
import { Toast, ToastService } from '../toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule, LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  trackToast(_index: number, toast: Toast): number {
    return toast.id;
  }
}
