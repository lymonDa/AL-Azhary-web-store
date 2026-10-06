import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextInputComponent } from './text-input.component';

describe('TextInputComponent', () => {
  let component: TextInputComponent;
  let fixture: ComponentFixture<TextInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TextInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the input component', () => {
    expect(component).toBeTruthy();
  });

  it('should update value and emit valueChange on input', () => {
    let emitted = '';
    component.valueChange.subscribe((val) => {
      emitted = val;
    });

    const input = fixture.nativeElement.querySelector('input');
    input.value = 'اختبار';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.value).toBe('اختبار');
    expect(emitted).toBe('اختبار');
  });

  it('should toggle password visibility when type is password', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('password');

    const toggleBtn = fixture.nativeElement.querySelector('.az-input__action-btn');
    expect(toggleBtn).toBeTruthy();

    toggleBtn.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');

    toggleBtn.click();
    fixture.detectChanges();
    expect(input.type).toBe('password');
  });

  it('should clear value when clear button is clicked', () => {
    fixture.componentRef.setInput('clearable', true);
    component.value = 'نص للإزالة';
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.az-input__action-btn');
    expect(clearBtn).toBeTruthy();

    clearBtn.click();
    fixture.detectChanges();
    expect(component.value).toBe('');
  });

  it('should apply invalid and disabled attributes', () => {
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.az-input-wrapper');
    const input = fixture.nativeElement.querySelector('input');

    expect(wrapper.classList.contains('az-input-wrapper--invalid')).toBeTrue();
    expect(wrapper.classList.contains('az-input-wrapper--disabled')).toBeTrue();
    expect(input.disabled).toBeTrue();
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
