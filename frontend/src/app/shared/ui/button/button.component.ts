import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';
export type IconPosition = 'start' | 'end';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [attr.aria-disabled]="disabled || loading ? 'true' : null"
      [attr.aria-busy]="loading ? 'true' : null"
      [attr.aria-label]="computedAriaLabel"
      [class]="buttonClasses"
      (click)="handleClick($event)"
    >
      @if (loading) {
        <app-icon
          name="spinner"
          [size]="iconSize"
          [spin]="true"
          class="button-icon-spinner"
          ariaLabel="جارٍ التحميل..."
        />
      } @else if (icon && iconPosition === 'start') {
        <app-icon
          [name]="icon"
          [size]="iconSize"
          class="button-icon-start"
        />
      }

      <span class="button-content" [class.visually-hidden]="loading && isIconButton">
        <ng-content />
      </span>

      @if (!loading && icon && iconPosition === 'end') {
        <app-icon
          [name]="icon"
          [size]="iconSize"
          class="button-icon-end"
        />
      }
    </button>
  `,
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: ButtonType = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() icon?: string | undefined;
  @Input() iconPosition: IconPosition = 'start';
  @Input() isIconButton = false;
  @Input() ariaLabel?: string | undefined;
  @Input() fullWidth = false;

  @Output() buttonClick = new EventEmitter<MouseEvent>();

  get computedAriaLabel(): string | null {
    if (this.ariaLabel) {
      return this.ariaLabel;
    }
    return null;
  }

  get buttonClasses(): string {
    return [
      'az-btn',
      `az-btn--${this.variant}`,
      `az-btn--${this.size}`,
      this.fullWidth ? 'az-btn--full-width' : '',
      this.isIconButton ? 'az-btn--icon-only' : '',
      this.loading ? 'az-btn--loading' : '',
      this.disabled ? 'az-btn--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  get iconSize(): number {
    switch (this.size) {
      case 'sm':
        return 16;
      case 'lg':
        return 22;
      case 'md':
      default:
        return 18;
    }
  }

  handleClick(event: MouseEvent): void {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.buttonClick.emit(event);
  }
}
