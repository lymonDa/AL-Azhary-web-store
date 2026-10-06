"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertMoney = assertMoney;
const app_error_1 = require("../errors/app-error");
const error_codes_1 = require("../constants/error-codes");
function assertMoney(value) {
    if (!Number.isInteger(value) || value < 0) {
        throw new app_error_1.AppError(error_codes_1.ErrorCodes.VALIDATION_ERROR, 'Money must be a non-negative integer in minor units (piastres)', 400);
    }
}
//# sourceMappingURL=money.js.map