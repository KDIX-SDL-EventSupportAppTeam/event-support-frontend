import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { parseQrToBoothId } from '@/features/checkin/lib/parseQrToBoothId'

type Props = {
  onDetected: (boothId: string) => void
  onFallback: () => void
}

const CAMERA_FAILED_MSG = 'カメラを起動できませんでした。下の「ブース一覧から選ぶ」から進めます。'
const OUT_OF_SCOPE_MSG = 'このQRコードは読み取れませんでした。もう一度かざすか、ブース一覧から選んでください。'

export function CheckInQrScanView({ onDetected, onFallback }: Props) {
  const [error, setError] = useState<string | null>(null)

  const handledRef = useRef(false)
  const lastErrorRef = useRef<string | null>(null)

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

    const local = new Html5Qrcode('checkin-qr-reader', { verbose: false })
    const startPromise = local
      .start(
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
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn('[checkin-qr] start failed:', msg)
        setError(CAMERA_FAILED_MSG)
      })

    return () => {
      void Promise.resolve(startPromise).then(() => safeStop(local))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="checkin-qr-scan-view">
      <h2 className="result-title">QRコードをかざしてください</h2>
      <div id="checkin-qr-reader" className="checkin-qr-reader" />
      {error ? <p className="checkin-error-box">{error}</p> : null}
      <button type="button" className="checkin-qr-fallback-link" onClick={onFallback}>
        ブース一覧から選ぶ
      </button>
    </div>
  )
}
