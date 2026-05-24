/**
 * 参加者がブースにチェックインした結果（クライアント表示用）。
 *
 * - `checkin_id`: API/DB 識別子（ユビキタス言語: `checkin_id`）
 * - `booth`: チェックインしたブースの最小情報
 *   - `booth_id` / `name` は v1 API `V1CheckInResponse.booth` 由来
 *   - `emoji` は UI 表示用にクライアントで補完する派生値で、API には含まれない
 *
 * 関連: v1 `POST /api/v1/checkins` → `V1CheckInResponse`
 * ユビキタス言語: docs/ubiquitous-language.md
 */
export type CheckInResult = {
  checkin_id: string
  booth: { booth_id: string; name: string; emoji: string }
}
