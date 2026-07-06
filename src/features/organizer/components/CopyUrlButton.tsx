import { useState } from 'react'

type Props = {
  text: string
  label: string
}

/**
 * URL を Clipboard API でコピーする小ボタン。
 * コピー成功で 2 秒間だけ「コピー済み」表示に切り替える（IssuedUrlCard と同じ挙動）。
 */
export function CopyUrlButton({ text, label }: Props) {
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
      className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
      onClick={handleCopy}
    >
      <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-1`} />
      {copied ? 'コピー済み' : label}
    </button>
  )
}
