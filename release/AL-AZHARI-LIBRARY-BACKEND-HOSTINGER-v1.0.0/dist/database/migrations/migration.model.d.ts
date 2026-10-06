import mongoose, { Document, Model, Connection } from 'mongoose';
export interface IMigrationRecord extends Document {
    id: string;
    description: string;
    appliedAt: Date;
    batch: number;
}
export declare const MigrationRecordSchema: mongoose.Schema<IMigrationRecord, mongoose.Model<IMigrationRecord, any, any, any, mongoose.Document<unknown, any, IMigrationRecord, any, {}> & IMigrationRecord & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, IMigrationRecord, mongoose.Document<unknown, {}, mongoose.FlatRecord<IMigrationRecord>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<IMigrationRecord> & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function getMigrationModel(connection?: Connection): Model<IMigrationRecord>;
