import { IAddressDocument, IAddress, SafeAddress, AddressSnapshot } from '../types/address.types';

/**
 * Projects an address document or object into a safe, client-facing address representation.
 * Excludes internal MongoDB metadata and maps primary identifier to `id`.
 */
export function toSafeAddress(
  address: IAddressDocument | IAddress | Record<string, unknown>,
): SafeAddress {
  const record = address as unknown as Record<string, unknown>;
  const rawId = record._id ?? record.id;
  const id = typeof rawId === 'object' && rawId !== null ? rawId.toString() : String(rawId);

  return {
    id,
    label: (record.label as string) ?? null,
    recipientName: String(record.recipientName ?? ''),
    recipientPhone: String(record.recipientPhone ?? ''),
    governorate: String(record.governorate ?? ''),
    city: String(record.city ?? ''),
    area: String(record.area ?? ''),
    street: String(record.street ?? ''),
    buildingNumber: String(record.buildingNumber ?? ''),
    floor: (record.floor as string) ?? null,
    apartment: (record.apartment as string) ?? null,
    landmark: (record.landmark as string) ?? null,
    notes: (record.notes as string) ?? null,
    isDefault: Boolean(record.isDefault),
    createdAt: (record.createdAt as Date) ?? new Date(),
    updatedAt: (record.updatedAt as Date) ?? new Date(),
  };
}

/**
 * Pure utility that converts an address into an immutable fulfillment snapshot for future orders.
 * Pure, deterministic, and side-effect free. Does not create orders or touch MongoDB.
 */
export function toAddressSnapshot(
  address: IAddressDocument | IAddress | SafeAddress,
): AddressSnapshot {
  return {
    governorate: address.governorate,
    city: address.city,
    area: address.area,
    street: address.street,
    buildingNumber: address.buildingNumber,
    floor: address.floor ?? null,
    apartment: address.apartment ?? null,
    landmark: address.landmark ?? null,
    recipientName: address.recipientName,
    recipientPhone: address.recipientPhone,
    notes: address.notes ?? null,
  };
}
