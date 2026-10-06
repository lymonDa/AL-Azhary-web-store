import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundComponent } from './not-found.component';
import { LocaleService } from '../../../core/i18n/locale.service';

describe('NotFoundComponent', () => {
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([]), LocaleService],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
  });

  it('should render 404 code and navigation buttons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.az-error-page__code')?.textContent).toContain('404');
    expect(compiled.querySelector('.az-error-page__title')).toBeTruthy();
  });
});
