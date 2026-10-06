import { IAddressDocument, IAddress, SafeAddress, AddressSnapshot } from '../types/address.types';
/**
 * Projects an address document or object into a safe, client-facing address representation.
 * Excludes internal MongoDB metadata and maps primary identifier to `id`.
 */
export declare function toSafeAddress(address: IAddressDocument | IAddress | Record<string, unknown>): SafeAddress;
/**
 * Pure utility that converts an address into an immutable fulfillment snapshot for future orders.
 * Pure, deterministic, and side-effect free. Does not create orders or touch MongoDB.
 */
export declare function toAddressSnapshot(address: IAddressDocument | IAddress | SafeAddress): AddressSnapshot;
