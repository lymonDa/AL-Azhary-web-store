"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmail = normalizeEmail;
/**
 * Normalizes email by trimming and converting to lowercase.
 */
function normalizeEmail(email) {
    if (!email || typeof email !== 'string') {
        return '';
    }
    return email.trim().toLowerCase();
}
//# sourceMappingURL=email.util.js.map