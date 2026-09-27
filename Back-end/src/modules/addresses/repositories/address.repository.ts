import { ClientSession, Types } from 'mongoose';
import { AddressModel } from '../models/address.model';
import { IAddressDocument, CreateAddressInput, IAddress } from '../types/address.types';

export class AddressRepository {
  async create(
    userId: string | Types.ObjectId,
    data: CreateAddressInput,
    options?: { session?: ClientSession },
  ): Promise<IAddressDocument> {
    const address = new AddressModel({
      userId: new Types.ObjectId(userId),
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

  async findAllByUserId(
    userId: string | Types.ObjectId,
    options?: { session?: ClientSession },
  ): Promise<IAddressDocument[]> {
    return AddressModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .session(options?.session || null)
      .exec();
  }

  async findByIdAndUserId(
    id: string,
    userId: string | Types.ObjectId,
    options?: { session?: ClientSession },
  ): Promise<IAddressDocument | null> {
    return AddressModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    })
      .session(options?.session || null)
      .exec();
  }

  async updateByIdAndUserId(
    id: string,
    userId: string | Types.ObjectId,
    updateData: Partial<IAddress>,
    options?: { session?: ClientSession },
  ): Promise<IAddressDocument | null> {
    return AddressModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      },
      { $set: updateData },
      { new: true, runValidators: true, session: options?.session },
    ).exec();
  }

  async deleteByIdAndUserId(
    id: string,
    userId: string | Types.ObjectId,
    options?: { session?: ClientSession },
  ): Promise<boolean> {
    const result = await AddressModel.deleteOne(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      },
      { session: options?.session },
    ).exec();

    return result.deletedCount > 0;
  }

  async unsetOtherDefaults(
    userId: string | Types.ObjectId,
    exceptAddressId?: string | Types.ObjectId,
    options?: { session?: ClientSession },
  ): Promise<void> {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      isDefault: true,
    };

    if (exceptAddressId) {
      filter._id = { $ne: new Types.ObjectId(exceptAddressId) };
    }

    await AddressModel.updateMany(
      filter,
      { $set: { isDefault: false } },
      { session: options?.session },
    ).exec();
  }

  async countByUserId(
    userId: string | Types.ObjectId,
    options?: { session?: ClientSession },
  ): Promise<number> {
    return AddressModel.countDocuments({
      userId: new Types.ObjectId(userId),
    })
      .session(options?.session || null)
      .exec();
  }
}

export const addressRepository = new AddressRepository();
