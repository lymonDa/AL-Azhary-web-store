import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="az-skeleton"
      [class.az-skeleton--text]="variant() === 'text'"
      [class.az-skeleton--circle]="variant() === 'circle'"
      [class.az-skeleton--rect]="variant() === 'rect'"
      [class.az-skeleton--card]="variant() === 'card'"
      [style.inline-size]="inlineSize()"
      [style.block-size]="blockSize()"
      aria-hidden="true"
    ></div>
  `,
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly variant = input<'text' | 'rect' | 'circle' | 'card'>('text');
  readonly inlineSize = input<string>('100%');
  readonly blockSize = input<string>('1rem');
}
