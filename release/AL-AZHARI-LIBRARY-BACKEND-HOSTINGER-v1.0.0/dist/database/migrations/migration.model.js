"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRecordSchema = void 0;
exports.getMigrationModel = getMigrationModel;
const mongoose_1 = __importStar(require("mongoose"));
exports.MigrationRecordSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    appliedAt: { type: Date, required: true, default: Date.now },
    batch: { type: Number, required: true, default: 1 },
}, {
    collection: '__migrations',
    timestamps: false,
    versionKey: false,
});
function getMigrationModel(connection = mongoose_1.default.connection) {
    if (connection.models.__MigrationRecord) {
        return connection.models.__MigrationRecord;
    }
    return connection.model('__MigrationRecord', exports.MigrationRecordSchema);
}
//# sourceMappingURL=migration.model.js.map