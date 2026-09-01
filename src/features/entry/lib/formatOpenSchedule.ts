import type { AppAccess } from '@/shared/api/appAccess'

/**
 * 開放予定時刻・残り時間の表示文字列を組み立てる。
 *
 * **表示専用の整形で、開放判定そのものは行わない。**
 * 「今アプリを開けるか」はサーバーの `is_open` だけが決める（`AGENTS.md` 原則3 / issue #80）。
 * 描画テスト基盤が無いため、コンポーネントから分離して直接テストできるようにしている。
 */
export function formatOpenSchedule(access: AppAccess, remainingMs: number | null): string {
  if (access.mode !== 'scheduled' || !access.app_opens_at) {
    return 'アプリは現在ご利用いただけません。'
  }
  const opensAt = new Date(access.app_opens_at)
  const dateLabel = `${opensAt.getMonth() + 1}/${opensAt.getDate()} ${String(opensAt.getHours()).padStart(2, '0')}:${String(
    opensAt.getMinutes(),
  ).padStart(2, '0')}`

  if (remainingMs === null) return `開放予定 ${dateLabel}`

  const totalMinutes = Math.ceil(remainingMs / 60_000)
  // 開放予定を過ぎてもサーバーがまだ is_open=false を返している間は残り 0 になる
  // （フロントで先取りしないため。issue #80）。「あと 0 分」と出さない
  if (totalMinutes <= 0) return `開放予定 ${dateLabel}（まもなく開放されます）`

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const remainingLabel = hours > 0 ? `あと ${hours} 時間 ${minutes} 分` : `あと ${minutes} 分`
  return `開放予定 ${dateLabel}（${remainingLabel}）`
}
