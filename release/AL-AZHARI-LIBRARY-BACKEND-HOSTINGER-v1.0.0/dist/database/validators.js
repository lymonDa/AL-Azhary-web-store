"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertMoney = assertMoney;
exports.isValidObjectId = isValidObjectId;
exports.assertObjectId = assertObjectId;
const mongoose_1 = __importDefault(require("mongoose"));
const errors_1 = require("../common/errors");
/**
 * Validates that an amount is a valid non-negative integer minor unit (EGP piastres).
 * Implementation Plan §12.2: Floating-point arithmetic and negative amounts are strictly forbidden.
 */
function assertMoney(value, fieldName = 'amountMinor') {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        throw new errors_1.ValidationError(`${fieldName} must be a non-negative integer minor unit (piastres)`);
    }
}
/**
 * Checks if a string or unknown value is a valid MongoDB 24-character hexadecimal ObjectId.
 */
function isValidObjectId(value) {
    if (!value)
        return false;
    return mongoose_1.default.isValidObjectId(value);
}
/**
 * Asserts that a value is a valid MongoDB ObjectId or throws a clean BadRequestError.
 */
function assertObjectId(value, fieldName = 'id') {
    if (!isValidObjectId(value)) {
        throw new errors_1.BadRequestError(`Invalid identifier format for ${fieldName}`);
    }
}
//# sourceMappingURL=validators.js.map