import { IAuthTokenDocument } from '../types/auth.types';
export declare const AuthTokenModel: import("mongoose").Model<IAuthTokenDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IAuthTokenDocument, {}, {}> & import("../types/auth.types").IAuthToken & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
