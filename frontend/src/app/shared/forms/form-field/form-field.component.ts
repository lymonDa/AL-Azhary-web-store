import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

let nextUniqueId = 0;

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="az-form-field" [class.az-form-field--error]="!!error">
      @if (label) {
        <label [attr.for]="fieldId" class="az-form-field__label">
          {{ label }}
          @if (required) {
            <span class="az-form-field__required" aria-hidden="true">*</span>
          }
        </label>
      }

      <div class="az-form-field__control">
        <ng-content />
      </div>

      @if (error) {
        <p
          [id]="fieldId + '-error'"
          class="az-form-field__error"
          role="alert"
          aria-live="polite"
        >
          {{ error }}
        </p>
      } @else if (hint) {
        <p [id]="fieldId + '-hint'" class="az-form-field__hint">
          {{ hint }}
        </p>
      }
    </div>
  `,
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  @Input() label?: string | undefined;
  @Input() hint?: string | undefined;
  @Input() error?: string | null | undefined;
  @Input() required = false;
  @Input() forId?: string | undefined;

  private readonly generatedId = `az-field-${++nextUniqueId}`;

  get fieldId(): string {
    return this.forId || this.generatedId;
  }
}
