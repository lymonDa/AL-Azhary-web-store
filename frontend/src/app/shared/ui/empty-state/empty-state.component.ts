import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  template: `
    <div class="az-empty-state" role="status">
      <div class="az-empty-state__icon" aria-hidden="true">
        {{ icon() }}
      </div>
      <h3 class="az-empty-state__title">{{ title() }}</h3>
      @if (description()) {
        <p class="az-empty-state__description">{{ description() }}</p>
      }
      <div class="az-empty-state__actions">
        <ng-content />
        @if (actionText()) {
          @if (actionRoute()) {
            <app-button
              [routerLink]="actionRoute()!"
              variant="primary"
              size="md"
              [attr.aria-label]="actionAriaLabel() || actionText()!"
            >
              {{ actionText() }}
            </app-button>
          } @else {
            <app-button
              (clicked)="onActionClick()"
              variant="primary"
              size="md"
              [attr.aria-label]="actionAriaLabel() || actionText()!"
            >
              {{ actionText() }}
            </app-button>
          }
        }
      </div>
    </div>
  `,
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly icon = input<string>('🔍');
  readonly actionText = input<string | null>(null);
  readonly actionRoute = input<string | null>(null);
  readonly actionAriaLabel = input<string | null>(null);

  readonly actionClick = output<void>();

  onActionClick(): void {
    this.actionClick.emit();
  }
}
