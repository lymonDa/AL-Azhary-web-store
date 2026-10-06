import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../ui/icon/icon.component';
import { ToastMessage } from './toast.model';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div
      class="az-toast"
      [class]="toastClass"
      [attr.role]="toast.tone === 'error' ? 'alert' : 'status'"
      [attr.aria-live]="toast.tone === 'error' ? 'assertive' : 'polite'"
    >
      <span class="az-toast__icon" aria-hidden="true">
        <app-icon [name]="iconName" [size]="20" />
      </span>

      <p class="az-toast__message">{{ toast.message }}</p>

      @if (toast.dismissible) {
        <button
          type="button"
          class="az-toast__dismiss-btn"
          (click)="onDismiss()"
          aria-label="إغلاق التنبيه"
        >
          <app-icon name="x" [size]="16" />
        </button>
      }
    </div>
  `,
  styleUrl: './toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  @Input({ required: true }) toast!: ToastMessage;

  @Output() dismiss = new EventEmitter<string>();

  get toastClass(): string {
    return `az-toast--${this.toast.tone}`;
  }

  get iconName(): string {
    switch (this.toast.tone) {
      case 'success':
        return 'check-circle-2';
      case 'warning':
        return 'alert-triangle';
      case 'error':
        return 'x-circle';
      case 'info':
      default:
        return 'info';
    }
  }

  onDismiss(): void {
    this.dismiss.emit(this.toast.id);
  }
}
