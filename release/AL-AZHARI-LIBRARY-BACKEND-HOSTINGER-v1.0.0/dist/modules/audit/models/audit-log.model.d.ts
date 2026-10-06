import { IAuditLogDocument } from '../types/audit.types';
export declare const AuditLogModel: import("mongoose").Model<IAuditLogDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IAuditLogDocument, {}, {}> & import("../types/audit.types").IAuditLog & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
