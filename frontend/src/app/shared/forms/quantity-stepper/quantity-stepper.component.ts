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
  FormsModule,
} from '@angular/forms';
import { IconComponent } from '../../ui/icon/icon.component';

@Component({
  selector: 'app-quantity-stepper',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QuantityStepperComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="az-stepper"
      [class.az-stepper--disabled]="disabled"
      role="group"
      aria-label="محدد الكمية"
    >
      <button
        type="button"
        class="az-stepper__btn az-stepper__btn--decrement"
        [disabled]="disabled || value <= min"
        (click)="decrement()"
        aria-label="تقليل الكمية"
      >
        <app-icon name="minus" [size]="16" />
      </button>

      <input
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        class="az-stepper__input"
        [value]="value"
        [disabled]="disabled"
        aria-label="الكمية"
        (change)="onManualInputChange($event)"
        (keydown.arrowUp)="$event.preventDefault(); increment()"
        (keydown.arrowDown)="$event.preventDefault(); decrement()"
      />

      <button
        type="button"
        class="az-stepper__btn az-stepper__btn--increment"
        [disabled]="disabled || (max !== undefined && value >= max)"
        (click)="increment()"
        aria-label="زيادة الكمية"
      >
        <app-icon name="plus" [size]="16" />
      </button>
    </div>
  `,
  styleUrl: './quantity-stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantityStepperComponent implements ControlValueAccessor {
  @Input() min = 1;
  @Input() max?: number | undefined;
  @Input() step = 1;
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<number>();

  value = 1;

  private onChange: (value: number) => void = () => {
    /* noop default callback */
  };
  private onTouched: () => void = () => {
    /* noop default callback */
  };

  writeValue(value: number | null | undefined): void {
    if (value !== null && value !== undefined) {
      this.value = this.clamp(value);
    } else {
      this.value = this.min;
    }
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  increment(): void {
    if (this.disabled) {
      return;
    }
    const nextVal = this.value + this.step;
    if (this.max === undefined || nextVal <= this.max) {
      this.updateValue(nextVal);
    }
  }

  decrement(): void {
    if (this.disabled) {
      return;
    }
    const nextVal = this.value - this.step;
    if (nextVal >= this.min) {
      this.updateValue(nextVal);
    }
  }

  onManualInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const parsed = parseInt(input.value, 10);
    if (!isNaN(parsed)) {
      this.updateValue(this.clamp(parsed));
    } else {
      input.value = this.value.toString();
    }
  }

  private updateValue(newValue: number): void {
    this.value = newValue;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.onTouched();
  }

  private clamp(val: number): number {
    let result = Math.max(this.min, Math.floor(val));
    if (this.max !== undefined) {
      result = Math.min(this.max, result);
    }
    return result;
  }
}
