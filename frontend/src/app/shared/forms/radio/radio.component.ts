import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
  InjectionToken,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';

export interface RadioGroupContext {
  name: string;
  selectedValue: unknown;
  disabled: boolean;
  selectValue(val: unknown): void;
}

export const RADIO_GROUP = new InjectionToken<RadioGroupContext>('RADIO_GROUP');

let nextRadioGroupId = 0;
let nextRadioId = 0;

@Component({
  selector: 'app-radio-group',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true,
    },
    {
      provide: RADIO_GROUP,
      useExisting: forwardRef(() => RadioGroupComponent),
    },
  ],
  template: `
    <div
      class="az-radio-group"
      role="radiogroup"
      [attr.aria-disabled]="disabled ? 'true' : null"
    >
      <ng-content />
    </div>
  `,
  styles: [
    `
      .az-radio-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioGroupComponent implements ControlValueAccessor, RadioGroupContext {
  @Input() name = `az-radio-group-${++nextRadioGroupId}`;
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<unknown>();

  selectedValue: unknown = null;

  private onChange: (value: unknown) => void = () => {
    /* noop default callback */
  };
  private onTouched: () => void = () => {
    /* noop default callback */
  };

  writeValue(value: unknown): void {
    this.selectedValue = value;
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  selectValue(val: unknown): void {
    if (this.disabled) {
      return;
    }
    this.selectedValue = val;
    this.onChange(val);
    this.valueChange.emit(val);
    this.onTouched();
  }
}

@Component({
  selector: 'app-radio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <label
      [attr.for]="radioId"
      class="az-radio-label"
      [class.az-radio-label--disabled]="isDisabled"
    >
      <input
        type="radio"
        [id]="radioId"
        [name]="groupName"
        [value]="value"
        [checked]="isChecked"
        [disabled]="isDisabled"
        class="az-radio-input visually-hidden"
        (change)="onRadioChange()"
      />
      <span
        class="az-radio-control"
        [class.az-radio-control--checked]="isChecked"
        aria-hidden="true"
      >
        <span class="az-radio-dot"></span>
      </span>
      <span class="az-radio-text">
        <ng-content />
        @if (label) {
          {{ label }}
        }
      </span>
    </label>
  `,
  styleUrl: './radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioComponent {
  @Input() value: unknown;
  @Input() label?: string | undefined;
  @Input() disabled = false;
  @Input() id?: string | undefined;

  private readonly group = inject(RADIO_GROUP, { optional: true });
  private readonly generatedId = `az-radio-${++nextRadioId}`;

  get radioId(): string {
    return this.id || this.generatedId;
  }

  get groupName(): string {
    return this.group?.name || '';
  }

  get isChecked(): boolean {
    return this.group ? this.group.selectedValue === this.value : false;
  }

  get isDisabled(): boolean {
    return this.disabled || !!this.group?.disabled;
  }

  onRadioChange(): void {
    if (!this.isDisabled && this.group) {
      this.group.selectValue(this.value);
    }
  }
}
