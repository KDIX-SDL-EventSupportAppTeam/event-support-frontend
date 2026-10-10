import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { CameraTroubleshoot } from '@/features/checkin/components/CameraTroubleshoot'
import {
  BASIC_CAMERA_CONSTRAINTS,
  FULL_CAMERA_CONSTRAINTS,
  SCAN_FPS,
  type CameraVideoConstraints,
} from '@/features/checkin/lib/cameraConstraints'
import { hasCameraStartedThisSession, markCameraStarted } from '@/features/checkin/lib/cameraSession'
import {
  classifyCameraError,
  isOverconstrainedError,
  type CameraFailure,
} from '@/features/checkin/lib/classifyCameraError'
import { parseQrToCheckinTarget } from '@/features/checkin/lib/parseQrToCheckinTarget'
import { CopyButton } from '@/shared/components/CopyButton'
import { detectInAppBrowser, detectPlatform } from '@/shared/lib/detectEnvironment'

type Props = {
  /** 旧形式（ブース ID を含む QR）を読み取った */
  onDetected: (boothId: string) => void
  /** 短縮形式（`/c/<token>`）の QR を読み取った。ブースの解決は呼び出し側（`/c/:token`）が行う（issue #168） */
  onDetectedToken?: (token: string) => void
  onFallback: () => void
  /** QR が読めないとき用: 手動コード入力へ（issue #86。実 API フローでのみ渡す） */
  onManualCode?: () => void
}

const OUT_OF_SCOPE_MSG = 'このQRコードは読み取れませんでした。もう一度かざすか、ブース一覧から選んでください。'

/**
 * フォールバック導線（ブース一覧から選ぶ）を出すまでの待ち時間。
 * issue #84 は「カメラが使えない / 権限拒否 / 対象外の QR のときだけ」出すよう求めている。
 * 一方 getUserMedia は端末によって成功も失敗も返さないまま保留になることがあり、
 * エラー時だけに絞ると先に進めなくなる。エラー時は即時、そうでなければこの時間だけ待って出す。
 * 8 秒は長すぎるため 3 秒に短縮した（issue #170）。
 */
const FALLBACK_DELAY_MS = 3000

/**
 * 起動要求から、解決も reject もされないまま経過したら「保留」とみなす時間（issue #170）。
 * WebView では getUserMedia が reject せずに固まることがある。保留とみなしても**カメラは止めない**
 * （後から起動したらそのまま使える）。案内とフォールバック導線を出すだけ。
 */
const START_STALL_MS = 5000

/**
 * カメラの引き継ぎ用。前の読み取り画面がカメラを止め終えるまで、次の読み取り画面は起動を待つ。
 * ルーターがチェックイン画面を遷移ごとに作り直すようになった（NG-9）ため、読み取り画面を
 * 表示したままボトムナビの「チェックイン」を押すと旧インスタンスの停止と新インスタンスの
 * 起動が重なり、端末によっては新しい起動が失敗することがある。停止 → 起動の順を保証する。
 */
let cameraHandoff: Promise<void> = Promise.resolve()

/**
 * 引き継ぎ待ちが残っているか。**タップから `start()` までに `await` を挟まないため**に持つ（issue #170）。
 * ジェスチャ要求が厳しい WebView は、ユーザー操作の直後でない権限要求を黙って拒否する。
 * 待ち合わせが済んでいれば（ほとんどの場合）タップのコールスタックから直接 `start()` する。
 */
let handoffPending = false

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

function setHandoff(p: Promise<void>): void {
  handoffPending = true
  const mine = withHandoffTimeout(p).then(() => {
    // 後から別の引き継ぎが積まれていたら、そちらが済むまで保留のままにする
    if (cameraHandoff === mine) handoffPending = false
  })
  cameraHandoff = mine
}

type Phase = 'idle' | 'starting' | 'running' | 'failed'

/** 起動前に権限が拒否済みと分かれば true（`navigator.permissions` 未対応・例外は「分からない」= false）。 */
async function isCameraPermissionDenied(): Promise<boolean> {
  try {
    const status = await navigator.permissions.query({ name: 'camera' as PermissionName })
    return status.state === 'denied'
  } catch {
    return false
  }
}

export function CheckInQrScanView({ onDetected, onDetectedToken, onFallback, onManualCode }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [failure, setFailure] = useState<CameraFailure | null>(null)
  const [stalled, setStalled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fallbackVisible, setFallbackVisible] = useState(false)

  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent
  const inAppBrowser = detectInAppBrowser(userAgent)
  const platform = detectPlatform(userAgent)

  useEffect(() => {
    const timer = window.setTimeout(() => setFallbackVisible(true), FALLBACK_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const handledRef = useRef(false)
  const lastErrorRef = useRef<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  /** マウントごとの寿命管理。StrictMode の二重マウントでも前のマウントの非同期処理が後を汚さないようにする */
  const lifeRef = useRef({ cancelled: false })
  const startPromiseRef = useRef<Promise<unknown> | null>(null)
  const startingRef = useRef(false)
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected
  const onDetectedTokenRef = useRef(onDetectedToken)
  onDetectedTokenRef.current = onDetectedToken
  // 読み取り枠の要素 id はマウントごとに別にする。html5-qrcode の clear() は id で要素を
  // 引き直して中身を空にするため、前の読み取り画面の後始末が、作り直された新しい画面の
  // 映像を消してしまわないようにする（NG-9 で画面を作り直すようになった）。
  const readerId = `checkin-qr-reader-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  const safeStop = useCallback(async (target: Html5Qrcode | null) => {
    if (!target) return
    try {
      if (target.getState() === Html5QrcodeScannerState.SCANNING) await target.stop()
      target.clear()
    } catch {
      /* ignore */
    }
  }, [])

  /**
   * カメラを起動する。**ボタンの onClick から呼ぶ場合、`await` を挟まず同期的に `start()` へ届く**
   * （待ち合わせが残っているときだけ `cameraHandoff` を待つ）。
   */
  const startCamera = useCallback(() => {
    const scanner = scannerRef.current
    const life = lifeRef.current
    if (!scanner || life.cancelled || startingRef.current) return
    startingRef.current = true
    setPhase('starting')
    setFailure(null)
    setStalled(false)

    const onDecoded = (decodedText: string) => {
      if (handledRef.current) return
      handledRef.current = true
      const target = parseQrToCheckinTarget(decodedText)
      // 短縮形式は受け取り側が無ければ読めなかったものとして扱う
      if (!target || (target.kind === 'token' && !onDetectedTokenRef.current)) {
        handledRef.current = false
        if (lastErrorRef.current !== OUT_OF_SCOPE_MSG) {
          lastErrorRef.current = OUT_OF_SCOPE_MSG
          setError(OUT_OF_SCOPE_MSG)
        }
        return
      }
      void safeStop(scanner).then(() => {
        if (target.kind === 'token') onDetectedTokenRef.current?.(target.token)
        else onDetectedRef.current(target.boothId)
      })
    }

    const startWith = (videoConstraints: CameraVideoConstraints) =>
      scanner.start(
        // 第 1 引数は 1 キーのみ受け付ける（html5-qrcode の仕様）。解像度・フォーカスは
        // 設定側の videoConstraints で渡す。その場合の facingMode は videoConstraints 側が使われる
        { facingMode: 'environment' },
        {
          fps: SCAN_FPS,
          videoConstraints,
        },
        onDecoded,
        () => {
          /* 毎フレームのデコード失敗。何もしない */
        },
      )

    const attempt = () =>
      startWith(FULL_CAMERA_CONSTRAINTS).catch((err: unknown) => {
        // 解像度・フォーカスの制約が通らない端末向け。制約を落として 1 回だけ再試行する
        if (isOverconstrainedError(err) && !life.cancelled) return startWith(BASIC_CAMERA_CONSTRAINTS)
        throw err
      })

    let started: Promise<unknown>
    try {
      started = handoffPending
        ? cameraHandoff.then(() => (life.cancelled ? undefined : attempt()))
        : attempt()
    } catch (err) {
      started = Promise.reject(err)
    }
    startPromiseRef.current = started

    const stallTimer = window.setTimeout(() => {
      if (!life.cancelled) setStalled(true)
    }, START_STALL_MS)

    started
      .then(() => {
        if (life.cancelled) return
        window.clearTimeout(stallTimer)
        setStalled(false)
        setPhase('running')
        markCameraStarted()
      })
      .catch((err: unknown) => {
        window.clearTimeout(stallTimer)
        if (life.cancelled) return
        const kind = classifyCameraError(err)
        console.warn('[checkin-qr] start failed:', kind, err instanceof Error ? err.message : String(err))
        setStalled(false)
        setFailure(kind)
        setPhase('failed')
      })
      .finally(() => {
        startingRef.current = false
      })
  }, [safeStop])

  useEffect(() => {
    const life = { cancelled: false }
    lifeRef.current = life
    startPromiseRef.current = null
    startingRef.current = false
    const local = new Html5Qrcode(readerId, {
      verbose: false,
      // 検出器は BarcodeDetector（OS のハードウェア検出器）を優先する。
      // 現行の html5-qrcode は未指定でも優先するが、既定が変わっても標準カメラ並みの検出器を使い続けるよう明示する（issue #167）
      useBarCodeDetectorIfSupported: true,
    })
    scannerRef.current = local

    void (async () => {
      // getUserMedia 自体が無い（アプリ内ブラウザ等）。起動を試みても理由が分からないまま固まるので先に案内する
      if (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
        if (!life.cancelled) {
          setFailure('unsupported')
          setPhase('failed')
        }
        return
      }
      // 起動前に拒否済みと分かれば、カメラを起動せずに案内を直接出す（issue #171）
      if (await isCameraPermissionDenied()) {
        if (!life.cancelled) {
          setFailure('denied')
          setPhase('failed')
        }
        return
      }
      // このセッションで起動に成功済みなら、ボタンを挟まず自動起動に戻す
      if (!life.cancelled && hasCameraStartedThisSession()) startCamera()
    })()

    return () => {
      life.cancelled = true
      const started = startPromiseRef.current
      // 起動していなければ止めるものが無い。起動していれば、次の読み取り画面はこの停止が終わるまで起動を待つ
      if (started) setHandoff(Promise.resolve(started).catch(() => undefined).then(() => safeStop(local)))
      else void safeStop(local)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showFallbackLink = Boolean(error) || fallbackVisible || stalled

  return (
    <div className="checkin-qr-scan-view">
      {inAppBrowser ? (
        <div className="checkin-error-box mb-3" data-testid="in-app-browser-notice">
          <p className="mb-2 small">
            メールアプリ内のブラウザではカメラを使えないことがあります。Safari / Chrome で開き直してください。
          </p>
          <CopyButton text={typeof window === 'undefined' ? '' : window.location.href} label="このページの URL をコピー" />
        </div>
      ) : null}

      <h2 className="result-title">{phase === 'running' ? 'QRコードをかざしてください' : 'QRコードを読み取る'}</h2>
      <div className="checkin-qr-reader-wrap">
        <div id={readerId} className="checkin-qr-reader" />
        {phase === 'running' ? <div className="checkin-qr-reader-guide" aria-hidden="true" /> : null}
        {phase !== 'running' ? (
          <div className="checkin-qr-reader-overlay" aria-live="polite">
            {phase === 'starting' ? 'カメラを起動しています…' : null}
          </div>
        ) : null}
      </div>

      {phase === 'idle' ? (
        <div className="d-grid gap-2">
          <button type="button" className="btn btn-primary btn-lg" onClick={startCamera}>
            カメラを起動する
          </button>
          {onManualCode ? (
            <button type="button" className="btn btn-outline-dark btn-lg" onClick={onManualCode}>
              コードを入力してチェックイン
            </button>
          ) : null}
          <button type="button" className="btn btn-outline-secondary" onClick={onFallback}>
            ブース一覧から選ぶ
          </button>
        </div>
      ) : null}

      {phase === 'starting' && stalled ? (
        <div data-testid="camera-stalled">
          <p className="checkin-error-box">
            カメラの起動に時間がかかっています。使えない場合は、下の方法でチェックインできます。
          </p>
          <div className="d-grid gap-2">
            {onManualCode ? (
              <button type="button" className="btn btn-outline-dark btn-lg" onClick={onManualCode}>
                コードを入力してチェックイン
              </button>
            ) : null}
            <button type="button" className="btn btn-outline-secondary" onClick={onFallback}>
              ブース一覧から選ぶ
            </button>
          </div>
        </div>
      ) : null}

      {phase === 'failed' && failure ? (
        <CameraTroubleshoot
          failure={failure}
          platform={platform}
          onManualCode={onManualCode}
          onFallback={onFallback}
          onRetry={() => {
            startingRef.current = false
            startCamera()
          }}
        />
      ) : null}

      {phase === 'running' || phase === 'starting' ? (
        <>
          {error ? <p className="checkin-error-box">{error}</p> : null}
          {phase === 'running' && showFallbackLink ? (
            <button type="button" className="checkin-qr-fallback-link" onClick={onFallback}>
              ブース一覧から選ぶ
            </button>
          ) : null}
          {phase === 'running' && onManualCode ? (
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
        </>
      ) : null}
    </div>
  )
}
