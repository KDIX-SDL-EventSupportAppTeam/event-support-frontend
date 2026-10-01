/**
 * ブース一括登録（スプレッド風テーブル）の入力行を検証する純関数。
 * React にも API にも依存しない（parseExhibitorBulk.ts と同じ方針）。
 */
export type BoothBulkRow = {
  key: string
  displayCode: string
  name: string
  genre: string
  description: string
  tags: string
}

export type ValidatedBoothBulkRow = BoothBulkRow & {
  /** 空行（すべての欄が空）は送信対象から外す。一覧では非表示にしない（行番号がズレて分かりにくくなるため） */
  isBlank: boolean
  errors: string[]
}

export function emptyBoothBulkRow(key: string): BoothBulkRow {
  return { key, displayCode: '', name: '', genre: '', description: '', tags: '' }
}

export function validateBoothBulkRows(rows: BoothBulkRow[]): ValidatedBoothBulkRow[] {
  const displayCodeCounts = new Map<string, number>()
  for (const row of rows) {
    const code = row.displayCode.trim()
    if (!code) continue
    displayCodeCounts.set(code, (displayCodeCounts.get(code) ?? 0) + 1)
  }

  return rows.map((row) => {
    const isBlank =
      !row.displayCode.trim() && !row.name.trim() && !row.genre.trim() && !row.description.trim() && !row.tags.trim()
    const errors: string[] = []

    if (!isBlank) {
      if (!row.name.trim()) {
        errors.push('ブース名は必須です')
      }
      const code = row.displayCode.trim()
      if (code && (displayCodeCounts.get(code) ?? 0) > 1) {
        errors.push('ブース番号がこの表の中で重複しています')
      }
    }

    return { ...row, isBlank, errors }
  })
}

/** 送信対象（空行を除いた、有効な行）だけを抜き出す */
export function submittableBoothBulkRows(rows: ValidatedBoothBulkRow[]): ValidatedBoothBulkRow[] {
  return rows.filter((r) => !r.isBlank && r.errors.length === 0)
}
