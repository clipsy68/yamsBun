import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../../i18n/languages'
import './LanguageDialog.css'

interface LanguageDialogProps {
  onClose: () => void
}

export default function LanguageDialog({ onClose }: LanguageDialogProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className="lgd-overlay" onClick={onClose}>
      <div className="lgd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lgd-title">{t('languagePicker.title')}</div>
        <div className="lgd-list">
          {LANGUAGES.map((lang) => (
            <button
              type="button"
              key={lang.code}
              className={`lgd-option ${i18n.resolvedLanguage === lang.code ? 'selected' : ''}`}
              onClick={() => {
                i18n.changeLanguage(lang.code)
                onClose()
              }}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
