import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { StorefrontShellComponent } from './storefront-shell.component';
import { LocaleService } from '../../core/i18n/locale.service';
import { AuthStore } from '../../core/auth/auth.store';
import { AppConfigStore } from '../../core/config/app-config.store';

describe('StorefrontShellComponent', () => {
  let component: StorefrontShellComponent;
  let fixture: ComponentFixture<StorefrontShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorefrontShellComponent],
      providers: [
        provideRouter([]),
        LocaleService,
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: () => false,
            user: () => null,
            logout: () => of(void 0),
          },
        },
        {
          provide: AppConfigStore,
          useValue: {
            config: () => ({
              serviceabilityCopy: { ar: 'شحن لجميع المحافظات' },
              businessHours: { ar: '٩:٠٠ ص - ١٠:٠٠ م' },
            }),
            contact: () => ({
              phone: '+201000000000',
              whatsappNumber: '+201000000000',
              address: { ar: 'قنا، مصر' },
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StorefrontShellComponent);
    component = fixture.componentInstance;
  });

  it('should render header, brand logo, and footer', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.az-header__brand')).toBeTruthy();
    expect(compiled.querySelector('.az-header__nav')).toBeTruthy();
    expect(compiled.querySelector('.az-footer')).toBeTruthy();
  });

  it('should toggle mobile menu drawer', () => {
    fixture.detectChanges();
    expect(component['mobileMenuOpen']()).toBeFalse();

    component['openMobileMenu']();
    expect(component['mobileMenuOpen']()).toBeTrue();

    component['closeMobileMenu']();
    expect(component['mobileMenuOpen']()).toBeFalse();
  });
});
