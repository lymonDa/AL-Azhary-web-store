import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    <aside class="az-toast-container" aria-label="الإشعارات والتنبيهات">
      @for (toast of toastService.toasts(); track toast.id) {
        <app-toast [toast]="toast" (dismiss)="onDismiss($event)" />
      }
    </aside>
  `,
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  onDismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
