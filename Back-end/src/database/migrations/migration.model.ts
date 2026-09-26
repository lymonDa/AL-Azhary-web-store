import mongoose, { Schema, Document, Model, Connection } from 'mongoose';

export interface IMigrationRecord extends Document {
  id: string;
  description: string;
  appliedAt: Date;
  batch: number;
}

export const MigrationRecordSchema = new Schema<IMigrationRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    appliedAt: { type: Date, required: true, default: Date.now },
    batch: { type: Number, required: true, default: 1 },
  },
  {
    collection: '__migrations',
    timestamps: false,
    versionKey: false,
  },
);

export function getMigrationModel(connection: Connection = mongoose.connection): Model<IMigrationRecord> {
  if (connection.models.__MigrationRecord) {
    return connection.models.__MigrationRecord as Model<IMigrationRecord>;
  }
  return connection.model<IMigrationRecord>('__MigrationRecord', MigrationRecordSchema);
}
