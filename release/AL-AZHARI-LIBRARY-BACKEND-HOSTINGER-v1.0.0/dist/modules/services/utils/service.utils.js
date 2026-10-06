"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateServiceReference = generateServiceReference;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates an authoritative service request reference:
 * Pattern: SRV-YYYYMMDD-XXXX (e.g. SRV-20260930-7A4B)
 * Safe under high concurrency.
 */
function generateServiceReference(date = new Date()) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const randomSuffix = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    return `SRV-${year}${month}${day}-${randomSuffix}`;
}
//# sourceMappingURL=service.utils.js.map