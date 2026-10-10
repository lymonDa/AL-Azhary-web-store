import type { AddressDto } from '../dto/checkout.dto';
import type { UserProfileDto } from '../dto/customer.dto';
import type { CustomerAddress, CustomerProfile } from '../../../domain/models/customer.model';

export function mapUserProfile(dto: UserProfileDto): CustomerProfile {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    role: dto.role,
    status: dto.status,
    emailVerifiedAt: dto.emailVerifiedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapCustomerAddress(dto: AddressDto): CustomerAddress {
  return {
    id: dto.id,
    label: dto.label ?? null,
    recipientName: dto.recipientName,
    recipientPhone: dto.recipientPhone,
    governorate: dto.governorate,
    city: dto.city,
    area: dto.area,
    street: dto.street,
    buildingNumber: dto.buildingNumber,
    floor: dto.floor ?? null,
    apartment: dto.apartment ?? null,
    landmark: dto.landmark ?? null,
    notes: dto.notes ?? null,
    isDefault: dto.isDefault,
  };
}
