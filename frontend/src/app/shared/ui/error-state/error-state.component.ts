import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="az-error-state" role="alert" aria-live="polite">
      <div class="az-error-state__icon" aria-hidden="true">⚠️</div>
      <h3 class="az-error-state__title">{{ title() }}</h3>
      @if (message()) {
        <p class="az-error-state__message">{{ message() }}</p>
      }
      <div class="az-error-state__actions">
        <ng-content />
        @if (retryable()) {
          <app-button (clicked)="onRetry()" variant="secondary" size="md">
            {{ retryText() }}
          </app-button>
        }
      </div>
    </div>
  `,
  styleUrl: './error-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly title = input<string>('تعذر تحميل البيانات');
  readonly message = input<string | null>(null);
  readonly retryable = input<boolean>(true);
  readonly retryText = input<string>('إعادة المحاولة');

  readonly retry = output<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
