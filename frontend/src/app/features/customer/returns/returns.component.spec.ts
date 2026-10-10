import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AccountReturnsComponent } from './returns.component';
import { AccountStore } from '../../../core/account/account.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { createMoney } from '../../../domain/models/money.model';
import type { CustomerReturnRequest } from '../../../domain/models/return.model';

describe('AccountReturnsComponent', () => {
  let component: AccountReturnsComponent;
  let fixture: ComponentFixture<AccountReturnsComponent>;
  let accountStoreSpy: jasmine.SpyObj<AccountStore>;
  let localeServiceSpy: jasmine.SpyObj<LocaleService>;

  const mockReturn: CustomerReturnRequest = {
    reference: 'RET-20261010-001',
    orderReference: 'ORD-20261010-ABCD',
    items: [],
    status: 'requested',
    customerNote: 'تلف في الغلاف',
    totalRefundAmount: createMoney(10000),
    version: 1,
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  };

  beforeEach(async () => {
    accountStoreSpy = jasmine.createSpyObj<AccountStore>('AccountStore', [
      'loadReturns',
    ], {
      returns: signal([mockReturn]),
      isLoadingReturns: signal(false),
    });

    localeServiceSpy = jasmine.createSpyObj<LocaleService>('LocaleService', [], {
      isArabic: signal(true),
      direction: signal('rtl'),
      currentLocale: signal('ar'),
    });

    await TestBed.configureTestingModule({
      imports: [AccountReturnsComponent],
      providers: [
        provideRouter([]),
        { provide: AccountStore, useValue: accountStoreSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountReturnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render returns list', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('RET-20261010-001');
    expect(fixture.nativeElement.textContent).toContain('ORD-20261010-ABCD');
  });
});
