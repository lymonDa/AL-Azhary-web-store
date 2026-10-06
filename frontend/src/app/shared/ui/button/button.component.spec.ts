import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the button component', () => {
    expect(component).toBeTruthy();
  });

  it('should render primary variant by default', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('az-btn--primary')).toBeTrue();
    expect(btn.classList.contains('az-btn--md')).toBeTrue();
  });

  it('should apply variant and size classes properly', () => {
    fixture.componentRef.setInput('variant', 'destructive');
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('az-btn--destructive')).toBeTrue();
    expect(btn.classList.contains('az-btn--lg')).toBeTrue();
  });

  it('should disable button and prevent click when disabled is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBeTrue();
    expect(btn.getAttribute('aria-disabled')).toBe('true');

    let clicked = false;
    component.buttonClick.subscribe(() => {
      clicked = true;
    });

    btn.click();
    expect(clicked).toBeFalse();
  });

  it('should show loading spinner and set aria-busy when loading is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBeTrue();
    expect(btn.getAttribute('aria-busy')).toBe('true');
    const spinner = fixture.nativeElement.querySelector('app-icon');
    expect(spinner).toBeTruthy();

    let clicked = false;
    component.buttonClick.subscribe(() => {
      clicked = true;
    });

    btn.click();
    expect(clicked).toBeFalse();
  });

  it('should render start and end icons when configured', () => {
    fixture.componentRef.setInput('icon', 'check');
    fixture.componentRef.setInput('iconPosition', 'start');
    fixture.detectChanges();
    let icon = fixture.nativeElement.querySelector('.button-icon-start');
    expect(icon).toBeTruthy();

    fixture.componentRef.setInput('iconPosition', 'end');
    fixture.detectChanges();
    icon = fixture.nativeElement.querySelector('.button-icon-end');
    expect(icon).toBeTruthy();
  });

  it('should support icon-only button with accessible aria-label', () => {
    fixture.componentRef.setInput('isIconButton', true);
    fixture.componentRef.setInput('icon', 'check');
    fixture.componentRef.setInput('ariaLabel', 'تأكيد الحفظ');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('az-btn--icon-only')).toBeTrue();
    expect(btn.getAttribute('aria-label')).toBe('تأكيد الحفظ');
  });

  it('should emit buttonClick when clicked and active', () => {
    let clicked = false;
    component.buttonClick.subscribe(() => {
      clicked = true;
    });
    const btn = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(clicked).toBeTrue();
  });
});
