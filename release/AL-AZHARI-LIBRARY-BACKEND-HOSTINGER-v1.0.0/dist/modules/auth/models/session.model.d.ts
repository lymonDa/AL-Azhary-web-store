import { ISessionDocument } from '../types/auth.types';
export declare const SessionModel: import("mongoose").Model<ISessionDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ISessionDocument, {}, {}> & import("../types/auth.types").ISession & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
