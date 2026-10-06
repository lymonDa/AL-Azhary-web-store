import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('Modal and ConfirmDialog', () => {
  describe('ModalComponent', () => {
    let component: ModalComponent;
    let fixture: ComponentFixture<ModalComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ModalComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(ModalComponent);
      component = fixture.componentInstance;
    });

    it('should not render backdrop when isOpen is false', () => {
      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();
      const backdrop = fixture.nativeElement.querySelector('.az-modal-backdrop');
      expect(backdrop).toBeNull();
    });

    it('should render dialog with role="dialog" and aria-modal="true" when isOpen is true', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', 'نافذة تجريبية');
      fixture.detectChanges();

      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toContain('title');

      const title = fixture.nativeElement.querySelector('.az-modal__title');
      expect(title.textContent).toBe('نافذة تجريبية');
    });

    it('should emit modalClosed and close when close button is clicked', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      let closed = false;
      component.modalClosed.subscribe(() => {
        closed = true;
      });

      const closeBtn = fixture.nativeElement.querySelector('.az-modal__close-btn');
      closeBtn.click();
      fixture.detectChanges();

      expect(closed).toBeTrue();
      expect(component.isOpen).toBeFalse();
    });

    it('should close on escape key event', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('closeOnEscape', true);
      fixture.detectChanges();

      let closed = false;
      component.modalClosed.subscribe(() => {
        closed = true;
      });

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      fixture.detectChanges();

      expect(closed).toBeTrue();
    });
  });

  describe('ConfirmDialogComponent', () => {
    let component: ConfirmDialogComponent;
    let fixture: ComponentFixture<ConfirmDialogComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ConfirmDialogComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(ConfirmDialogComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('title', 'تأكيد الحذف');
      fixture.componentRef.setInput('message', 'هل أنت متأكد من رغبتك في المتابعة؟');
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should emit confirmed when confirm action is triggered', () => {
      let confirmed = false;
      component.confirmed.subscribe(() => {
        confirmed = true;
      });

      component.onConfirm();
      expect(confirmed).toBeTrue();
    });

    it('should emit cancelled when cancel action is triggered', () => {
      let cancelled = false;
      component.cancelled.subscribe(() => {
        cancelled = true;
      });

      component.onCancel();
      expect(cancelled).toBeTrue();
    });
  });
});
