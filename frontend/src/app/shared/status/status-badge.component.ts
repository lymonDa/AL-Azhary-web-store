import {
  Component,
  Input,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent, BadgeSize } from '../ui/badge/badge.component';
import { StatusPresentationService } from './status-presentation.service';
import { StatusKind, StatusTone } from './status-presentation.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  template: `
    <app-badge
      [tone]="resolvedTone()"
      [size]="size"
      [icon]="showIcon ? resolvedIcon() : undefined"
      variant="subtle"
      class="az-status-badge"
    >
      {{ resolvedLabel() }}
    </app-badge>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  private readonly presentation = inject(StatusPresentationService);

  @Input({ required: true }) status!: string;
  @Input() kind: StatusKind = 'order';
  @Input() label?: string | undefined;
  @Input() tone?: StatusTone | undefined;
  @Input() icon?: string | undefined;
  @Input() size: BadgeSize = 'md';
  @Input() showIcon = true;

  protected readonly meta = computed(() => {
    return this.presentation.resolve(this.kind, this.status);
  });

  protected readonly resolvedLabel = computed(() => {
    if (this.label) {
      return this.label;
    }
    return this.presentation.getLabel(this.meta());
  });

  protected readonly resolvedTone = computed(() => {
    return this.tone ?? this.meta().tone;
  });

  protected readonly resolvedIcon = computed(() => {
    return this.icon ?? this.meta().icon;
  });
}
