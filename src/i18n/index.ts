import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { DEFAULT_LANGUAGE, isRtl } from './languages'

import en from './locales/en.json'
import ro from './locales/ro.json'
import ar from './locales/ar.json'
import bg from './locales/bg.json'
import cs from './locales/cs.json'
import de from './locales/de.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import hi from './locales/hi.json'
import hu from './locales/hu.json'
import it from './locales/it.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import nl from './locales/nl.json'
import pl from './locales/pl.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'
import sv from './locales/sv.json'
import tr from './locales/tr.json'
import uk from './locales/uk.json'
import zh from './locales/zh.json'

const STORAGE_KEY = 'yamsbun.language.v1'

function applyDomAttributes(language: string) {
  document.documentElement.lang = language
  document.documentElement.dir = isRtl(language) ? 'rtl' : 'ltr'
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ro: { translation: ro },
      ar: { translation: ar },
      bg: { translation: bg },
      cs: { translation: cs },
      de: { translation: de },
      es: { translation: es },
      fr: { translation: fr },
      hi: { translation: hi },
      hu: { translation: hu },
      it: { translation: it },
      ja: { translation: ja },
      ko: { translation: ko },
      nl: { translation: nl },
      pl: { translation: pl },
      pt: { translation: pt },
      ru: { translation: ru },
      sv: { translation: sv },
      tr: { translation: tr },
      uk: { translation: uk },
      zh: { translation: zh },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [
      'en', 'ro', 'ar', 'bg', 'cs', 'de', 'es', 'fr', 'hi', 'hu',
      'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'sv', 'tr', 'uk', 'zh',
    ],
    nonExplicitSupportedLngs: true,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

applyDomAttributes(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE)
i18n.on('languageChanged', applyDomAttributes)

export default i18n
