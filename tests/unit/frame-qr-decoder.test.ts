import { describe, expect, it } from 'vitest'
import { visibleSourceRect } from '@/features/checkin/lib/frameQrDecoder'

describe('visibleSourceRect', () => {
  it('縦長の映像を正方形に cover 表示したとき、見えている中央部分を元解像度で返す（iPhone 実測値）', () => {
    const r = visibleSourceRect(1080, 1920, 362, 366)
    expect(r.sw).toBe(1080)
    expect(r.sh).toBeCloseTo(1092, 0)
    expect(r.sx).toBe(0)
    expect(r.sy).toBeCloseTo((1920 - 1092) / 2, 0)
  })

  it('横長の映像を縦長に表示したときは左右を切る', () => {
    const r = visibleSourceRect(1920, 1080, 300, 600)
    expect(r.sh).toBe(1080)
    expect(r.sw).toBe(540)
    expect(r.sx).toBe(690)
    expect(r.sy).toBe(0)
  })

  it('縦横比が同じなら全体を返す', () => {
    expect(visibleSourceRect(1280, 720, 640, 360)).toEqual({ sx: 0, sy: 0, sw: 1280, sh: 720 })
  })

  it('表示サイズが取れないときは映像全体を返す', () => {
    expect(visibleSourceRect(1080, 1920, 0, 0)).toEqual({ sx: 0, sy: 0, sw: 1080, sh: 1920 })
  })
})
