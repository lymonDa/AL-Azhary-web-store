import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AccountStore } from './account.store';
import { CustomerApi } from '../api/account/customer-api.service';
import { OrdersApi } from '../api/commerce/orders-api.service';
import { PreordersApi } from '../api/commerce/preorders-api.service';
import { ReturnsApi } from '../api/commerce/returns-api.service';
import type { UserProfileDto } from '../api/dto/customer.dto';
import type { AddressDto, SafeOrderResponseDto } from '../api/dto/checkout.dto';
import type { SafePreorderDto } from '../api/dto/preorder.dto';
import type { SafeReturnRequestDto } from '../api/dto/returns.dto';

describe('AccountStore', () => {
  let store: AccountStore;
  let customerApiSpy: jasmine.SpyObj<CustomerApi>;
  let ordersApiSpy: jasmine.SpyObj<OrdersApi>;
  let preordersApiSpy: jasmine.SpyObj<PreordersApi>;
  let returnsApiSpy: jasmine.SpyObj<ReturnsApi>;

  const mockUserDto: UserProfileDto = {
    id: 'user-1',
    name: 'أحمد محمود',
    email: 'customer@example.com',
    phone: '01012345678',
    role: 'customer',
    status: 'active',
    emailVerifiedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockAddressDto: AddressDto = {
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

  const mockOrderDto: SafeOrderResponseDto = {
    reference: 'ORD-20261010-ABCD',
    customerId: 'cust-1',
    customerSnapshot: { name: 'أحمد', phone: '01012345678', email: null },
    items: [
      {
        productId: 'prod-1',
        variantId: null,
        nameSnapshot: { ar: 'مقدمة ابن خلدون' },
        imageSnapshot: null,
        categorySnapshot: null,
        attributesSnapshot: {},
        quantity: 1,
        unitPriceMinor: 10000,
        lineTotalMinor: 10000,
        availabilityAtSubmission: 'in_stock',
        stockItemKey: 'stock-1',
      },
    ],
    totals: {
      productSubtotalMinor: 10000,
      shippingEstimateMinor: 4000,
      shippingFinalMinor: null,
      discountMinor: 0,
      totalMinor: 14000,
      currency: 'EGP',
    },
    fulfillment: {
      method: 'delivery',
      addressSnapshot: null,
      shippingStatus: 'not_shipped',
      provider: null,
    },
    paymentMethodKey: 'cash_on_delivery',
    status: 'pending_review',
    paymentStatus: 'pending',
    couponSnapshot: null,
    submittedAt: '2026-10-10T09:00:00Z',
    acceptedAt: null,
    completedAt: null,
    cancelledAt: null,
    version: 1,
  };

  const mockPreorderDto: SafePreorderDto = {
    reference: 'PRE-001',
    customerId: 'cust-1',
    customerSnapshot: { name: 'أحمد', phone: '01012345678', email: null },
    productId: 'prod-1',
    variantId: null,
    productSnapshot: {
      name: { ar: 'مقدمة ابن خلدون', en: 'Muqaddimah' },
      slug: 'muqaddimah',
    },
    quantity: 1,
    capturedPriceMinor: 15000,
    currency: 'EGP',
    status: 'pending',
    version: 1,
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  };

  const mockReturnDto: SafeReturnRequestDto = {
    reference: 'RET-001',
    orderReference: 'ORD-20261010-ABCD',
    status: 'requested',
    customerNote: 'تلف في الغلاف',
    items: [],
    totalRefundAmountMinor: 10000,
    currency: 'EGP',
    version: 1,
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  };

  beforeEach(() => {
    customerApiSpy = jasmine.createSpyObj<CustomerApi>('CustomerApi', [
      'getProfile',
      'updateProfile',
      'getAddresses',
      'createAddress',
      'updateAddress',
      'deleteAddress',
      'setDefaultAddress',
    ]);
    ordersApiSpy = jasmine.createSpyObj<OrdersApi>('OrdersApi', [
      'getCustomerOrders',
      'getOrder',
    ]);
    preordersApiSpy = jasmine.createSpyObj<PreordersApi>('PreordersApi', [
      'getPreorders',
      'cancelPreorder',
    ]);
    returnsApiSpy = jasmine.createSpyObj<ReturnsApi>('ReturnsApi', [
      'getReturns',
    ]);

    customerApiSpy.getProfile.and.returnValue(of(mockUserDto));
    customerApiSpy.getAddresses.and.returnValue(of([mockAddressDto]));
    ordersApiSpy.getCustomerOrders.and.returnValue(of({
      items: [mockOrderDto],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }));
    preordersApiSpy.getPreorders.and.returnValue(of({
      preorders: [mockPreorderDto],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    }));
    returnsApiSpy.getReturns.and.returnValue(of({
      returns: [mockReturnDto],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    }));

    TestBed.configureTestingModule({
      providers: [
        AccountStore,
        { provide: CustomerApi, useValue: customerApiSpy },
        { provide: OrdersApi, useValue: ordersApiSpy },
        { provide: PreordersApi, useValue: preordersApiSpy },
        { provide: ReturnsApi, useValue: returnsApiSpy },
      ],
    });

    store = TestBed.inject(AccountStore);
  });

  it('should load profile successfully', (done) => {
    store.loadProfile().subscribe({
      next: (profile) => {
        expect(profile).not.toBeNull();
        expect(profile.name).toBe('أحمد محمود');
        expect(store.profile()?.name).toBe('أحمد محمود');
        expect(store.isLoadingProfile()).toBe(false);
        done();
      },
    });
  });

  it('should update profile and refresh state', (done) => {
    customerApiSpy.updateProfile.and.returnValue(of({
      ...mockUserDto,
      name: 'أحمد المحدث',
    }));

    store.updateProfile({ name: 'أحمد المحدث' }).subscribe({
      next: (profile) => {
        expect(profile.name).toBe('أحمد المحدث');
        expect(store.profile()?.name).toBe('أحمد المحدث');
        expect(store.isLoadingProfile()).toBe(false);
        done();
      },
    });
  });

  it('should load addresses successfully', (done) => {
    store.loadAddresses().subscribe({
      next: (addresses) => {
        expect(addresses.length).toBe(1);
        expect(addresses[0]?.label).toBe('المنزل');
        expect(store.addresses().length).toBe(1);
        done();
      },
    });
  });

  it('should create address and update address list', (done) => {
    const newAddr: AddressDto = { ...mockAddressDto, id: 'addr-2', label: 'العمل', isDefault: false };
    customerApiSpy.createAddress.and.returnValue(of(newAddr));

    store.createAddress({
      recipientName: 'أحمد',
      recipientPhone: '01012345678',
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      area: 'الحي السابع',
      street: 'شارع عباس العقاد',
      buildingNumber: '5',
    }).subscribe({
      next: (created) => {
        expect(created.id).toBe('addr-2');
        expect(store.addresses().length).toBe(1);
        done();
      },
    });
  });

  it('should delete address and remove from address list', (done) => {
    customerApiSpy.deleteAddress.and.returnValue(of(undefined));

    store.loadAddresses().subscribe(() => {
      store.deleteAddress('addr-1').subscribe({
        next: () => {
          expect(store.addresses().length).toBe(0);
          done();
        },
      });
    });
  });

  it('should load customer orders', () => {
    store.loadOrders();
    expect(store.orders().length).toBe(1);
    expect(store.orders()[0]?.reference).toBe('ORD-20261010-ABCD');
    expect(store.isLoadingOrders()).toBe(false);
  });

  it('should load customer pre-orders', () => {
    store.loadPreorders();
    expect(store.preorders().length).toBe(1);
    expect(store.preorders()[0]?.reference).toBe('PRE-001');
    expect(store.isLoadingPreorders()).toBe(false);
  });

  it('should load customer returns', () => {
    store.loadReturns();
    expect(store.returns().length).toBe(1);
    expect(store.returns()[0]?.reference).toBe('RET-001');
    expect(store.isLoadingReturns()).toBe(false);
  });
});
