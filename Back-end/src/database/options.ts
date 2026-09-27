/**
 * Standard Mongoose schema options applied across AL-AZHARI LIBRARY collections.
 * - strict: 'throw' prevents schema drift and accidental storage of untrusted fields.
 * - timestamps: true guarantees consistent BSON UTC createdAt and updatedAt.
 * - toJSON/toObject transforms remove internal __v and retain clean IDs.
 */
export const defaultSchemaOptions = {
  timestamps: true,
  strict: 'throw' as const,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret.__v;
      return ret;
    },
  },
};
