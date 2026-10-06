import { ICartDocument } from '../types/cart.types';
export declare const CartModel: import("mongoose").Model<ICartDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ICartDocument, {}, {}> & import("../types/cart.types").ICart & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
