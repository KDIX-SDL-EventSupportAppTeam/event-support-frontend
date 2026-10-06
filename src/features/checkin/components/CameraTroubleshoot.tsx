import type { CameraFailure } from '@/features/checkin/lib/classifyCameraError'
import type { Platform } from '@/shared/lib/detectEnvironment'
import { CopyButton } from '@/shared/components/CopyButton'

type Props = {
  failure: CameraFailure
  platform: Platform
  /** 手動コード入力へ（実 API フローでのみ渡る） */
  onManualCode?: () => void
  onFallback: () => void
  /** 再起動を試みる（in_use / unknown でだけ意味がある） */
  onRetry: () => void
}

/**
 * 権限を戻す手順。**端末を判定して 1 つだけ出す**（全 OS を並べると当日読まれない）。
 * 文言は OS のバージョンで変わるため、実機で現物を見て直すこと（issue #171）。
 */
function permissionSteps(platform: Platform): string {
  switch (platform) {
    case 'ios':
      return 'アドレスバー左の「ぁあ」→「Webサイトの設定」→「カメラ」→「許可」を選び、このページを再読み込みしてください。'
    case 'android':
      return 'アドレスバー左の鍵アイコン →「権限」→「カメラ」→「許可」を選び、このページを再読み込みしてください。'
    default:
      return 'ブラウザのサイト設定からカメラを許可し、このページを再読み込みしてください。'
  }
}

/**
 * カメラが使えなかったときの理由別の案内（issue #171）。
 *
 * **「カメラを許可し直す」ボタンは置かない。** 一度拒否された権限はブラウザがオリジン単位で記憶し、
 * JavaScript から再要求する手段が Web 標準に無い（`getUserMedia` を再度呼んでも即座に失敗するだけ）。
 * 押しても何も起きない UI は悪化でしかないので、「アプリ内で直す」ではなく「直し方を案内する」。
 * `in_use` / `unknown` の再試行ボタンは意味があるので置く。
 */
export function CameraTroubleshoot({ failure, platform, onManualCode, onFallback, onRetry }: Props) {
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
            <p className="mb-0 small">{permissionSteps(platform)}</p>
          </>
        ) : null}
        {failure === 'not_found' ? <p className="mb-0">カメラが見つかりません。</p> : null}
        {failure === 'in_use' ? (
          <p className="mb-0">他のアプリがカメラを使用中です。カメラアプリを閉じてから再試行してください。</p>
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
        <button type="button" className="btn btn-outline-secondary" onClick={onFallback}>
          ブース一覧から選ぶ
        </button>
      </div>
    </div>
  )
}
