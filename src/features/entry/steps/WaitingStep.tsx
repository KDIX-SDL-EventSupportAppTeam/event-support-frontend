import type { AppAccess } from '@/shared/api/appAccess'
import { EntryLayout } from '@/features/entry/components/EntryLayout'
import { formatOpenSchedule } from '@/features/entry/lib/formatOpenSchedule'

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
  error,
}: {
  access: AppAccess | null
  remainingMs: number | null
  /**
   * 直近のポーリングが失敗しているか（`useAppAccess` の `error`）。
   * 開放判定はサーバーの応答だけを見るため、通信できていない間はここで足止めされる。
   * 「まだ開放されていない」と「通信できていない」を利用者が見分けられるようにする（issue #80）。
   */
  error?: unknown
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
        {/* 再試行ボタンは置かない。ポーリングは回り続けており、利用者が押すものは無い */}
        {error ? (
          <p className="text-warning text-center small mt-2 mb-0">
            通信できていないため、開放状態を確認できていません。自動で再確認します。
          </p>
        ) : null}
      </div>
      <p className="text-muted text-center small mt-4 mb-0">
        開放時刻になると、この画面から自動でアプリへ進みます。
      </p>
    </EntryLayout>
  )
}
