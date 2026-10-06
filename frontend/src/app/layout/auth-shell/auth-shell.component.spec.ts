import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthShellComponent } from './auth-shell.component';
import { LocaleService } from '../../core/i18n/locale.service';

describe('AuthShellComponent', () => {
  let fixture: ComponentFixture<AuthShellComponent>;
  let component: AuthShellComponent;
  let localeService: LocaleService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthShellComponent],
      providers: [provideRouter([]), LocaleService],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthShellComponent);
    component = fixture.componentInstance;
    localeService = TestBed.inject(LocaleService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localeService.setLocale('ar');
  });

  it('creates successfully', () => {
    expect(component).toBeTruthy();
  });

  it('renders brand title and logo text', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.az-auth-shell__title')?.textContent).toContain('مكتبة الأزهري');
    expect(el.querySelector('.az-auth-shell__subtitle')?.textContent).toContain('AL-AZHARI LIBRARY');
  });

  it('toggles locale between ar and en on language button click', () => {
    const langBtn = fixture.nativeElement.querySelector(
      '.az-auth-shell__lang-toggle',
    ) as HTMLButtonElement;

    expect(localeService.currentLocale()).toBe('ar');
    expect(langBtn.textContent?.trim()).toBe('English');

    langBtn.click();
    fixture.detectChanges();

    expect(localeService.currentLocale()).toBe('en');
    expect(langBtn.textContent?.trim()).toBe('عربي');
  });

  it('renders a router-outlet placeholder for auth pages', () => {
    const outlet = fixture.nativeElement.querySelector('router-outlet');
    expect(outlet).not.toBeNull();
  });
});
