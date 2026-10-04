import { parseQrToBoothId } from '@/features/checkin/lib/parseQrToBoothId'

/**
 * 掲示 QR の短縮トークンの字母。**サーバーの `src/lib/qr-token.ts` と同じ**
 * （0/O・1/I/L・U を除く 30 種、10 文字。server#155）。
 */
const QR_TOKEN_PATTERN = /^\/c\/([2-9A-HJKMNP-TV-Z]{10})\/?$/

export type CheckinTarget =
  /** 旧形式。ブース ID（UUID）をそのまま持つ（既に印刷・配布された QR） */
  | { kind: 'booth_id'; boothId: string }
  /** 短縮形式 `/c/<token>`。ブースはサーバーで解決する */
  | { kind: 'token'; token: string }

/**
 * QR の読み取り文字列から、チェックイン対象を取り出す。
 *
 * - `https://<host>/c/<10 文字>`（短縮形式。server#155）→ `token`
 * - `https://<host>/checkin?booth_id=<uuid>` または生の UUID（旧形式）→ `booth_id`
 * - それ以外 → `null`
 *
 * 旧形式は既に印刷・配布されている可能性があるため、受け口を残す。
 */
export function parseQrToCheckinTarget(raw: string | null | undefined): CheckinTarget | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (trimmed === '') return null

  const token = extractToken(trimmed)
  if (token) return { kind: 'token', token }

  const boothId = parseQrToBoothId(trimmed)
  return boothId ? { kind: 'booth_id', boothId } : null
}

function extractToken(value: string): string | null {
  try {
    const m = new URL(value).pathname.match(QR_TOKEN_PATTERN)
    return m ? m[1] : null
  } catch {
    return null
  }
}
