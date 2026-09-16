/**
 * 旧 Vue アプリ（プロトフェス UI）と同一のブース行形状。
 * サーバーからはこの形にマッピングして渡す（サンプルは `SampleEventData` のみが定義）。
 */
export type LegacyBooth = {
  booth_id: string
  /** ビンゴ・一覧の表示用（v1 の display_code。公開してよいブース番号）。未設定なら「—」表示 */
  booth_display_code?: string
  booth_name: string
  booth_emoji: string
  booth_description: string
  booth_image_url: string | null
  /** ビンゴカード API が付与する場合 */
  is_recommendation?: boolean
}

export type BingoGridCell = LegacyBooth | null
