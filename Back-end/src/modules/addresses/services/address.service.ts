import { addressRepository, AddressRepository } from '../repositories/address.repository';
import {
  CreateAddressInput,
  UpdateAddressInput,
  SafeAddress,
  IAddressDocument,
  IAddress,
} from '../types/address.types';
import { toSafeAddress } from '../utils/address.projection';
import { NotFoundError } from '../../../common/errors';
import { canonicalizePhone, isValidPhone } from '../../users/utils/phone.util';
import { withTransaction } from '../../../database/transaction';
import { BadRequestError } from '../../../common/errors';

export class AddressService {
  constructor(private readonly repo: AddressRepository = addressRepository) {}

  async listAddresses(userId: string): Promise<SafeAddress[]> {
    const addresses = await this.repo.findAllByUserId(userId);
    return addresses.map(toSafeAddress);
  }

  async getAddressById(userId: string, addressId: string): Promise<SafeAddress> {
    const address = await this.repo.findByIdAndUserId(addressId, userId);
    if (!address) {
      throw new NotFoundError('Address not found');
    }
    return toSafeAddress(address);
  }

  async createAddress(userId: string, input: CreateAddressInput): Promise<SafeAddress> {
    const canonicalPhone = canonicalizePhone(input.recipientPhone);
    if (!isValidPhone(canonicalPhone)) {
      throw new BadRequestError('Invalid phone number format');
    }

    const normalizedData: CreateAddressInput = {
      label: input.label !== undefined && input.label !== null ? input.label.trim() : null,
      recipientName: input.recipientName.trim(),
      recipientPhone: canonicalPhone,
      governorate: input.governorate.trim(),
      city: input.city.trim(),
      area: input.area.trim(),
      street: input.street.trim(),
      buildingNumber: input.buildingNumber.trim(),
      floor: input.floor !== undefined && input.floor !== null ? input.floor.trim() : null,
      apartment: input.apartment !== undefined && input.apartment !== null ? input.apartment.trim() : null,
      landmark: input.landmark !== undefined && input.landmark !== null ? input.landmark.trim() : null,
      notes: input.notes !== undefined && input.notes !== null ? input.notes.trim() : null,
      isDefault: Boolean(input.isDefault),
    };

    if (normalizedData.isDefault) {
      return withTransaction(async (session) => {
        await this.repo.unsetOtherDefaults(userId, undefined, { session });
        const created = await this.repo.create(userId, normalizedData, { session });
        return toSafeAddress(created);
      });
    }

    const created = await this.repo.create(userId, normalizedData);
    return toSafeAddress(created);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput,
  ): Promise<SafeAddress> {
    const existing = await this.repo.findByIdAndUserId(addressId, userId);
    if (!existing) {
      throw new NotFoundError('Address not found');
    }

    const updateData: Partial<IAddress> = {};

    if (input.label !== undefined) {
      updateData.label = input.label !== null ? input.label.trim() : null;
    }
    if (input.recipientName !== undefined) {
      updateData.recipientName = input.recipientName.trim();
    }
    if (input.recipientPhone !== undefined) {
      const canonical = canonicalizePhone(input.recipientPhone);
      if (!isValidPhone(canonical)) {
        throw new BadRequestError('Invalid phone number format');
      }
      updateData.recipientPhone = canonical;
    }
    if (input.governorate !== undefined) {
      updateData.governorate = input.governorate.trim();
    }
    if (input.city !== undefined) {
      updateData.city = input.city.trim();
    }
    if (input.area !== undefined) {
      updateData.area = input.area.trim();
    }
    if (input.street !== undefined) {
      updateData.street = input.street.trim();
    }
    if (input.buildingNumber !== undefined) {
      updateData.buildingNumber = input.buildingNumber.trim();
    }
    if (input.floor !== undefined) {
      updateData.floor = input.floor !== null ? input.floor.trim() : null;
    }
    if (input.apartment !== undefined) {
      updateData.apartment = input.apartment !== null ? input.apartment.trim() : null;
    }
    if (input.landmark !== undefined) {
      updateData.landmark = input.landmark !== null ? input.landmark.trim() : null;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes !== null ? input.notes.trim() : null;
    }
    if (input.isDefault !== undefined) {
      updateData.isDefault = Boolean(input.isDefault);
    }

    if (updateData.isDefault === true) {
      return withTransaction(async (session) => {
        await this.repo.unsetOtherDefaults(userId, addressId, { session });
        const updated = await this.repo.updateByIdAndUserId(addressId, userId, updateData, {
          session,
        });
        if (!updated) {
          throw new NotFoundError('Address not found');
        }
        return toSafeAddress(updated);
      });
    }

    const updated = await this.repo.updateByIdAndUserId(addressId, userId, updateData);
    if (!updated) {
      throw new NotFoundError('Address not found');
    }
    return toSafeAddress(updated);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const existing = await this.repo.findByIdAndUserId(addressId, userId);
    if (!existing) {
      throw new NotFoundError('Address not found');
    }

    await this.repo.deleteByIdAndUserId(addressId, userId);
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<SafeAddress> {
    return this.updateAddress(userId, addressId, { isDefault: true });
  }

  /**
   * Internal boundary method for future checkout module to securely read an owned address.
   */
  async getOwnedAddress(userId: string, addressId: string): Promise<IAddressDocument> {
    const address = await this.repo.findByIdAndUserId(addressId, userId);
    if (!address) {
      throw new NotFoundError('Address not found');
    }
    return address;
  }
}

export const addressService = new AddressService();
