import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AddressesComponent } from './addresses.component';
import { AccountStore } from '../../../core/account/account.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { ToastService } from '../../../shared/overlay/toast/toast.service';
import type { CustomerAddress } from '../../../domain/models/customer.model';

describe('AddressesComponent', () => {
  let component: AddressesComponent;
  let fixture: ComponentFixture<AddressesComponent>;
  let accountStoreSpy: jasmine.SpyObj<AccountStore>;
  let localeServiceSpy: jasmine.SpyObj<LocaleService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockAddress: CustomerAddress = {
    id: 'addr-1',
    label: 'المنزل',
    recipientName: 'أحمد',
    recipientPhone: '01012345678',
    governorate: 'القاهرة',
    city: 'مدينة نصر',
    area: 'الحي السابع',
    street: 'شارع الطيران',
    buildingNumber: '10',
    floor: '3',
    apartment: '12',
    landmark: 'بجوار المسجد',
    isDefault: true,
  };

  beforeEach(async () => {
    accountStoreSpy = jasmine.createSpyObj<AccountStore>('AccountStore', [
      'loadAddresses',
      'createAddress',
      'updateAddress',
      'deleteAddress',
      'setDefaultAddress',
    ], {
      addresses: signal([mockAddress]),
      isLoadingAddresses: signal(false),
    });
    accountStoreSpy.loadAddresses.and.returnValue(of([mockAddress]));

    localeServiceSpy = jasmine.createSpyObj<LocaleService>('LocaleService', [], {
      isArabic: signal(true),
      direction: signal('rtl'),
      currentLocale: signal('ar'),
    });

    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'info', 'warning', 'show']);

    await TestBed.configureTestingModule({
      imports: [AddressesComponent],
      providers: [
        { provide: AccountStore, useValue: accountStoreSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render address list', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('المنزل');
    expect(fixture.nativeElement.textContent).toContain('شارع الطيران');
  });

  it('should open modal for new address', () => {
    component.openAddModal();
    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(false);
  });

  it('should open modal for editing address with populated values', () => {
    component.openEditModal(mockAddress);
    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(true);
    expect(component.form.get('recipientName')?.value).toBe('أحمد');
    expect(component.form.get('street')?.value).toBe('شارع الطيران');
  });

  it('should trigger delete confirmation modal and delete', () => {
    component.openDeleteConfirm(mockAddress);
    expect(component.addressToDelete()).toEqual(mockAddress);

    accountStoreSpy.deleteAddress.and.returnValue(of(undefined));
    component.confirmDelete('addr-1');

    expect(accountStoreSpy.deleteAddress).toHaveBeenCalledWith('addr-1');
    expect(component.addressToDelete()).toBeNull();
  });

  it('should set address as default', () => {
    accountStoreSpy.setDefaultAddress.and.returnValue(of(mockAddress));
    component.onSetDefault(mockAddress);
    expect(accountStoreSpy.setDefaultAddress).toHaveBeenCalledWith('addr-1');
  });
});
