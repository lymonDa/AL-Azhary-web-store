/**
 * Localized content shape as returned by backend.
 * Arabic is primary and always required; English is optional.
 */
export interface LocalizedText {
  readonly ar: string;
  readonly en?: string;
}

export function pickLocalizedText(
  text: LocalizedText | null | undefined,
  locale: 'ar' | 'en' = 'ar',
): string {
  if (!text) {
    return '';
  }
  if (locale === 'en' && text.en && text.en.trim().length > 0) {
    return text.en;
  }
  return text.ar ?? '';
}
