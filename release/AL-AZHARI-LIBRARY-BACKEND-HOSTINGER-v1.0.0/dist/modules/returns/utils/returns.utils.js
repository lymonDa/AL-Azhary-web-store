"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReturnReference = generateReturnReference;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates a stable public reference for a return request: RET-YYYYMMDD-XXXXXX
 */
function generateReturnReference(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const entropy = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    return `RET-${y}${m}${d}-${entropy}`;
}
//# sourceMappingURL=returns.utils.js.map