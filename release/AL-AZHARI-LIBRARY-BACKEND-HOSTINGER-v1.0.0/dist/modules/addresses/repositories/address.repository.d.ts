import { ClientSession, Types } from 'mongoose';
import { IAddressDocument, CreateAddressInput, IAddress } from '../types/address.types';
export declare class AddressRepository {
    create(userId: string | Types.ObjectId, data: CreateAddressInput, options?: {
        session?: ClientSession;
    }): Promise<IAddressDocument>;
    findAllByUserId(userId: string | Types.ObjectId, options?: {
        session?: ClientSession;
    }): Promise<IAddressDocument[]>;
    findByIdAndUserId(id: string, userId: string | Types.ObjectId, options?: {
        session?: ClientSession;
    }): Promise<IAddressDocument | null>;
    updateByIdAndUserId(id: string, userId: string | Types.ObjectId, updateData: Partial<IAddress>, options?: {
        session?: ClientSession;
    }): Promise<IAddressDocument | null>;
    deleteByIdAndUserId(id: string, userId: string | Types.ObjectId, options?: {
        session?: ClientSession;
    }): Promise<boolean>;
    unsetOtherDefaults(userId: string | Types.ObjectId, exceptAddressId?: string | Types.ObjectId, options?: {
        session?: ClientSession;
    }): Promise<void>;
    countByUserId(userId: string | Types.ObjectId, options?: {
        session?: ClientSession;
    }): Promise<number>;
}
export declare const addressRepository: AddressRepository;
