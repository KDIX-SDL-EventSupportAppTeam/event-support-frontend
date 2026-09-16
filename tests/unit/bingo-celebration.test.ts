import { beforeEach, describe, expect, it } from 'vitest'
import { consumeBingoCelebration, recordBingoCelebration } from '@/shared/lib/bingoCelebration'

// jsdom を使わない構成のため、sessionStorage の最小実装を用意する
class MemoryStorage {
  private map = new Map<string, string>()
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
  clear() {
    this.map.clear()
  }
}

beforeEach(() => {
  ;(globalThis as { sessionStorage?: unknown }).sessionStorage = new MemoryStorage()
})

describe('recordBingoCelebration / consumeBingoCelebration', () => {
  it('ライン成立時に記録し、ホーム側で1回だけ読み出せる', () => {
    recordBingoCelebration(2)
    expect(consumeBingoCelebration()).toEqual({ lines: 2 })
    // 2回目は消費済み
    expect(consumeBingoCelebration()).toEqual({ lines: 0 })
  })

  it('ライン成立が無ければ何も記録しない', () => {
    recordBingoCelebration(0)
    expect(consumeBingoCelebration()).toEqual({ lines: 0 })
  })
})
