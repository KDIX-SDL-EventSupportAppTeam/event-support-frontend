/**
 * ブース一覧カードの「未評価」バッジ（issue #115 D3）。
 * チェックイン済みかつ未評価のときだけ出す。未訪問・評価済みには出さない。
 * `rated` は `GET /checkins` の該当ブース分から引く（無ければ未チェックインとして扱う）。
 */
export function shouldShowUnratedBadge(isCheckedIn: boolean, rated: boolean | undefined): boolean {
  return isCheckedIn && rated === false
}
