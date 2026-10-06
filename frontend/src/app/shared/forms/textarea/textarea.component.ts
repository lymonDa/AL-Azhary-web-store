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

let nextTextareaId = 0;

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="az-textarea-wrapper"
      [class.az-textarea-wrapper--focused]="isFocused()"
      [class.az-textarea-wrapper--disabled]="disabled"
      [class.az-textarea-wrapper--invalid]="invalid"
      [class.az-textarea-wrapper--readonly]="readonly"
    >
      <textarea
        [id]="textareaId"
        [value]="value"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readOnly]="readonly"
        [rows]="rows"
        [attr.maxlength]="maxlength || null"
        [attr.aria-invalid]="invalid ? 'true' : null"
        [attr.aria-describedby]="ariaDescribedBy || null"
        [style.resize]="resize"
        class="az-textarea"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
      ></textarea>
    </div>
  `,
  styleUrl: './textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() invalid = false;
  @Input() id?: string | undefined;
  @Input() rows = 4;
  @Input() resize: 'vertical' | 'none' | 'both' = 'vertical';
  @Input() maxlength?: number | undefined;
  @Input() ariaDescribedBy?: string | undefined;

  @Output() valueChange = new EventEmitter<string>();

  private readonly generatedId = `az-textarea-${++nextTextareaId}`;

  value = '';
  protected readonly isFocused = signal(false);

  private onChange: (value: string) => void = () => {
    /* noop default callback */
  };
  private onTouched: () => void = () => {
    /* noop default callback */
  };

  get textareaId(): string {
    return this.id || this.generatedId;
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
    const target = event.target as HTMLTextAreaElement;
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
