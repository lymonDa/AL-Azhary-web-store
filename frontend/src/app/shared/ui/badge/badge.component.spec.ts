import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the badge component', () => {
    expect(component).toBeTruthy();
  });

  it('should apply neutral tone and subtle variant by default', () => {
    const badge = fixture.nativeElement.querySelector('.az-badge');
    expect(badge.classList.contains('az-badge--neutral')).toBeTrue();
    expect(badge.classList.contains('az-badge--subtle')).toBeTrue();
    expect(badge.classList.contains('az-badge--md')).toBeTrue();
  });

  it('should apply tone, variant, and size classes', () => {
    fixture.componentRef.setInput('tone', 'success');
    fixture.componentRef.setInput('variant', 'solid');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.az-badge');
    expect(badge.classList.contains('az-badge--success')).toBeTrue();
    expect(badge.classList.contains('az-badge--solid')).toBeTrue();
    expect(badge.classList.contains('az-badge--sm')).toBeTrue();
  });

  it('should render dot indicator when dot is true', () => {
    fixture.componentRef.setInput('dot', true);
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.az-badge__dot');
    expect(dot).toBeTruthy();
    expect(dot.getAttribute('aria-hidden')).toBe('true');
  });

  it('should render icon when icon is provided and dot is false', () => {
    fixture.componentRef.setInput('icon', 'check');
    fixture.componentRef.setInput('dot', false);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('app-icon');
    expect(icon).toBeTruthy();
  });
});
