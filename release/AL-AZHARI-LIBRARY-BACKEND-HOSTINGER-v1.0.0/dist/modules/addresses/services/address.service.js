"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressService = exports.AddressService = void 0;
const address_repository_1 = require("../repositories/address.repository");
const address_projection_1 = require("../utils/address.projection");
const errors_1 = require("../../../common/errors");
const phone_util_1 = require("../../users/utils/phone.util");
const transaction_1 = require("../../../database/transaction");
const errors_2 = require("../../../common/errors");
class AddressService {
    repo;
    constructor(repo = address_repository_1.addressRepository) {
        this.repo = repo;
    }
    async listAddresses(userId) {
        const addresses = await this.repo.findAllByUserId(userId);
        return addresses.map(address_projection_1.toSafeAddress);
    }
    async getAddressById(userId, addressId) {
        const address = await this.repo.findByIdAndUserId(addressId, userId);
        if (!address) {
            throw new errors_1.NotFoundError('Address not found');
        }
        return (0, address_projection_1.toSafeAddress)(address);
    }
    async createAddress(userId, input) {
        const canonicalPhone = (0, phone_util_1.canonicalizePhone)(input.recipientPhone);
        if (!(0, phone_util_1.isValidPhone)(canonicalPhone)) {
            throw new errors_2.BadRequestError('Invalid phone number format');
        }
        const normalizedData = {
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
            return (0, transaction_1.withTransaction)(async (session) => {
                await this.repo.unsetOtherDefaults(userId, undefined, { session });
                const created = await this.repo.create(userId, normalizedData, { session });
                return (0, address_projection_1.toSafeAddress)(created);
            });
        }
        const created = await this.repo.create(userId, normalizedData);
        return (0, address_projection_1.toSafeAddress)(created);
    }
    async updateAddress(userId, addressId, input) {
        const existing = await this.repo.findByIdAndUserId(addressId, userId);
        if (!existing) {
            throw new errors_1.NotFoundError('Address not found');
        }
        const updateData = {};
        if (input.label !== undefined) {
            updateData.label = input.label !== null ? input.label.trim() : null;
        }
        if (input.recipientName !== undefined) {
            updateData.recipientName = input.recipientName.trim();
        }
        if (input.recipientPhone !== undefined) {
            const canonical = (0, phone_util_1.canonicalizePhone)(input.recipientPhone);
            if (!(0, phone_util_1.isValidPhone)(canonical)) {
                throw new errors_2.BadRequestError('Invalid phone number format');
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
            return (0, transaction_1.withTransaction)(async (session) => {
                await this.repo.unsetOtherDefaults(userId, addressId, { session });
                const updated = await this.repo.updateByIdAndUserId(addressId, userId, updateData, {
                    session,
                });
                if (!updated) {
                    throw new errors_1.NotFoundError('Address not found');
                }
                return (0, address_projection_1.toSafeAddress)(updated);
            });
        }
        const updated = await this.repo.updateByIdAndUserId(addressId, userId, updateData);
        if (!updated) {
            throw new errors_1.NotFoundError('Address not found');
        }
        return (0, address_projection_1.toSafeAddress)(updated);
    }
    async deleteAddress(userId, addressId) {
        const existing = await this.repo.findByIdAndUserId(addressId, userId);
        if (!existing) {
            throw new errors_1.NotFoundError('Address not found');
        }
        await this.repo.deleteByIdAndUserId(addressId, userId);
    }
    async setDefaultAddress(userId, addressId) {
        return this.updateAddress(userId, addressId, { isDefault: true });
    }
    /**
     * Internal boundary method for future checkout module to securely read an owned address.
     */
    async getOwnedAddress(userId, addressId) {
        const address = await this.repo.findByIdAndUserId(addressId, userId);
        if (!address) {
            throw new errors_1.NotFoundError('Address not found');
        }
        return address;
    }
}
exports.AddressService = AddressService;
exports.addressService = new AddressService();
//# sourceMappingURL=address.service.js.map