import { AddressRepository } from '../repositories/address.repository';
import { CreateAddressInput, UpdateAddressInput, SafeAddress, IAddressDocument } from '../types/address.types';
export declare class AddressService {
    private readonly repo;
    constructor(repo?: AddressRepository);
    listAddresses(userId: string): Promise<SafeAddress[]>;
    getAddressById(userId: string, addressId: string): Promise<SafeAddress>;
    createAddress(userId: string, input: CreateAddressInput): Promise<SafeAddress>;
    updateAddress(userId: string, addressId: string, input: UpdateAddressInput): Promise<SafeAddress>;
    deleteAddress(userId: string, addressId: string): Promise<void>;
    setDefaultAddress(userId: string, addressId: string): Promise<SafeAddress>;
    /**
     * Internal boundary method for future checkout module to securely read an owned address.
     */
    getOwnedAddress(userId: string, addressId: string): Promise<IAddressDocument>;
}
export declare const addressService: AddressService;
