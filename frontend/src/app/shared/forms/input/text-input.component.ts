import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import { IconComponent } from '../../ui/icon/icon.component';

export type InputType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'search';

let nextInputId = 0;

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="az-input-wrapper"
      [class.az-input-wrapper--focused]="isFocused()"
      [class.az-input-wrapper--disabled]="disabled"
      [class.az-input-wrapper--invalid]="invalid"
      [class.az-input-wrapper--readonly]="readonly"
    >
      @if (prefixIcon) {
        <span class="az-input__affordance az-input__affordance--prefix">
          <app-icon [name]="prefixIcon" [size]="18" />
        </span>
      }

      <input
        [id]="inputId"
        [type]="effectiveType"
        [value]="value"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readOnly]="readonly"
        [attr.autocomplete]="autocomplete"
        [attr.aria-invalid]="invalid ? 'true' : null"
        [attr.aria-describedby]="ariaDescribedBy || null"
        class="az-input"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown)="onKeyDown($event)"
      />

      @if (clearable && value && !disabled && !readonly) {
        <button
          type="button"
          class="az-input__action-btn"
          (click)="clearValue()"
          aria-label="مسح النص"
        >
          <app-icon name="x" [size]="16" />
        </button>
      }

      @if (type === 'password' && !disabled) {
        <button
          type="button"
          class="az-input__action-btn"
          (click)="togglePasswordVisibility()"
          [attr.aria-label]="showPassword() ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'"
        >
          <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="18" />
        </button>
      } @else if (suffixIcon && (!clearable || !value)) {
        <span class="az-input__affordance az-input__affordance--suffix">
          <app-icon [name]="suffixIcon" [size]="18" />
        </span>
      }
    </div>
  `,
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextInputComponent implements ControlValueAccessor {
  @Input() type: InputType = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() invalid = false;
  @Input() id?: string | undefined;
  @Input() autocomplete = 'off';
  @Input() ariaDescribedBy?: string | undefined;
  @Input() prefixIcon?: string | undefined;
  @Input() suffixIcon?: string | undefined;
  @Input() clearable = false;

  @Output() valueChange = new EventEmitter<string>();

  private readonly generatedId = `az-input-${++nextInputId}`;

  value = '';
  protected readonly isFocused = signal(false);
  protected readonly showPassword = signal(false);

  private onChange: (value: string) => void = () => {
    /* noop default callback */
  };
  private onTouched: () => void = () => {
    /* noop default callback */
  };

  get inputId(): string {
    return this.id || this.generatedId;
  }

  get effectiveType(): string {
    if (this.type === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type;
  }

  writeValue(value: string | null | undefined): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onFocus(): void {
    this.isFocused.set(true);
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.clearable && this.value) {
      this.clearValue();
    }
  }

  clearValue(): void {
    this.value = '';
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }
}
