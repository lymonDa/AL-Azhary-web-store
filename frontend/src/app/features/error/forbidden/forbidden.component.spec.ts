import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ForbiddenComponent } from './forbidden.component';
import { LocaleService } from '../../../core/i18n/locale.service';

describe('ForbiddenComponent', () => {
  let fixture: ComponentFixture<ForbiddenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenComponent],
      providers: [provideRouter([]), LocaleService],
    }).compileComponents();

    fixture = TestBed.createComponent(ForbiddenComponent);
  });

  it('should render 403 code and title', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.az-error-page__code')?.textContent).toContain('403');
    expect(compiled.querySelector('.az-error-page__title')).toBeTruthy();
  });
});
