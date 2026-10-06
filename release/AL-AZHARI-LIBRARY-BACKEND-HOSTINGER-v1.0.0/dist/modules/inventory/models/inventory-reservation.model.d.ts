import { Schema } from 'mongoose';
import { IInventoryReservationDocument } from '../types/inventory.types';
export declare const inventoryReservationSchema: Schema<IInventoryReservationDocument, import("mongoose").Model<IInventoryReservationDocument, any, any, any, import("mongoose").Document<unknown, any, IInventoryReservationDocument, any, {}> & import("../types/inventory.types").IInventoryReservation & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IInventoryReservationDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IInventoryReservationDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IInventoryReservationDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const InventoryReservationModel: import("mongoose").Model<IInventoryReservationDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IInventoryReservationDocument, {}, {}> & import("../types/inventory.types").IInventoryReservation & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
