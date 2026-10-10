import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CustomerApi } from './customer-api.service';
import { ApiClient } from '../base/api-client';
import type {
  UserProfileDto,
  UpdateProfileRequestDto,
  CreateAddressRequestDto,
  UpdateAddressRequestDto,
} from '../dto/customer.dto';
import type { AddressDto } from '../dto/checkout.dto';

describe('CustomerApi', () => {
  let service: CustomerApi;
  let apiClientSpy: jasmine.SpyObj<ApiClient>;

  const mockProfile: UserProfileDto = {
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

  const mockAddress: AddressDto = {
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

  beforeEach(() => {
    apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', [
      'getData',
      'patchData',
      'postData',
      'deleteData',
    ]);

    TestBed.configureTestingModule({
      providers: [
        CustomerApi,
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    });

    service = TestBed.inject(CustomerApi);
  });

  it('should fetch user profile from GET /me', (done) => {
    apiClientSpy.getData.and.returnValue(of(mockProfile));

    service.getProfile().subscribe((res) => {
      expect(res).toEqual(mockProfile);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/me');
      done();
    });
  });

  it('should update user profile via PATCH /me', (done) => {
    const updateReq: UpdateProfileRequestDto = { name: 'أحمد جديد', phone: '01123456789' };
    apiClientSpy.patchData.and.returnValue(of({ ...mockProfile, ...updateReq }));

    service.updateProfile(updateReq).subscribe((res) => {
      expect(res.name).toBe('أحمد جديد');
      expect(apiClientSpy.patchData).toHaveBeenCalledWith('/me', updateReq);
      done();
    });
  });

  it('should fetch address list from GET /addresses', (done) => {
    apiClientSpy.getData.and.returnValue(of([mockAddress]));

    service.getAddresses().subscribe((res) => {
      expect(res).toEqual([mockAddress]);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/addresses');
      done();
    });
  });

  it('should fetch single address from GET /addresses/:id', (done) => {
    apiClientSpy.getData.and.returnValue(of(mockAddress));

    service.getAddress('addr-1').subscribe((res) => {
      expect(res).toEqual(mockAddress);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/addresses/addr-1');
      done();
    });
  });

  it('should create address via POST /addresses', (done) => {
    const createReq: CreateAddressRequestDto = {
      recipientName: 'أحمد',
      recipientPhone: '01012345678',
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      area: 'الحي السابع',
      street: 'شارع الطيران',
      buildingNumber: '10',
    };
    apiClientSpy.postData.and.returnValue(of(mockAddress));

    service.createAddress(createReq).subscribe((res) => {
      expect(res).toEqual(mockAddress);
      expect(apiClientSpy.postData).toHaveBeenCalledWith('/addresses', createReq);
      done();
    });
  });

  it('should update address via PATCH /addresses/:id', (done) => {
    const updateReq: UpdateAddressRequestDto = { floor: '4' };
    apiClientSpy.patchData.and.returnValue(of({ ...mockAddress, floor: '4' }));

    service.updateAddress('addr-1', updateReq).subscribe((res) => {
      expect(res.floor).toBe('4');
      expect(apiClientSpy.patchData).toHaveBeenCalledWith('/addresses/addr-1', updateReq);
      done();
    });
  });

  it('should delete address via DELETE /addresses/:id', (done) => {
    apiClientSpy.deleteData.and.returnValue(of(undefined));

    service.deleteAddress('addr-1').subscribe(() => {
      expect(apiClientSpy.deleteData).toHaveBeenCalledWith('/addresses/addr-1');
      done();
    });
  });

  it('should set default address via PATCH /addresses/:id', (done) => {
    apiClientSpy.patchData.and.returnValue(of(mockAddress));

    service.setDefaultAddress('addr-1').subscribe((res) => {
      expect(res.isDefault).toBe(true);
      expect(apiClientSpy.patchData).toHaveBeenCalledWith('/addresses/addr-1', { isDefault: true });
      done();
    });
  });
});
