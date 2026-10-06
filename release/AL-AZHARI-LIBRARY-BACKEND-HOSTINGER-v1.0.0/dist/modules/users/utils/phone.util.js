"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalizePhone = canonicalizePhone;
exports.isValidPhone = isValidPhone;
/**
 * Canonicalizes Egyptian and international phone numbers into standard format (+201XXXXXXXXX).
 *
 * Rules:
 * - Trims whitespace and removes common formatting characters (spaces, dashes, parentheses, dots).
 * - Replaces leading '00' with '+'.
 * - If an 11-digit Egyptian mobile number starting with '01' (010, 011, 012, 015) is provided, converts to '+201XXXXXXXXX'.
 * - If a 12-digit number starting with '201' is provided, prepends '+'.
 * - Retains valid international E.164 formats (+[countryCode][number]).
 */
function canonicalizePhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') {
        return '';
    }
    // Strip whitespace and separators
    let cleaned = rawPhone.trim().replace(/[\s\-().]/g, '');
    // Normalize international prefix 00 to +
    if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.slice(2);
    }
    // Egyptian mobile format: 01XXXXXXXXX (11 digits)
    if (/^01[0125]\d{8}$/.test(cleaned)) {
        return '+2' + cleaned;
    }
    // Egyptian mobile format missing plus: 201XXXXXXXXX (12 digits)
    if (/^201[0125]\d{8}$/.test(cleaned)) {
        return '+' + cleaned;
    }
    // Already prefixed Egyptian format: +201XXXXXXXXX
    if (/^\+201[0125]\d{8}$/.test(cleaned)) {
        return cleaned;
    }
    // General international format: ensure '+' if digits only and > 8 digits
    if (/^\d{9,15}$/.test(cleaned)) {
        return '+' + cleaned;
    }
    return cleaned;
}
/**
 * Validates if the phone number is a valid canonical phone number.
 * Accepts canonicalized Egyptian numbers (+201[0125]XXXXXXXX) and valid international E.164 numbers.
 */
function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    const canonical = canonicalizePhone(phone);
    // Egyptian mobile regex or general E.164 regex (8 to 15 digits)
    return /^\+201[0125]\d{8}$/.test(canonical) || /^\+[1-9]\d{7,14}$/.test(canonical);
}
//# sourceMappingURL=phone.util.js.map