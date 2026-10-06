import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';

describe('FormFieldComponent', () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the form field component', () => {
    expect(component).toBeTruthy();
  });

  it('should render label and required indicator when specified', () => {
    fixture.componentRef.setInput('label', 'البريد الإلكتروني');
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label');
    expect(label.textContent).toContain('البريد الإلكتروني');
    const required = fixture.nativeElement.querySelector('.az-form-field__required');
    expect(required).toBeTruthy();
  });

  it('should render error with role="alert" when error is present', () => {
    fixture.componentRef.setInput('error', 'هذا الحقل مطلوب');
    fixture.detectChanges();
    const errorEl = fixture.nativeElement.querySelector('.az-form-field__error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('هذا الحقل مطلوب');
    expect(errorEl.getAttribute('role')).toBe('alert');
  });

  it('should render hint when hint is present and error is null', () => {
    fixture.componentRef.setInput('hint', 'يرجى إدخال بريد صالح');
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    const hintEl = fixture.nativeElement.querySelector('.az-form-field__hint');
    expect(hintEl).toBeTruthy();
    expect(hintEl.textContent).toContain('يرجى إدخال بريد صالح');
  });
});
