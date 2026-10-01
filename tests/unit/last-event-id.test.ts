import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LAST_EVENT_ID_KEY } from '@/shared/config/storageKeys'
import {
  LAST_EVENT_TTL_MS,
  clearLastEventId,
  entryPathForRedirect,
  readLastEventId,
  rememberEventId,
} from '@/shared/lib/lastEventId'

const DAY = 24 * 60 * 60 * 1000

function stubLocalStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  })
  return m
}

describe('lastEventId の TTL（issue #173）', () => {
  let store: Map<string, string>
  beforeEach(() => {
    store = stubLocalStorage()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('保存して読み戻せる', () => {
    rememberEventId('e1', 1_000)
    expect(readLastEventId(1_000)).toBe('e1')
  })

  it('6 日後は有効、8 日後は null を返してキーを削除する', () => {
    rememberEventId('e1', 0)
    expect(readLastEventId(6 * DAY)).toBe('e1')
    expect(store.has(LAST_EVENT_ID_KEY)).toBe(true)

    expect(readLastEventId(8 * DAY)).toBeNull()
    expect(store.has(LAST_EVENT_ID_KEY)).toBe(false)
  })

  it('境界: ちょうど TTL は有効、1ms 過ぎたら無効', () => {
    rememberEventId('e1', 0)
    expect(readLastEventId(LAST_EVENT_TTL_MS)).toBe('e1')
    expect(readLastEventId(LAST_EVENT_TTL_MS + 1)).toBeNull()
  })

  it('踏み直すと保存日時が更新され、有効期間は最後に踏んだ時刻から数える', () => {
    rememberEventId('e1', 0)
    rememberEventId('e1', 5 * DAY)
    expect(readLastEventId(10 * DAY)).toBe('e1')
  })

  it('旧形式（素の文字列）が残っていても例外を投げず null を返し、キーを削除する', () => {
    store.set(LAST_EVENT_ID_KEY, '20000000-0000-4000-8000-000000000001')
    expect(readLastEventId()).toBeNull()
    expect(store.has(LAST_EVENT_ID_KEY)).toBe(false)
  })

  it('形が壊れた JSON でも null を返す', () => {
    for (const raw of ['null', '{}', '{"eventId":"e1"}', '{"eventId":1,"savedAt":0}', '[1]']) {
      store.set(LAST_EVENT_ID_KEY, raw)
      expect(readLastEventId(0)).toBeNull()
    }
  })

  it('clearLastEventId でキーが消える', () => {
    rememberEventId('e1')
    clearLastEventId()
    expect(readLastEventId()).toBeNull()
  })

  it('entryPathForRedirect: 有効な控えがあれば配布リンク、無ければ /e', () => {
    expect(entryPathForRedirect()).toBe('/e')
    rememberEventId('e1')
    expect(entryPathForRedirect()).toBe('/e/e1')
  })

  it('空の eventId は保存しない', () => {
    rememberEventId('')
    expect(store.size).toBe(0)
  })
})

describe('localStorage が使えない環境', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('例外を投げず null / /e を返す', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
      removeItem: () => {
        throw new Error('denied')
      },
    })
    expect(() => rememberEventId('e1')).not.toThrow()
    expect(readLastEventId()).toBeNull()
    expect(entryPathForRedirect()).toBe('/e')
  })
})
