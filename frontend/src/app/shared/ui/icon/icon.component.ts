import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideIconData,
  Check,
  X,
  Clock3,
  ClipboardCheck,
  WalletCards,
  SearchCheck,
  Upload,
  BadgeCheck,
  CircleAlert,
  CheckCircle2,
  PackageOpen,
  Store,
  HandCoins,
  Truck,
  Route,
  PackageCheck,
  XCircle,
  Ban,
  Undo2,
  Circle,
  RefreshCw,
  ArrowDownToLine,
  AlertTriangle,
  Info,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-angular';

export const ICON_REGISTRY: Record<string, LucideIconData> = {
  check: Check,
  x: X,
  'clock-3': Clock3,
  'clipboard-check': ClipboardCheck,
  'wallet-cards': WalletCards,
  'search-check': SearchCheck,
  upload: Upload,
  'badge-check': BadgeCheck,
  'circle-alert': CircleAlert,
  'check-circle-2': CheckCircle2,
  'package-open': PackageOpen,
  store: Store,
  'hand-coins': HandCoins,
  truck: Truck,
  route: Route,
  'package-check': PackageCheck,
  'x-circle': XCircle,
  ban: Ban,
  'undo-2': Undo2,
  circle: Circle,
  'refresh-cw': RefreshCw,
  'arrow-down-to-line': ArrowDownToLine,
  'circle-check': CheckCircle2,
  'alert-triangle': AlertTriangle,
  'alert-circle': CircleAlert,
  info: Info,
  plus: Plus,
  minus: Minus,
  eye: Eye,
  'eye-off': EyeOff,
  search: Search,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  spinner: Loader2,
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.viewBox]="'0 0 24 24'"
      [attr.width]="size"
      [attr.height]="size"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      [class.spinning]="spin"
      [attr.aria-hidden]="ariaLabel ? null : 'true'"
      [attr.aria-label]="ariaLabel || null"
      role="img"
    >
      @if (ariaLabel) {
        <title>{{ ariaLabel }}</title>
      }
      @for (node of iconData(); track $index) {
        @if (node[0] === 'path') {
          <path [attr.d]="node[1]['d']" />
        } @else if (node[0] === 'circle') {
          <circle
            [attr.cx]="node[1]['cx']"
            [attr.cy]="node[1]['cy']"
            [attr.r]="node[1]['r']"
          />
        } @else if (node[0] === 'line') {
          <line
            [attr.x1]="node[1]['x1']"
            [attr.y1]="node[1]['y1']"
            [attr.x2]="node[1]['x2']"
            [attr.y2]="node[1]['y2']"
          />
        } @else if (node[0] === 'rect') {
          <rect
            [attr.x]="node[1]['x']"
            [attr.y]="node[1]['y']"
            [attr.width]="node[1]['width']"
            [attr.height]="node[1]['height']"
            [attr.rx]="node[1]['rx']"
            [attr.ry]="node[1]['ry']"
          />
        } @else if (node[0] === 'polyline') {
          <polyline [attr.points]="node[1]['points']" />
        } @else if (node[0] === 'polygon') {
          <polygon [attr.points]="node[1]['points']" />
        }
      }
    </svg>
  `,
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  @Input({ required: true }) name!: string;
  @Input() size = 20;
  @Input() strokeWidth = 2;
  @Input() spin = false;
  @Input() ariaLabel?: string | undefined;

  protected readonly iconData = computed(() => {
    return ICON_REGISTRY[this.name] ?? ICON_REGISTRY['circle'] ?? [];
  });
}
