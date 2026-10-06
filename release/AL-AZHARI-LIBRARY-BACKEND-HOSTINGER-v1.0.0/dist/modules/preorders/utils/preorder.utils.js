"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePreorderReference = generatePreorderReference;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates an authoritative, stable public pre-order reference:
 * Pattern: PO-YYYYMMDD-XXXXXX (e.g. PO-20261002-7A4B1C)
 * Safe under high concurrency and fits MongoDB implementation plan conventions.
 */
function generatePreorderReference(date = new Date()) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const randomSuffix = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    return `PO-${year}${month}${day}-${randomSuffix}`;
}
//# sourceMappingURL=preorder.utils.js.map