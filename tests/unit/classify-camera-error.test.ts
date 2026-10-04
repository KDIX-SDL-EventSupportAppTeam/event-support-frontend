import { describe, expect, it } from 'vitest'
import { classifyCameraError, isOverconstrainedError } from '@/features/checkin/lib/classifyCameraError'
import {
  BASIC_CAMERA_CONSTRAINTS,
  FULL_CAMERA_CONSTRAINTS,
  QRBOX_RATIO,
  qrboxSize,
} from '@/features/checkin/lib/cameraConstraints'

/** DOMException 相当（node 環境でも name だけで判定できることを確かめる） */
const named = (name: string) => Object.assign(new Error('msg'), { name })

describe('classifyCameraError（issue #171）', () => {
  it('name で分類する（message の文言には依存しない）', () => {
    expect(classifyCameraError(named('NotAllowedError'))).toBe('denied')
    expect(classifyCameraError(named('SecurityError'))).toBe('denied')
    expect(classifyCameraError(named('NotFoundError'))).toBe('not_found')
    expect(classifyCameraError(named('DevicesNotFoundError'))).toBe('not_found')
    expect(classifyCameraError(named('NotReadableError'))).toBe('in_use')
    expect(classifyCameraError(named('TrackStartError'))).toBe('in_use')
  })

  it('name が同じなら message が日本語でも英語でも同じ結果', () => {
    const ja = Object.assign(new Error('許可されていません'), { name: 'NotAllowedError' })
    const en = Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
    expect(classifyCameraError(ja)).toBe(classifyCameraError(en))
  })

  it('html5-qrcode が文字列化して reject した場合は部分一致へフォールバックする', () => {
    expect(classifyCameraError('Error getting userMedia, error = NotAllowedError: Permission denied')).toBe('denied')
    expect(classifyCameraError('Error getting userMedia, error = NotFoundError: Requested device not found')).toBe('not_found')
    expect(classifyCameraError('Error getting userMedia, error = NotReadableError: Could not start video source')).toBe('in_use')
    expect(classifyCameraError(new Error('NotAllowedError: Permission dismissed'))).toBe('denied')
  })

  it('カメラ非対応の文言は unsupported、見つからない文言は not_found', () => {
    expect(classifyCameraError('Camera streaming not supported by the browser.')).toBe('unsupported')
    expect(classifyCameraError('Requested device not found')).toBe('not_found')
  })

  it('判別できないものは unknown（null / undefined / 数値でも例外を投げない）', () => {
    expect(classifyCameraError(new Error('boom'))).toBe('unknown')
    expect(classifyCameraError(null)).toBe('unknown')
    expect(classifyCameraError(undefined)).toBe('unknown')
    expect(classifyCameraError(42)).toBe('unknown')
  })
})

describe('isOverconstrainedError（issue #167）', () => {
  it('name・文字列の両方で判定する', () => {
    expect(isOverconstrainedError(named('OverconstrainedError'))).toBe(true)
    expect(isOverconstrainedError('Error getting userMedia, error = OverconstrainedError: ')).toBe(true)
    expect(isOverconstrainedError(named('NotAllowedError'))).toBe(false)
    expect(isOverconstrainedError(null)).toBe(false)
  })
})

describe('カメラ制約（issue #167）', () => {
  it('高精度の要求は 1920×1080 ideal と連続フォーカスを含み、再試行用は facingMode だけ', () => {
    expect(FULL_CAMERA_CONSTRAINTS).toMatchObject({
      facingMode: 'environment',
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      focusMode: 'continuous',
    })
    expect(BASIC_CAMERA_CONSTRAINTS).toEqual({ facingMode: 'environment' })
  })

  it('読み取り枠は短辺の 90%', () => {
    expect(QRBOX_RATIO).toBe(0.9)
    expect(qrboxSize(400, 300)).toEqual({ width: 270, height: 270 })
    expect(qrboxSize(300, 400)).toEqual({ width: 270, height: 270 })
  })
})
