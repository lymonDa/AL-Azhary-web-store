import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AccountStore } from '../../../core/account/account.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { ToastService } from '../../../shared/overlay/toast/toast.service';
import type { CustomerProfile } from '../../../domain/models/customer.model';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let accountStoreSpy: jasmine.SpyObj<AccountStore>;
  let localeServiceSpy: jasmine.SpyObj<LocaleService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockCustomerProfile: CustomerProfile = {
    id: 'usr-1',
    name: 'أحمد محمود',
    email: 'ahmed@example.com',
    phone: '01012345678',
    role: 'customer',
    status: 'active',
    emailVerifiedAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(async () => {
    accountStoreSpy = jasmine.createSpyObj<AccountStore>('AccountStore', [
      'loadProfile',
      'updateProfile',
    ], {
      profile: signal<CustomerProfile | null>(mockCustomerProfile),
      isLoadingProfile: signal(false),
    });
    accountStoreSpy.loadProfile.and.returnValue(of(mockCustomerProfile));

    localeServiceSpy = jasmine.createSpyObj<LocaleService>('LocaleService', [], {
      isArabic: signal(true),
      direction: signal('rtl'),
      currentLocale: signal('ar'),
    });

    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'info', 'warning', 'show']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AccountStore, useValue: accountStoreSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form with customer profile data', () => {
    expect(component).toBeTruthy();
    expect(component.form.get('name')?.value).toBe('أحمد محمود');
    expect(component.form.get('phone')?.value).toBe('01012345678');
  });

  it('should submit updated profile data', () => {
    accountStoreSpy.updateProfile.and.returnValue(of({
      ...mockCustomerProfile,
      name: 'أحمد محمود الجديد',
    }));

    component.form.patchValue({ name: 'أحمد محمود الجديد' });
    component.form.markAsDirty();
    component.onSubmit();

    expect(accountStoreSpy.updateProfile).toHaveBeenCalledWith({
      name: 'أحمد محمود الجديد',
      phone: '01012345678',
    });
    expect(toastServiceSpy.success).toHaveBeenCalled();
  });
});
