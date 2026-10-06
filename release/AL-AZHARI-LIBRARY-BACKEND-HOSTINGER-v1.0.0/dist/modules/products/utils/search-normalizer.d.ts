import { LocalizedText } from '../../../common/types';
import { IProductMetadata } from '../types/product.types';
/**
 * Normalizes Arabic text for resilient indexing and searching:
 * - Removes diacritics (tashkeel)
 * - Normalizes alef variants (أ, إ, آ -> ا)
 * - Normalizes teh marbuta (ة -> ه)
 * - Normalizes alef maksura (ى -> ي)
 * - Removes tatweel (ـ)
 */
export declare function normalizeArabic(text: string): string;
/**
 * Normalizes any text (Arabic + Latin) into a consistent lowercased, whitespace-collapsed string.
 */
export declare function normalizeText(text: string): string;
/**
 * Escapes special regex characters to prevent regex injection attacks.
 */
export declare function escapeRegex(text: string): string;
/**
 * Builds a composite normalized searchText from product fields.
 */
export declare function buildSearchText(name: LocalizedText, metadata?: IProductMetadata, description?: {
    ar?: string;
    en?: string;
} | null): string;
