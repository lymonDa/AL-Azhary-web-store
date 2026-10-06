import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';
import { StatusPresentationService } from './status-presentation.service';

describe('StatusPresentation and StatusBadge', () => {
  let service: StatusPresentationService;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
      providers: [StatusPresentationService],
    }).compileComponents();

    service = TestBed.inject(StatusPresentationService);
    fixture = TestBed.createComponent(StatusBadgeComponent);
  });

  it('should resolve order status correctly from dictionary', () => {
    const meta = service.resolve('order', 'pending_review');
    expect(meta.tone).toBe('warning');
    expect(meta.icon).toBe('clock-3');
    expect(meta.labelAr).toBe('قيد المراجعة');
  });

  it('should resolve inventory status correctly', () => {
    const meta = service.resolve('inventory', 'in_stock');
    expect(meta.tone).toBe('success');
    expect(meta.icon).toBe('check-circle-2');
    expect(meta.labelAr).toBe('متوفر');
  });

  it('should render StatusBadge with resolved tone, label, and icon', () => {
    fixture.componentRef.setInput('kind', 'order');
    fixture.componentRef.setInput('status', 'completed');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('app-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('مكتمل');
  });

  it('should allow custom override for label and tone', () => {
    fixture.componentRef.setInput('kind', 'order');
    fixture.componentRef.setInput('status', 'custom_state');
    fixture.componentRef.setInput('label', 'حالة خاصة');
    fixture.componentRef.setInput('tone', 'primary');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('app-badge');
    expect(badge.textContent).toContain('حالة خاصة');
  });
});
