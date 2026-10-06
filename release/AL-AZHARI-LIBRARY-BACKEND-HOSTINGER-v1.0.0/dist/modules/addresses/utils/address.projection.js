"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSafeAddress = toSafeAddress;
exports.toAddressSnapshot = toAddressSnapshot;
/**
 * Projects an address document or object into a safe, client-facing address representation.
 * Excludes internal MongoDB metadata and maps primary identifier to `id`.
 */
function toSafeAddress(address) {
    const record = address;
    const rawId = record._id ?? record.id;
    const id = typeof rawId === 'object' && rawId !== null ? rawId.toString() : String(rawId);
    return {
        id,
        label: record.label ?? null,
        recipientName: String(record.recipientName ?? ''),
        recipientPhone: String(record.recipientPhone ?? ''),
        governorate: String(record.governorate ?? ''),
        city: String(record.city ?? ''),
        area: String(record.area ?? ''),
        street: String(record.street ?? ''),
        buildingNumber: String(record.buildingNumber ?? ''),
        floor: record.floor ?? null,
        apartment: record.apartment ?? null,
        landmark: record.landmark ?? null,
        notes: record.notes ?? null,
        isDefault: Boolean(record.isDefault),
        createdAt: record.createdAt ?? new Date(),
        updatedAt: record.updatedAt ?? new Date(),
    };
}
/**
 * Pure utility that converts an address into an immutable fulfillment snapshot for future orders.
 * Pure, deterministic, and side-effect free. Does not create orders or touch MongoDB.
 */
function toAddressSnapshot(address) {
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
//# sourceMappingURL=address.projection.js.map