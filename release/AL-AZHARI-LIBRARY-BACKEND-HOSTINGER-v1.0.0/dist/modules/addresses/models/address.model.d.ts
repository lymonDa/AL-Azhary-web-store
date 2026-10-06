import { IAddressDocument } from '../types/address.types';
export declare const AddressModel: import("mongoose").Model<IAddressDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IAddressDocument, {}, {}> & import("../types/address.types").IAddress & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
