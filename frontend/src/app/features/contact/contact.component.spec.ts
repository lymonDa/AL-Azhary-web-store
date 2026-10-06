import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';
import { AppConfigStore } from '../../core/config/app-config.store';
import { LocaleService } from '../../core/i18n/locale.service';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        LocaleService,
        {
          provide: AppConfigStore,
          useValue: {
            contact: () => ({
              phone: '+201000000000',
              whatsappNumber: '+201000000000',
              email: 'info@al-azhari.com',
              address: { ar: 'قنا، جمهورية مصر العربية' },
            }),
            config: () => ({
              businessHours: { ar: 'السبت - الخميس: ٩ ص - ١٠ م' },
              serviceabilityCopy: { ar: 'التوصيل متاح لجميع المحافظات' },
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
  });

  it('should render contact information and channels', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.az-contact-page__title')).toBeTruthy();
    expect(compiled.textContent).toContain('+201000000000');
    expect(compiled.textContent).toContain('info@al-azhari.com');
    expect(compiled.textContent).toContain('قنا، جمهورية مصر العربية');
    expect(compiled.querySelector('.az-contact-card--whatsapp')).toBeTruthy();
  });
});
