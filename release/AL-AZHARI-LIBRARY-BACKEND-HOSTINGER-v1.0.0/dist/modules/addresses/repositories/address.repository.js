"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressRepository = exports.AddressRepository = void 0;
const mongoose_1 = require("mongoose");
const address_model_1 = require("../models/address.model");
class AddressRepository {
    async create(userId, data, options) {
        const address = new address_model_1.AddressModel({
            userId: new mongoose_1.Types.ObjectId(userId),
            label: data.label ?? null,
            recipientName: data.recipientName,
            recipientPhone: data.recipientPhone,
            governorate: data.governorate,
            city: data.city,
            area: data.area,
            street: data.street,
            buildingNumber: data.buildingNumber,
            floor: data.floor ?? null,
            apartment: data.apartment ?? null,
            landmark: data.landmark ?? null,
            notes: data.notes ?? null,
            isDefault: Boolean(data.isDefault),
        });
        return address.save({ session: options?.session });
    }
    async findAllByUserId(userId, options) {
        return address_model_1.AddressModel.find({ userId: new mongoose_1.Types.ObjectId(userId) })
            .sort({ isDefault: -1, createdAt: -1 })
            .session(options?.session || null)
            .exec();
    }
    async findByIdAndUserId(id, userId, options) {
        return address_model_1.AddressModel.findOne({
            _id: new mongoose_1.Types.ObjectId(id),
            userId: new mongoose_1.Types.ObjectId(userId),
        })
            .session(options?.session || null)
            .exec();
    }
    async updateByIdAndUserId(id, userId, updateData, options) {
        return address_model_1.AddressModel.findOneAndUpdate({
            _id: new mongoose_1.Types.ObjectId(id),
            userId: new mongoose_1.Types.ObjectId(userId),
        }, { $set: updateData }, { new: true, runValidators: true, session: options?.session }).exec();
    }
    async deleteByIdAndUserId(id, userId, options) {
        const result = await address_model_1.AddressModel.deleteOne({
            _id: new mongoose_1.Types.ObjectId(id),
            userId: new mongoose_1.Types.ObjectId(userId),
        }, { session: options?.session }).exec();
        return result.deletedCount > 0;
    }
    async unsetOtherDefaults(userId, exceptAddressId, options) {
        const filter = {
            userId: new mongoose_1.Types.ObjectId(userId),
            isDefault: true,
        };
        if (exceptAddressId) {
            filter._id = { $ne: new mongoose_1.Types.ObjectId(exceptAddressId) };
        }
        await address_model_1.AddressModel.updateMany(filter, { $set: { isDefault: false } }, { session: options?.session }).exec();
    }
    async countByUserId(userId, options) {
        return address_model_1.AddressModel.countDocuments({
            userId: new mongoose_1.Types.ObjectId(userId),
        })
            .session(options?.session || null)
            .exec();
    }
}
exports.AddressRepository = AddressRepository;
exports.addressRepository = new AddressRepository();
//# sourceMappingURL=address.repository.js.map