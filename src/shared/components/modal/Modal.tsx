import { useEffect, useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import '@/shared/components/modal/modal.scss'

type Props = {
  /** aria-labelledby が参照する見出し要素の id。children 側で同じ id を付けること */
  titleId: string
  onClose: () => void
  children: ReactNode
  /** modal-content に追加するクラス（画面ごとの見た目の差分用） */
  contentClassName?: string
  /** オーバーレイクリックで閉じるか（既定: 閉じる） */
  closeOnOverlayClick?: boolean
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * 完了ポップアップ・確認ダイアログの共通枠。
 * 仕様: docs/specs/design-refresh-2026/05-modals.md
 *
 * - role="dialog" aria-modal="true" aria-labelledby を維持
 * - Esc で閉じる
 * - 開いている間はフォーカストラップで背後にフォーカスが漏れないようにする
 */
export function Modal({ titleId, onClose, children, contentClassName, closeOnOverlayClick = true }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const content = contentRef.current

    const getFocusable = () =>
      content ? Array.from(content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : []

    const first = getFocusable()[0] ?? content
    first?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const items = getFocusable()
      if (items.length === 0) {
        e.preventDefault()
        content?.focus()
        return
      }

      const activeIndex = items.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey) {
        if (activeIndex <= 0) {
          e.preventDefault()
          items[items.length - 1].focus()
        }
      } else if (activeIndex === items.length - 1 || activeIndex === -1) {
        e.preventDefault()
        items[0].focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [])

  function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    if (closeOnOverlayClick) onClose()
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleOverlayClick}
    >
      <div className={contentClassName ? `modal-content ${contentClassName}` : 'modal-content'} ref={contentRef} tabIndex={-1}>
        {children}
      </div>
    </div>
  )
}
