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

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

let nextSelectId = 0;

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="az-select-wrapper"
      [class.az-select-wrapper--focused]="isFocused()"
      [class.az-select-wrapper--disabled]="disabled"
      [class.az-select-wrapper--invalid]="invalid"
    >
      <select
        [id]="selectId"
        [disabled]="disabled"
        [attr.aria-invalid]="invalid ? 'true' : null"
        [attr.aria-describedby]="ariaDescribedBy || null"
        class="az-select"
        [value]="value"
        (change)="onChangeSelect($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
      >
        @if (placeholder) {
          <option value="" disabled [selected]="!value">
            {{ placeholder }}
          </option>
        }
        @for (opt of options; track opt.value) {
          <option [value]="opt.value" [disabled]="opt.disabled">
            {{ opt.label }}
          </option>
        }
      </select>

      <span class="az-select__chevron" aria-hidden="true">
        <app-icon name="chevron-down" [size]="18" />
      </span>
    </div>
  `,
  styleUrl: './select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() invalid = false;
  @Input() id?: string | undefined;
  @Input() ariaDescribedBy?: string | undefined;

  @Output() valueChange = new EventEmitter<string | number>();

  private readonly generatedId = `az-select-${++nextSelectId}`;

  value: string | number = '';
  protected readonly isFocused = signal(false);

  private onChange: (value: string | number) => void = () => {
    /* noop default callback */
  };
  private onTouched: () => void = () => {
    /* noop default callback */
  };

  get selectId(): string {
    return this.id || this.generatedId;
  }

  writeValue(value: string | number | null | undefined): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onChangeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
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
}
