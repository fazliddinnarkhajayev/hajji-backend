/**
 * Canonical language codes for translatable content (duas, and later
 * rituals/locations). Kept in sync with the mobile app's i18n locale codes.
 */
export const CONTENT_LANGUAGES = ['en', 'ru', 'uz_latin', 'uz_cyr'] as const;

export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];

/** Language returned when the requested one has no translation. */
export const DEFAULT_CONTENT_LANGUAGE: ContentLanguage = 'en';
