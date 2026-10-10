import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AccountPreOrdersComponent } from './pre-orders.component';
import { AccountStore } from '../../../core/account/account.store';
import { PreordersApi } from '../../../core/api/commerce/preorders-api.service';
import { LocaleService } from '../../../core/i18n/locale.service';
import { ToastService } from '../../../shared/overlay/toast/toast.service';
import { createMoney } from '../../../domain/models/money.model';
import type { CustomerPreorder } from '../../../domain/models/preorder.model';
import type { SafePreorderDto } from '../../../core/api/dto/preorder.dto';

describe('AccountPreOrdersComponent', () => {
  let component: AccountPreOrdersComponent;
  let fixture: ComponentFixture<AccountPreOrdersComponent>;
  let accountStoreSpy: jasmine.SpyObj<AccountStore>;
  let preordersApiSpy: jasmine.SpyObj<PreordersApi>;
  let localeServiceSpy: jasmine.SpyObj<LocaleService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockPreorder: CustomerPreorder = {
    reference: 'PRE-20261010-001',
    customerId: 'cust-1',
    customerSnapshot: {
      name: 'أحمد محمود',
      phone: '01012345678',
      email: null,
    },
    productId: 'prod-1',
    variantId: null,
    productSnapshot: {
      name: { ar: 'مقدمة ابن خلدون', en: 'Muqaddimah' },
      slug: 'muqaddimah',
    },
    quantity: 1,
    price: createMoney(15000),
    status: 'pending',
    version: 1,
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  };

  const mockPreorderDto: SafePreorderDto = {
    reference: 'PRE-20261010-001',
    customerId: 'cust-1',
    customerSnapshot: {
      name: 'أحمد محمود',
      phone: '01012345678',
      email: null,
    },
    productId: 'prod-1',
    variantId: null,
    productSnapshot: {
      name: { ar: 'مقدمة ابن خلدون', en: 'Muqaddimah' },
      slug: 'muqaddimah',
    },
    quantity: 1,
    capturedPriceMinor: 15000,
    currency: 'EGP',
    status: 'cancelled',
    version: 2,
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  };

  beforeEach(async () => {
    accountStoreSpy = jasmine.createSpyObj<AccountStore>('AccountStore', [
      'loadPreorders',
    ], {
      preorders: signal([mockPreorder]),
      isLoadingPreorders: signal(false),
    });

    preordersApiSpy = jasmine.createSpyObj<PreordersApi>('PreordersApi', [
      'cancelPreorder',
    ]);

    localeServiceSpy = jasmine.createSpyObj<LocaleService>('LocaleService', [], {
      isArabic: signal(true),
      direction: signal('rtl'),
      currentLocale: signal('ar'),
    });

    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'info', 'warning', 'show']);

    await TestBed.configureTestingModule({
      imports: [AccountPreOrdersComponent],
      providers: [
        provideRouter([]),
        { provide: AccountStore, useValue: accountStoreSpy },
        { provide: PreordersApi, useValue: preordersApiSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountPreOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render pre-orders list', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('PRE-20261010-001');
    expect(fixture.nativeElement.textContent).toContain('مقدمة ابن خلدون');
  });

  it('should open cancel confirmation modal and cancel preorder', () => {
    component.openCancelModal(mockPreorder);
    expect(component.preorderToCancel()).toEqual(mockPreorder);

    preordersApiSpy.cancelPreorder.and.returnValue(of({ preorder: mockPreorderDto }));

    component.confirmCancel('PRE-20261010-001');
    expect(preordersApiSpy.cancelPreorder).toHaveBeenCalledWith('PRE-20261010-001');
    expect(component.preorderToCancel()).toBeNull();
  });
});
