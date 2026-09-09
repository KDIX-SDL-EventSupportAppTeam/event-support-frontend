import { useState } from 'react'

type Props = {
  /** コピーする文字列 */
  text: string
  /** 通常時のラベル */
  label: string
  className?: string
}

/**
 * 任意の文字列を Clipboard API でコピーする小ボタン。
 * 成功で 2 秒だけ「コピー済み」表示に切り替える。
 * feature をまたいで使うため shared に置く（AGENTS.md 原則4）。
 */
export function CopyButton({ text, label, className }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard API が使えない環境では何もしない */
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'} ${className ?? ''}`}
      onClick={handleCopy}
    >
      <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-1`} />
      {copied ? 'コピー済み' : label}
    </button>
  )
}
