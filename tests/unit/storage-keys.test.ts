import { describe, expect, it } from 'vitest'
import {
  LAST_EVENT_ID_KEY,
  NS,
  ORGANIZER_TOKEN_KEY,
  STORAGE_VERSION,
  TOKEN_KEY,
  USER_KEY,
  eventScopedKey,
  purgeEventScopedKeys,
  purgeOutdatedStorage,
  sessionKey,
  sweepOwnKeys,
} from '@/shared/config/storageKeys'

/** Storage の最小フェイク（node 環境には localStorage が無い）。 */
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(initial))
  return {
    get length() {
      return m.size
    },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  }
}

const keysOf = (s: Storage) => Array.from({ length: s.length }, (_, i) => s.key(i)!).sort()

describe('キー規約（issue #172）', () => {
  it('すべての自前キーが NS で始まり、版付きキーは現行版を含む', () => {
    for (const k of [TOKEN_KEY, USER_KEY, ORGANIZER_TOKEN_KEY, LAST_EVENT_ID_KEY]) {
      expect(k.startsWith(NS)).toBe(true)
    }
    for (const k of [TOKEN_KEY, USER_KEY, ORGANIZER_TOKEN_KEY]) {
      expect(k).toContain(`:v${STORAGE_VERSION}:`)
    }
    expect(LAST_EVENT_ID_KEY).not.toMatch(/:v\d+:/)
    expect(eventScopedKey('e1', 'u1', 'x')).toBe('esa:event:e1:user:u1:x')
    expect(sessionKey('a')).toBe('esa:session:a')
  })
})

describe('purgeOutdatedStorage', () => {
  it('古い版の token / user を消し、現行版・版なしキー（last-event-id・既読フラグ）は残す', () => {
    const ls = fakeStorage({
      'esa:v0:participant:token': 'old',
      'esa:v0:participant:user': 'old',
      'esa:v999:participant:token': 'future',
      [TOKEN_KEY]: 'current',
      [LAST_EVENT_ID_KEY]: 'e1',
      [eventScopedKey('e1', 'u1', 'coin-complete-seen')]: 'true',
      'other-app-key': 'x',
    })
    purgeOutdatedStorage([ls])
    expect(keysOf(ls)).toEqual(
      [TOKEN_KEY, LAST_EVENT_ID_KEY, eventScopedKey('e1', 'u1', 'coin-complete-seen'), 'other-app-key'].sort(),
    )
  })

  it('規約導入前の旧キーを掃除する（他アプリのキーは触らない）', () => {
    const ls = fakeStorage({
      token: 't',
      auth_user: 'u',
      last_event_id: 'e',
      organizer_auth_token: 't',
      coinCompleteSeen_e1_u1: 'true',
      surveyOpened_e1_u1: 'true',
      theme: 'dark',
    })
    const ss = fakeStorage({ newlyCompletedLines: '1', es_bingo_unlock_played_c1: '1', es_sample_votes_u1: '{}' })
    purgeOutdatedStorage([ls, ss])
    expect(keysOf(ls)).toEqual(['theme'])
    expect(keysOf(ss)).toEqual([])
  })

  it('STORAGE_VERSION を上げた想定: 現行版が「古い版」になり token/user だけ消える', () => {
    // 版 N+1 のコードから見ると、現行(N)のキーは古い版。同じ形のキーを v(N-1) として検証する
    const ls = fakeStorage({
      [`esa:v${STORAGE_VERSION - 1}:participant:token`]: 'old',
      [LAST_EVENT_ID_KEY]: 'e1',
      [eventScopedKey('e1', 'u1', 'survey-opened')]: 'true',
    })
    purgeOutdatedStorage([ls])
    expect(keysOf(ls)).toEqual([LAST_EVENT_ID_KEY, eventScopedKey('e1', 'u1', 'survey-opened')].sort())
  })

  it('ストレージが例外を投げても黙って諦める', () => {
    const broken = {
      get length(): number {
        throw new Error('denied')
      },
    } as unknown as Storage
    expect(() => purgeOutdatedStorage([broken])).not.toThrow()
  })
})

describe('purgeEventScopedKeys', () => {
  it('指定イベントの痕跡だけを消す', () => {
    const ls = fakeStorage({
      [eventScopedKey('e1', 'u1', 'coin-complete-seen')]: 'true',
      [eventScopedKey('e1', 'u2', 'survey-opened')]: 'true',
      [eventScopedKey('e2', 'u1', 'survey-opened')]: 'true',
      [TOKEN_KEY]: 't',
    })
    purgeEventScopedKeys('e1', [ls])
    expect(keysOf(ls)).toEqual([eventScopedKey('e2', 'u1', 'survey-opened'), TOKEN_KEY].sort())
  })

  it('eventId が空なら何も消さない', () => {
    const ls = fakeStorage({ [eventScopedKey('e1', 'u1', 'x')]: '1' })
    purgeEventScopedKeys('', [ls])
    expect(ls.length).toBe(1)
  })
})

describe('sweepOwnKeys', () => {
  it('削除しながら列挙してもインデックスがずれない', () => {
    const ls = fakeStorage({ a1: '', a2: '', a3: '', b1: '' })
    sweepOwnKeys(ls, (k) => k.startsWith('a'))
    expect(keysOf(ls)).toEqual(['b1'])
  })
})
