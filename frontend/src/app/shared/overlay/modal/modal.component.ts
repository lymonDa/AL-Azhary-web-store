import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { IconComponent } from '../../ui/icon/icon.component';

let nextModalId = 0;

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, A11yModule, IconComponent],
  template: `
    @if (isOpen) {
      <div class="az-modal-backdrop">
        <button
          type="button"
          class="az-modal-backdrop-dismiss"
          tabindex="-1"
          aria-hidden="true"
          (click)="onBackdropClick()"
        ></button>
        <div
          #modalContainer
          class="az-modal"
          [class]="sizeClass"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="title ? titleId : null"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
        >
          <div class="az-modal__header">
            @if (title) {
              <h2 [id]="titleId" class="az-modal__title">{{ title }}</h2>
            }
            @if (showCloseButton) {
              <button
                type="button"
                class="az-modal__close-btn"
                (click)="close()"
                aria-label="إغلاق النافذة"
              >
                <app-icon name="x" [size]="20" />
              </button>
            }
          </div>

          <div class="az-modal__body">
            <ng-content />
          </div>

          @if (hasFooter) {
            <div class="az-modal__footer">
              <ng-content select="[modal-footer]" />
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  @Input() isOpen = false;
  @Input() title?: string | undefined;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;
  @Input() showCloseButton = true;
  @Input() hasFooter = false;

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() modalClosed = new EventEmitter<void>();

  @ViewChild('modalContainer') modalContainer?: ElementRef<HTMLElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private previousActiveElement: HTMLElement | null = null;
  readonly modalId = `az-modal-${++nextModalId}`;
  readonly titleId = `${this.modalId}-title`;

  get sizeClass(): string {
    return `az-modal--${this.size}`;
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.previousActiveElement = document.activeElement as HTMLElement;
    }
  }

  ngOnDestroy(): void {
    this.restoreFocus();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isOpen && this.closeOnEscape) {
      event.preventDefault();
      this.close();
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.modalClosed.emit();
    this.restoreFocus();
  }

  private restoreFocus(): void {
    if (isPlatformBrowser(this.platformId) && this.previousActiveElement) {
      this.previousActiveElement.focus?.();
      this.previousActiveElement = null;
    }
  }
}
