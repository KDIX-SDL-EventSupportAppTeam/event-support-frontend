/**
 * カメラ映像のうち画面に見えている範囲を、カメラの元解像度のまま切り出して QR をデコードする。
 *
 * html5-qrcode はデコード用 canvas を「プレビューの表示サイズ（CSS px）」で作り、映像全体をそこへ縮める。
 * 正方形のプレビュー（object-fit: cover）に縦長の映像を出すと、デコード画像が 1/15 程度の画素数になり、
 * さらに縦横比もつぶれる（iPhone 実測: 1080×1920 → 362×366）。そのためデコードだけをここで行う。
 *
 * 検出器は OS の BarcodeDetector があればそれを使い、無ければ zxing-cpp の WASM 版（barcode-detector）を使う。
 */

type Detector = { detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>> }

/** 切り出した画像の長辺の上限。これを超える端末は縮小する（1 フレームのデコード時間を抑える） */
const MAX_DECODE_SIDE = 1280

export type DetectorKind = 'native' | 'wasm'

let detectorPromise: Promise<{ detector: Detector; kind: DetectorKind }> | null = null

async function hasNativeQrDetector(): Promise<boolean> {
  const Native = (globalThis as { BarcodeDetector?: { getSupportedFormats(): Promise<string[]> } }).BarcodeDetector
  if (!Native) return false
  try {
    return (await Native.getSupportedFormats()).includes('qr_code')
  } catch {
    return false
  }
}

/** 検出器を用意する。WASM（約 1MB）は必要な端末でだけ、自前の配信元から読み込む */
export function loadQrDetector(): Promise<{ detector: Detector; kind: DetectorKind }> {
  detectorPromise ??= (async () => {
    if (await hasNativeQrDetector()) {
      const Native = (globalThis as unknown as { BarcodeDetector: new (o: { formats: string[] }) => Detector })
        .BarcodeDetector
      return { detector: new Native({ formats: ['qr_code'] }), kind: 'native' as const }
    }
    const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
      import('barcode-detector/ponyfill'),
      import('zxing-wasm/reader/zxing_reader.wasm?url'),
    ])
    // 既定は jsDelivr から取得する。会場回線や CDN 障害に左右されないよう、ビルドに含めた .wasm を使う
    prepareZXingModule({
      overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) },
    })
    return { detector: new BarcodeDetector({ formats: ['qr_code'] }), kind: 'wasm' as const }
  })()
  detectorPromise.catch(() => {
    detectorPromise = null
  })
  return detectorPromise
}

/** `object-fit: cover` で表示されている部分を、映像の座標系で返す */
export function visibleSourceRect(
  videoWidth: number,
  videoHeight: number,
  clientWidth: number,
  clientHeight: number,
): { sx: number; sy: number; sw: number; sh: number } {
  if (!clientWidth || !clientHeight) return { sx: 0, sy: 0, sw: videoWidth, sh: videoHeight }
  const scale = Math.max(clientWidth / videoWidth, clientHeight / videoHeight)
  const sw = Math.min(videoWidth, clientWidth / scale)
  const sh = Math.min(videoHeight, clientHeight / scale)
  return { sx: (videoWidth - sw) / 2, sy: (videoHeight - sh) / 2, sw, sh }
}

/**
 * `video` の表示範囲を毎フレームデコードし、読めたら `onText` を呼ぶ。前のデコードが終わってから次を始める。
 * 戻り値で停止する。
 */
export function startFrameQrDecode(
  video: HTMLVideoElement,
  onText: (text: string) => void,
  options: { fps: number },
): () => void {
  let stopped = false
  let timer: number | undefined
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const interval = 1000 / options.fps

  const tick = async (detector: Detector) => {
    if (stopped || !ctx) return
    const started = performance.now()
    if (video.readyState >= 2 && video.videoWidth > 0) {
      const { sx, sy, sw, sh } = visibleSourceRect(video.videoWidth, video.videoHeight, video.clientWidth, video.clientHeight)
      const ratio = Math.min(1, MAX_DECODE_SIDE / Math.max(sw, sh))
      const w = Math.round(sw * ratio)
      const h = Math.round(sh * ratio)
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h)
      try {
        const found = await detector.detect(canvas)
        if (!stopped && found.length > 0 && found[0].rawValue) onText(found[0].rawValue)
      } catch {
        /* 1 フレームの失敗は無視して次へ */
      }
    }
    if (!stopped) timer = window.setTimeout(() => void tick(detector), Math.max(0, interval - (performance.now() - started)))
  }

  void loadQrDetector()
    .then(({ detector }) => void tick(detector))
    .catch((err: unknown) => {
      // 検出器が用意できなくても html5-qrcode 側の読み取りは動き続ける
      console.warn('[checkin-qr] frame decoder unavailable:', err instanceof Error ? err.message : String(err))
    })

  return () => {
    stopped = true
    window.clearTimeout(timer)
  }
}
