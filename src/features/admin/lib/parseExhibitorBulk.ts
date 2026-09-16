/**
 * 出展者一括登録の貼り付けテキストをパースする純関数。
 * React にも API にも依存しない（将来テスト基盤を入れたときにこの関数だけ検証できる）。
 * 仕様: 改修プラン frontend_43_出展者管理画面.md §4-2(b)
 */
export type ParsedBulkRow = {
  line: number // 元テキストの行番号（1始まり。エラー表示用）
  email: string
  password: string
  boothName: string
  boothId: string | null // 解決済み booth_id（エラー行は null）
  errors: string[] // 空配列なら有効行
}

const EMAIL_RE = /^\S+@\S+\.\S+$/

export function parseExhibitorBulk(
  text: string,
  booths: { id: string; name: string }[],
): ParsedBulkRow[] {
  const lines = text.split(/\r?\n/)
  const rows: ParsedBulkRow[] = []

  lines.forEach((rawLine, idx) => {
    // 空白のみの行はスキップ（行番号は元テキスト基準で維持するため idx は保持しつつ push しない）
    if (rawLine.trim() === '') return

    const lineNumber = idx + 1
    // 区切りは行単位で判定: タブを含めばタブ区切り、含まなければカンマ区切り
    const delimiter = rawLine.includes('\t') ? '\t' : ','
    const parts = rawLine.split(delimiter).map((p) => p.trim())

    const errors: string[] = []
    // email は比較・送信とも toLowerCase()
    const email = (parts[0] ?? '').toLowerCase()
    const password = parts[1] ?? ''
    const boothName = parts[2] ?? ''
    let boothId: string | null = null

    if (parts.length !== 3) {
      errors.push('列数が3ではありません（メール/パスワード/ブース名）')
    } else {
      if (!EMAIL_RE.test(email)) {
        errors.push('メールアドレスの形式が不正です')
      }
      if (password.length < 8) {
        errors.push('パスワードが8文字未満です')
      }
      const matches = booths.filter((b) => b.name.trim() === boothName)
      if (matches.length === 0) {
        errors.push('ブース名が一致しません')
      } else if (matches.length > 1) {
        errors.push('同名のブースが複数あります（ブース名では特定できません）')
      } else {
        boothId = matches[0].id
      }
    }

    rows.push({ line: lineNumber, email, password, boothName, boothId, errors })
  })

  // ペースト内の email 重複チェック（小文字化して比較。2件目以降の行にエラーを追加）
  const seenEmails = new Set<string>()
  for (const row of rows) {
    if (!row.email) continue
    if (seenEmails.has(row.email)) {
      row.errors.push('上の行とメールアドレスが重複しています')
    } else {
      seenEmails.add(row.email)
    }
  }

  return rows
}
