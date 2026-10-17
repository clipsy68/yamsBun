/** Supported UI languages — native self-names are never translated, so they're kept as plain data
 * here rather than in the locale JSON files. */
export interface LanguageOption {
  code: string
  nativeName: string
  rtl?: boolean
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English' },
  { code: 'ro', nativeName: 'Română' },
  { code: 'ar', nativeName: 'العربية', rtl: true },
  { code: 'bg', nativeName: 'Български' },
  { code: 'cs', nativeName: 'Čeština' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'es', nativeName: 'Español' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'hi', nativeName: 'हिन्दी' },
  { code: 'hu', nativeName: 'Magyar' },
  { code: 'it', nativeName: 'Italiano' },
  { code: 'ja', nativeName: '日本語' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'nl', nativeName: 'Nederlands' },
  { code: 'pl', nativeName: 'Polski' },
  { code: 'pt', nativeName: 'Português' },
  { code: 'ru', nativeName: 'Русский' },
  { code: 'sv', nativeName: 'Svenska' },
  { code: 'tr', nativeName: 'Türkçe' },
  { code: 'uk', nativeName: 'Українська' },
  { code: 'zh', nativeName: '中文' },
]

export const DEFAULT_LANGUAGE = 'en'

export function isRtl(code: string): boolean {
  return LANGUAGES.find((l) => l.code === code)?.rtl ?? false
}
