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

let nextCheckboxId = 0;

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <label
      [attr.for]="checkboxId"
      class="az-checkbox-label"
      [class.az-checkbox-label--disabled]="disabled"
    >
      <input
        type="checkbox"
        [id]="checkboxId"
        [checked]="checked"
        [disabled]="disabled"
        [indeterminate]="indeterminate"
        [attr.aria-describedby]="ariaDescribedBy || null"
        class="az-checkbox-input visually-hidden"
        (change)="onCheckboxChange($event)"
      />
      <span
        class="az-checkbox-control"
        [class.az-checkbox-control--checked]="checked && !indeterminate"
        [class.az-checkbox-control--indeterminate]="indeterminate"
        aria-hidden="true"
      >
        @if (indeterminate) {
          <app-icon name="minus" [size]="14" />
        } @else if (checked) {
          <app-icon name="check" [size]="14" />
        }
      </span>
      <span class="az-checkbox-text">
        <ng-content />
        @if (label) {
          {{ label }}
        }
      </span>
    </label>
  `,
  styleUrl: './checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() label?: string | undefined;
  @Input() checked = false;
  @Input() indeterminate = false;
  @Input() disabled = false;
  @Input() id?: string | undefined;
  @Input() ariaDescribedBy?: string | undefined;

  @Output() checkedChange = new EventEmitter<boolean>();

  private readonly generatedId = `az-checkbox-${++nextCheckboxId}`;

  private onChange: (value: boolean) => void = () => {
    /* noop default callback */
  };
  private onTouched: () => void = () => {
    /* noop default callback */
  };

  get checkboxId(): string {
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

  onCheckboxChange(event: Event): void {
    if (this.disabled) {
      return;
    }
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.indeterminate = false;
    this.onChange(this.checked);
    this.checkedChange.emit(this.checked);
    this.onTouched();
  }
}
