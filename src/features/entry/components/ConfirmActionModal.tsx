import type { ReactNode } from 'react'
import { Modal } from '@/shared/components/modal/Modal'

/**
 * 破壊的な操作の前に挟む 1 段の確認。入口（`/e/:eventId`）の脱出導線・登録し直しで共用する。
 * 誤タップでログアウト・登録し直しにならないよう、何が起きるかを本文で明示させる。
 */
export function ConfirmActionModal({
  titleId,
  title,
  children,
  confirmLabel,
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
}: {
  titleId: string
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal titleId={titleId} onClose={onCancel}>
      <h2 id={titleId} className="modal-title">
        {title}
      </h2>
      <div className="modal-body-text">{children}</div>
      <div className="modal-footer-buttons">
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
