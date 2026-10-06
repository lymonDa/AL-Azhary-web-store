"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeArabic = normalizeArabic;
exports.normalizeText = normalizeText;
exports.escapeRegex = escapeRegex;
exports.buildSearchText = buildSearchText;
/**
 * Normalizes Arabic text for resilient indexing and searching:
 * - Removes diacritics (tashkeel)
 * - Normalizes alef variants (أ, إ, آ -> ا)
 * - Normalizes teh marbuta (ة -> ه)
 * - Normalizes alef maksura (ى -> ي)
 * - Removes tatweel (ـ)
 */
function normalizeArabic(text) {
    if (!text)
        return '';
    return text
        // Remove diacritics / tashkeel (064B to 0652) and dagger alef (0670)
        .replace(/[\u064B-\u0652\u0670]/g, '')
        // Remove tatweel
        .replace(/\u0640/g, '')
        // Normalize alef
        .replace(/[أإآ]/g, 'ا')
        // Normalize teh marbuta
        .replace(/ة/g, 'ه')
        // Normalize alef maksura
        .replace(/ى/g, 'ي');
}
/**
 * Normalizes any text (Arabic + Latin) into a consistent lowercased, whitespace-collapsed string.
 */
function normalizeText(text) {
    if (!text)
        return '';
    const arabicNormalized = normalizeArabic(text);
    return arabicNormalized.toLowerCase().trim().replace(/\s+/g, ' ');
}
/**
 * Escapes special regex characters to prevent regex injection attacks.
 */
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
/**
 * Builds a composite normalized searchText from product fields.
 */
function buildSearchText(name, metadata, description) {
    const parts = [];
    if (name.ar)
        parts.push(name.ar);
    if (name.en)
        parts.push(name.en);
    if (metadata) {
        if (metadata.author)
            parts.push(metadata.author);
        if (metadata.publisher)
            parts.push(metadata.publisher);
        if (metadata.subject)
            parts.push(metadata.subject);
        if (metadata.grade)
            parts.push(metadata.grade);
        if (metadata.stage)
            parts.push(metadata.stage);
        if (metadata.isbn)
            parts.push(metadata.isbn);
        if (metadata.educationType)
            parts.push(metadata.educationType);
    }
    if (description) {
        if (description.ar)
            parts.push(description.ar);
        if (description.en)
            parts.push(description.en);
    }
    const rawCombined = parts.join(' ');
    return normalizeText(rawCombined);
}
//# sourceMappingURL=search-normalizer.js.map