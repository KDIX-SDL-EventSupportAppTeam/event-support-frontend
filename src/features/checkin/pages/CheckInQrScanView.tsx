import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { parseQrToBoothId } from '@/features/checkin/lib/parseQrToBoothId'

type Props = {
  onDetected: (boothId: string) => void
  onFallback: () => void
  /** QR が読めないとき用: 手動コード入力へ（issue #86。実 API フローでのみ渡す） */
  onManualCode?: () => void
}

const CAMERA_FAILED_MSG = 'カメラを起動できませんでした。下の「ブース一覧から選ぶ」から進めます。'
const OUT_OF_SCOPE_MSG = 'このQRコードは読み取れませんでした。もう一度かざすか、ブース一覧から選んでください。'

/**
 * フォールバック導線（ブース一覧から選ぶ）を出すまでの待ち時間。
 * issue #84 は「カメラが使えない / 権限拒否 / 対象外の QR のときだけ」出すよう求めている。
 * 一方 getUserMedia は端末によって成功も失敗も返さないまま保留になることがあり、
 * エラー時だけに絞ると先に進めなくなる。エラー時は即時、そうでなければこの時間だけ待って出す。
 */
const FALLBACK_DELAY_MS = 8000

/**
 * カメラの引き継ぎ用。前の読み取り画面がカメラを止め終えるまで、次の読み取り画面は起動を待つ。
 * ルーターがチェックイン画面を遷移ごとに作り直すようになった（NG-9）ため、読み取り画面を
 * 表示したままボトムナビの「チェックイン」を押すと旧インスタンスの停止と新インスタンスの
 * 起動が重なり、端末によっては新しい起動が失敗することがある。停止 → 起動の順を保証する。
 */
let cameraHandoff: Promise<void> = Promise.resolve()

/**
 * 引き継ぎ待ちの上限。前のカメラの起動・停止が成功も失敗も返さず固まる端末で、
 * 次の読み取り画面まで巻き込んで永遠に起動しなくなるのを防ぐ。上限を過ぎたら待たずに起動する。
 */
const CAMERA_HANDOFF_TIMEOUT_MS = 3000

function withHandoffTimeout(p: Promise<void>): Promise<void> {
  return Promise.race([
    p,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, CAMERA_HANDOFF_TIMEOUT_MS)
    }),
  ])
}

export function CheckInQrScanView({ onDetected, onFallback, onManualCode }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [fallbackVisible, setFallbackVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setFallbackVisible(true), FALLBACK_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const handledRef = useRef(false)
  const lastErrorRef = useRef<string | null>(null)
  // 読み取り枠の要素 id はマウントごとに別にする。html5-qrcode の clear() は id で要素を
  // 引き直して中身を空にするため、前の読み取り画面の後始末が、作り直された新しい画面の
  // 映像を消してしまわないようにする（NG-9 で画面を作り直すようになった）。
  const readerId = `checkin-qr-reader-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  useEffect(() => {
    const safeStop = async (target: Html5Qrcode | null) => {
      if (!target) return
      try {
        if (target.getState() === Html5QrcodeScannerState.SCANNING) await target.stop()
        target.clear()
      } catch {
        /* ignore */
      }
    }

    const onDecoded = (decodedText: string) => {
      if (handledRef.current) return
      handledRef.current = true
      const boothId = parseQrToBoothId(decodedText)
      if (!boothId) {
        handledRef.current = false
        if (lastErrorRef.current !== OUT_OF_SCOPE_MSG) {
          lastErrorRef.current = OUT_OF_SCOPE_MSG
          setError(OUT_OF_SCOPE_MSG)
        }
        return
      }
      void safeStop(local).then(() => onDetected(boothId))
    }

    const onFrameError = () => {
      /* 毎フレームのデコード失敗。何もしない */
    }

    const local = new Html5Qrcode(readerId, { verbose: false })
    // 起動前に画面が消えたら（素早い連続タップなど）カメラを起動しない
    let cancelled = false
    const startPromise = cameraHandoff
      .then(() => {
        if (cancelled) return
        return local.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.8)
              return { width: size, height: size }
            },
          },
          onDecoded,
          onFrameError,
        )
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn('[checkin-qr] start failed:', msg)
        setError(CAMERA_FAILED_MSG)
      })

    return () => {
      cancelled = true
      // 次の読み取り画面は、この停止が終わるまで起動を待つ
      cameraHandoff = withHandoffTimeout(Promise.resolve(startPromise).then(() => safeStop(local)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="checkin-qr-scan-view">
      <h2 className="result-title">QRコードをかざしてください</h2>
      <div id={readerId} className="checkin-qr-reader" />
      {error ? <p className="checkin-error-box">{error}</p> : null}
      {error || fallbackVisible ? (
        <button type="button" className="checkin-qr-fallback-link" onClick={onFallback}>
          ブース一覧から選ぶ
        </button>
      ) : null}
      {onManualCode ? (
        <button
          type="button"
          // 行を分けるだけなら Bootstrap の d-block は使わない。display: block !important で
          // 親 .checkin-qr-scan-view の text-align: center から外れ、左端に寄ってしまう（NG-7）。
          // 1 行を占有しつつ中央に置く指定は .checkin-qr-fallback-link--own-line 側で持つ。
          className="checkin-qr-fallback-link checkin-qr-fallback-link--own-line"
          onClick={onManualCode}
        >
          QRが読めないときはコードを入力
        </button>
      ) : null}
    </div>
  )
}
