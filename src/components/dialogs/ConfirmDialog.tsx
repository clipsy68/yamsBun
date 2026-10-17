import { useTranslation } from 'react-i18next'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <div className="cfd-overlay" onClick={onCancel}>
      <div className="cfd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cfd-title">{title}</div>
        <div className="cfd-message">{message}</div>
        <div className="cfd-actions">
          <button type="button" className="cfd-btn cfd-btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="cfd-btn cfd-btn-cancel" onClick={onCancel}>
            {cancelLabel ?? t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
