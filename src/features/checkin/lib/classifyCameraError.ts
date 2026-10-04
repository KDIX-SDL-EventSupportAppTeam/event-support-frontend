/** カメラ起動の失敗理由。理由ごとに案内を変える（issue #171）。 */
export type CameraFailure =
  /** NotAllowedError / SecurityError — 権限拒否 */
  | 'denied'
  /** NotFoundError / DevicesNotFoundError — カメラが無い */
  | 'not_found'
  /** NotReadableError / TrackStartError — 他アプリが使用中 */
  | 'in_use'
  /** getUserMedia が無い（アプリ内ブラウザ等） */
  | 'unsupported'
  | 'unknown'

/**
 * 失敗理由を分類する（純関数）。
 *
 * `DOMException#name` で判定し、`message` の文言には依存しない（ブラウザ・言語で変わるため）。
 * ただし `html5-qrcode` は内部のエラーを**文字列化して reject する**ことがあり、その場合 `name` が取れない。
 * そのときだけ、文字列に含まれるエラー名の部分一致へフォールバックする。
 */
export function classifyCameraError(error: unknown): CameraFailure {
  const name = extractName(error)
  const byName = classifyName(name)
  if (byName) return byName

  const text = typeof error === 'string' ? error : error instanceof Error ? error.message : ''
  // 文字列化されたエラー（"NotAllowedError: Permission denied" など）からエラー名を拾う
  const match = text.match(/(NotAllowedError|SecurityError|NotFoundError|DevicesNotFoundError|NotReadableError|TrackStartError)/)
  if (match) return classifyName(match[1]) ?? 'unknown'
  // html5-qrcode 固有の文言（カメラが見つからないとき）
  if (/Requested device not found|no camera|Camera streaming not supported/i.test(text)) {
    return /not supported/i.test(text) ? 'unsupported' : 'not_found'
  }
  return 'unknown'
}

function extractName(error: unknown): string {
  if (error && typeof error === 'object' && 'name' in error) {
    const n = (error as { name?: unknown }).name
    if (typeof n === 'string') return n
  }
  return ''
}

function classifyName(name: string): CameraFailure | null {
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'denied'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'not_found'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'in_use'
    default:
      return null
  }
}

/** 解像度・フォーカスの制約が厳しすぎて起動できなかった（制約を落として再試行する対象）。 */
export function isOverconstrainedError(error: unknown): boolean {
  if (extractName(error) === 'OverconstrainedError') return true
  const text = typeof error === 'string' ? error : error instanceof Error ? error.message : ''
  return /OverconstrainedError|ConstraintNotSatisfiedError/.test(text)
}
