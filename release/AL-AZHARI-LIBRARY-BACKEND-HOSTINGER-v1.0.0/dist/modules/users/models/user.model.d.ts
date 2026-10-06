import { IUserDocument } from '../types/user.types';
export declare const UserModel: import("mongoose").Model<IUserDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IUserDocument, {}, {}> & import("../types/user.types").IUser & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
