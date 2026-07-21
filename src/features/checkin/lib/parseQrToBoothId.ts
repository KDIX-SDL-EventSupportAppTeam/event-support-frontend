/**
 * QRコード読み取り文字列からブースID（UUID）を取り出す。
 * - URL形式（例 `https://.../checkin?booth_id=<uuid>`）: booth_id クエリの値
 * - 文字列全体がUUID: そのまま返す
 * - それ以外・booth_id がUUID形式でない場合: null
 * 大文字小文字は正規化しない（seed の booth_id は小文字固定で完全一致照合のため、原文のケースを保持する）。
 */
export function parseQrToBoothId(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null

  const fromUrl = extractBoothIdFromUrl(trimmed)
  if (fromUrl !== null) return isUuid(fromUrl) ? fromUrl : null

  return isUuid(trimmed) ? trimmed : null
}

/** URL文字列から booth_id クエリパラメータを取り出す。URLパース失敗時は正規表現でフォールバック抽出する。 */
function extractBoothIdFromUrl(value: string): string | null {
  try {
    return new URL(value).searchParams.get('booth_id')
  } catch {
    const match = value.match(/[?&]booth_id=([^&]+)/)
    return match ? decodeURIComponent(match[1]) : null
  }
}

/** UUID形式（8-4-4-4-12 の16進）判定。大文字小文字どちらも受理する。 */
function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}
