/**
 * Standard Mongoose schema options applied across AL-AZHARI LIBRARY collections.
 * - strict: 'throw' prevents schema drift and accidental storage of untrusted fields.
 * - timestamps: true guarantees consistent BSON UTC createdAt and updatedAt.
 * - toJSON/toObject transforms remove internal __v and retain clean IDs.
 */
export declare const defaultSchemaOptions: {
    timestamps: boolean;
    strict: "throw";
    toJSON: {
        virtuals: boolean;
        versionKey: boolean;
        transform: (_doc: unknown, ret: Record<string, unknown>) => Record<string, unknown>;
    };
    toObject: {
        virtuals: boolean;
        versionKey: boolean;
        transform: (_doc: unknown, ret: Record<string, unknown>) => Record<string, unknown>;
    };
};
