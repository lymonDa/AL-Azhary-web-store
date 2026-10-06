import { IProductDocument } from '../types/product.types';
export declare const ProductModel: import("mongoose").Model<IProductDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IProductDocument, {}, {}> & import("../types/product.types").IProduct & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
