import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeVariant = 'subtle' | 'outline' | 'solid';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <span [class]="badgeClasses">
      @if (dot) {
        <span class="az-badge__dot" aria-hidden="true"></span>
      } @else if (icon) {
        <app-icon [name]="icon" [size]="iconSize" class="az-badge__icon" />
      }
      <span class="az-badge__label">
        <ng-content />
      </span>
    </span>
  `,
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  @Input() tone: BadgeTone = 'neutral';
  @Input() variant: BadgeVariant = 'subtle';
  @Input() size: BadgeSize = 'md';
  @Input() icon?: string | undefined;
  @Input() dot = false;

  get badgeClasses(): string {
    return [
      'az-badge',
      `az-badge--${this.tone}`,
      `az-badge--${this.variant}`,
      `az-badge--${this.size}`,
    ].join(' ');
  }

  get iconSize(): number {
    return this.size === 'sm' ? 12 : 14;
  }
}
