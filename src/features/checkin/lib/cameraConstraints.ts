/**
 * QR リーダーのカメラ制約（issue #167）。
 *
 * 標準カメラアプリに読み取り精度で負ける原因は、解像度とフォーカスの指定が無いこと。
 * 端末既定（640×480 相当）だと QR が小さく写り、ピントが合わないまま走り続ける。
 */

/** `focusMode` は W3C の標準外（Media Capture の拡張）で TypeScript の型に無い。型を拡張して扱う。 */
export type CameraVideoConstraints = MediaTrackConstraints & {
  focusMode?: 'continuous' | 'single-shot' | 'manual'
}

/** 高精度の要求。`ideal` なので満たせなくても通常は失敗しないが、`focusMode` で Overconstrained になる端末がある。 */
export const FULL_CAMERA_CONSTRAINTS: CameraVideoConstraints = {
  facingMode: 'environment',
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  focusMode: 'continuous',
}

/** 再試行用の最小要求。 */
export const BASIC_CAMERA_CONSTRAINTS: CameraVideoConstraints = {
  facingMode: 'environment',
}

/**
 * 読み取り枠の大きさ。枠は「目安」でデコード範囲を絞る目的では使わないため、短辺の 90% にする
 * （クロップはデコード対象領域を狭めるので、狭いほど枠に収めきれていない QR を取り逃がす）。
 */
export const QRBOX_RATIO = 0.9

export function qrboxSize(viewfinderWidth: number, viewfinderHeight: number): { width: number; height: number } {
  const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * QRBOX_RATIO)
  return { width: size, height: size }
}

export const SCAN_FPS = 15
