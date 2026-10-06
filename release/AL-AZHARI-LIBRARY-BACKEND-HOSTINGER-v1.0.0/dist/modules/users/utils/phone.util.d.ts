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
export declare function canonicalizePhone(rawPhone: string): string;
/**
 * Validates if the phone number is a valid canonical phone number.
 * Accepts canonicalized Egyptian numbers (+201[0125]XXXXXXXX) and valid international E.164 numbers.
 */
export declare function isValidPhone(phone: string): boolean;
