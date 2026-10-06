import { Schema } from 'mongoose';
import { IInventoryTransactionDocument } from '../types/inventory.types';
export declare const inventoryTransactionSchema: Schema<IInventoryTransactionDocument, import("mongoose").Model<IInventoryTransactionDocument, any, any, any, import("mongoose").Document<unknown, any, IInventoryTransactionDocument, any, {}> & import("../types/inventory.types").IInventoryTransaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IInventoryTransactionDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IInventoryTransactionDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IInventoryTransactionDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const InventoryTransactionModel: import("mongoose").Model<IInventoryTransactionDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IInventoryTransactionDocument, {}, {}> & import("../types/inventory.types").IInventoryTransaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
