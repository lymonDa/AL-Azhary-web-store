import { IRoleDocument } from '../types/user.types';
export declare const RoleModel: import("mongoose").Model<IRoleDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IRoleDocument, {}, {}> & import("../types/user.types").IRole & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
