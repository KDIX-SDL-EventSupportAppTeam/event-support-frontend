import type { AppAccess } from '@/shared/api/appAccess'
import { EntryLayout } from '@/features/entry/components/EntryLayout'

/**
 * S4 ── 開放待ち（回答完了画面）。
 *
 * 導線の中でここだけが数日〜数週間続く。開放時刻に達したら再読込なしで先へ進む必要があるため、
 * 開放状態のポーリングは呼び出し側（EntryPage）の `useAppAccess` が持ち、
 * この画面は受け取った値を表示するだけにしている。
 */
export function WaitingStep({
  access,
  remainingMs,
}: {
  access: AppAccess | null
  remainingMs: number | null
}) {
  return (
    <EntryLayout title="ご回答ありがとうございました">
      <p className="text-center mb-4">
        当日はいただいた内容を参考に、より楽しんでいただけるよう準備いたします。
      </p>
      <div className="d-grid">
        <button type="button" className="btn btn-primary btn-lg" disabled>
          アプリに移動する
        </button>
        {access ? (
          <p className="text-muted text-center small mt-2 mb-0">
            {formatOpenSchedule(access, remainingMs)}
          </p>
        ) : null}
      </div>
      <p className="text-muted text-center small mt-4 mb-0">
        開放時刻になると、この画面から自動でアプリへ進みます。
      </p>
    </EntryLayout>
  )
}

/** 開放予定時刻・残り時間の表示文字列を組み立てる（表示専用の整形。開放判定そのものは行わない） */
function formatOpenSchedule(access: AppAccess, remainingMs: number | null): string {
  if (access.mode !== 'scheduled' || !access.app_opens_at) {
    return 'アプリは現在ご利用いただけません。'
  }
  const opensAt = new Date(access.app_opens_at)
  const dateLabel = `${opensAt.getMonth() + 1}/${opensAt.getDate()} ${String(opensAt.getHours()).padStart(2, '0')}:${String(
    opensAt.getMinutes(),
  ).padStart(2, '0')}`

  if (remainingMs === null) return `開放予定 ${dateLabel}`

  const totalMinutes = Math.ceil(remainingMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const remainingLabel = hours > 0 ? `あと ${hours} 時間 ${minutes} 分` : `あと ${minutes} 分`
  return `開放予定 ${dateLabel}（${remainingLabel}）`
}
