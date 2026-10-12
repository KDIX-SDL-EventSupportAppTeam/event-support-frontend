import type { CameraFailure } from '@/features/checkin/lib/classifyCameraError'
import { CopyButton } from '@/shared/components/CopyButton'
import { SHOW_BOOTH_LIST_FALLBACK } from '@/features/checkin/lib/boothListFallback'

type Props = {
  failure: CameraFailure
  /** 手動コード入力へ（実 API フローでのみ渡る） */
  onManualCode?: () => void
  onFallback: () => void
  /** 再起動を試みる（in_use / unknown でだけ意味がある） */
  onRetry: () => void
}

/**
 * 権限を戻す案内。**機種・OS・ブラウザごとの具体的な手順は書かない**
 * （メニュー名や位置が違いすぎて、外れた手順はかえって迷わせる）。どの端末でも通じる一般的な説明に留め、
 * 確実に進める経路として手動コード入力を最上位に置く。
 */
const PERMISSION_HELP =
  'お使いのブラウザ、またはスマートフォンの設定でこのサイトのカメラを「許可」にしてから、ページを再読み込みしてください。'

/**
 * カメラが使えなかったときの理由別の案内（issue #171）。
 *
 * **「カメラを許可し直す」ボタンは置かない。** 一度拒否された権限はブラウザがオリジン単位で記憶し、
 * JavaScript から再要求する手段が Web 標準に無い（`getUserMedia` を再度呼んでも即座に失敗するだけ）。
 * 押しても何も起きない UI は悪化でしかないので、「アプリ内で直す」ではなく「直し方を案内する」。
 * `in_use` / `unknown` の再試行ボタンは意味があるので置く。
 */
export function CameraTroubleshoot({ failure, onManualCode, onFallback, onRetry }: Props) {
  // 権限拒否・カメラ無し・非対応の参加者が完遂できる唯一の経路が 6 桁手動コード。最上位のボタンで出す
  const manualFirst = failure === 'denied' || failure === 'not_found' || failure === 'unsupported'

  const manualButton = onManualCode ? (
    <button
      type="button"
      className={`btn btn-lg w-100 ${manualFirst ? 'btn-primary' : 'btn-outline-dark'}`}
      onClick={onManualCode}
    >
      コードを入力してチェックイン
    </button>
  ) : null

  return (
    <div className="checkin-camera-troubleshoot" data-failure={failure}>
      <div className="checkin-error-box">
        {failure === 'denied' ? (
          <>
            <p className="fw-bold mb-1">カメラの使用が許可されていません</p>
            <p className="mb-1 small">{PERMISSION_HELP}</p>
            <p className="mb-0 small">うまくいかない場合は、下の「コードを入力してチェックイン」から進めます。</p>
          </>
        ) : null}
        {failure === 'not_found' ? <p className="mb-0">カメラが見つかりません。下の「コードを入力してチェックイン」から進めます。</p> : null}
        {failure === 'in_use' ? (
          <p className="mb-0">カメラを起動できませんでした。他のアプリでカメラを使っている場合は閉じてから、もう一度お試しください。</p>
        ) : null}
        {failure === 'unsupported' ? (
          <>
            <p className="mb-2">このブラウザではカメラを使えません。Safari / Chrome で開き直してください。</p>
            <CopyButton text={typeof window === 'undefined' ? '' : window.location.href} label="このページの URL をコピー" />
          </>
        ) : null}
        {failure === 'unknown' ? (
          <p className="mb-0">カメラを起動できませんでした。再試行するか、下のボタンから進めます。</p>
        ) : null}
      </div>

      <div className="d-grid gap-2 mt-3">
        {manualFirst ? manualButton : null}
        {failure === 'in_use' || failure === 'unknown' ? (
          <button type="button" className="btn btn-primary btn-lg" onClick={onRetry}>
            もう一度カメラを起動する
          </button>
        ) : null}
        {!manualFirst ? manualButton : null}
        {SHOW_BOOTH_LIST_FALLBACK ? (
          <button type="button" className="btn btn-outline-secondary" onClick={onFallback}>
            ブース一覧から選ぶ
          </button>
        ) : null}
      </div>
    </div>
  )
}
