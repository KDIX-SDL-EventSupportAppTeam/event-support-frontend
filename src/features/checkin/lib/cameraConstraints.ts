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

export const SCAN_FPS = 15
