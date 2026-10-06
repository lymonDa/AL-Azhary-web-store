import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from './modal.component';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="title"
      size="sm"
      [hasFooter]="true"
      [closeOnBackdrop]="!loading"
      [closeOnEscape]="!loading"
      (modalClosed)="onCancel()"
    >
      <p class="az-confirm-dialog__message">{{ message }}</p>

      <div modal-footer class="az-confirm-dialog__actions">
        <app-button
          variant="secondary"
          size="md"
          [disabled]="loading"
          (buttonClick)="onCancel()"
        >
          {{ cancelLabel }}
        </app-button>
        <app-button
          [variant]="tone === 'destructive' ? 'destructive' : 'primary'"
          size="md"
          [loading]="loading"
          (buttonClick)="onConfirm()"
        >
          {{ confirmLabel }}
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .az-confirm-dialog__message {
        margin: 0;
        font-size: var(--font-size-body);
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
      }

      .az-confirm-dialog__actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) message!: string;
  @Input() confirmLabel = 'تأكيد';
  @Input() cancelLabel = 'إلغاء';
  @Input() tone: 'primary' | 'destructive' = 'primary';
  @Input() loading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    if (!this.loading) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    if (!this.loading) {
      this.cancelled.emit();
    }
  }
}
