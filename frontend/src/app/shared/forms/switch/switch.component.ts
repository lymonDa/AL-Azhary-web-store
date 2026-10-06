import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

let nextSwitchId = 0;

@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true,
    },
  ],
  template: `
    <label
      [attr.for]="switchId"
      class="az-switch-label"
      [class.az-switch-label--disabled]="disabled"
    >
      <button
        type="button"
        role="switch"
        [id]="switchId"
        [disabled]="disabled"
        [attr.aria-checked]="checked"
        [attr.aria-describedby]="ariaDescribedBy || null"
        class="az-switch"
        [class.az-switch--checked]="checked"
        (click)="toggle()"
        (keydown.space)="$event.preventDefault(); toggle()"
      >
        <span class="az-switch__thumb"></span>
      </button>
      @if (label) {
        <span class="az-switch-text">{{ label }}</span>
      } @else {
        <span class="az-switch-text">
          <ng-content />
        </span>
      }
    </label>
  `,
  styleUrl: './switch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchComponent implements ControlValueAccessor {
  @Input() label?: string | undefined;
  @Input() checked = false;
  @Input() disabled = false;
  @Input() id?: string | undefined;
  @Input() ariaDescribedBy?: string | undefined;

  @Output() checkedChange = new EventEmitter<boolean>();

  private readonly generatedId = `az-switch-${++nextSwitchId}`;

  private onChange: (value: boolean) => void = () => {
    /* noop default callback */
  };
  private onTouched: () => void = () => {
    /* noop default callback */
  };

  get switchId(): string {
    return this.id || this.generatedId;
  }

  writeValue(value: boolean | null | undefined): void {
    this.checked = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggle(): void {
    if (this.disabled) {
      return;
    }
    this.checked = !this.checked;
    this.onChange(this.checked);
    this.checkedChange.emit(this.checked);
    this.onTouched();
  }
}
