import { ICategoryDocument } from '../types/category.types';
export declare const CategoryModel: import("mongoose").Model<ICategoryDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ICategoryDocument, {}, {}> & import("../types/category.types").ICategory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
