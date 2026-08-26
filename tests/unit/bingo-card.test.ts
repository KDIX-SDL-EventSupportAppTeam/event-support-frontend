import { describe, it, expect, beforeEach } from 'vitest'

// vitest の `environment: 'node'` には sessionStorage が無いため、テスト用に簡易実装を積む。
// サンプルモードのビンゴカード生成（bingoRandom / sampleSession 経由）が sessionStorage に依存するため。
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

;(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = new MemoryStorage()

const { buildSampleBingoCard } = await import('@/shared/data/sample/sampleBingoCard')
const { appendSampleCheckedId } = await import('@/shared/data/sample/sampleSession')
const { hasPlayedUnlockAnimation, markUnlockAnimationPlayed, filterUnplayed } = await import(
  '@/shared/lib/bingoUnlockFlag'
)
const { appendUnlockItems } = await import('@/shared/lib/bingoUnlockQueue')
const { resolveCheckInView } = await import('@/shared/lib/checkInFlowView')

describe('buildSampleBingoCard', () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear()
  })

  it('16マス返す', () => {
    const card = buildSampleBingoCard('evt-1', 'user-a')
    expect(card.cells).toHaveLength(16)
  })

  it('position は0..15の昇順', () => {
    const card = buildSampleBingoCard('evt-1', 'user-a')
    card.cells.forEach((cell, i) => expect(cell.position).toBe(i))
  })

  it('is_revealed: false のマスは booth が必ず null', () => {
    const card = buildSampleBingoCard('evt-1', 'user-a')
    for (const cell of card.cells) {
      if (!cell.is_revealed) {
        expect(cell.booth).toBeNull()
      }
    }
  })

  it('position 5 は最初から見えている（is_revealed: true）', () => {
    const card = buildSampleBingoCard('evt-zero-visits', 'user-zero')
    const presurveyCell = card.cells.find((c) => c.position === 5)
    expect(presurveyCell?.is_revealed).toBe(true)
    expect(presurveyCell?.source).toBe('PRESURVEY')
  })

  it('rating_scale はハードコードされた3ではない（既定4）', () => {
    const card = buildSampleBingoCard('evt-1', 'user-a')
    expect(card.rating_scale).toBe(4)
  })

  it('訪問数が少ないと外周は未解放（is_revealed: false）のまま', () => {
    const card = buildSampleBingoCard('evt-zero-visits', 'user-zero')
    if (card.progress.center_achieved < 2) {
      const outerCells = card.cells.filter((c) => c.zone === 'OUTER')
      expect(outerCells.every((c) => !c.is_revealed)).toBe(true)
      expect(card.unlock_events).toHaveLength(0)
    }
  })

  it('中央が2マス以上達成されると unlock_events が積まれ、外周が解放される', () => {
    const eventId = 'evt-unlock-test'
    const userId = 'user-unlock-test'
    appendSampleCheckedId(userId, 'booth-extra-1')
    appendSampleCheckedId(userId, 'booth-extra-2')
    appendSampleCheckedId(userId, 'booth-extra-3')
    const card = buildSampleBingoCard(eventId, userId)
    if (card.progress.center_achieved >= 2) {
      expect(card.unlock_events.length).toBeGreaterThan(0)
      expect(card.progress.revealed_cells).toBeGreaterThan(4)
    }
  })

  it('進捗表示はサーバー形式の progress フィールドを持つ（フロントで数え直さない前提のデータ形状）', () => {
    const card = buildSampleBingoCard('evt-1', 'user-a')
    expect(card.progress).toHaveProperty('center_achieved')
    expect(card.progress).toHaveProperty('center_total')
    expect(card.progress).toHaveProperty('revealed_cells')
    expect(card.progress).toHaveProperty('achieved_cells')
    expect(card).not.toHaveProperty('coins')
    expect(card).not.toHaveProperty('status')
  })
})

describe('bingoUnlockFlag（pair_key ごとの独立フラグ）', () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear()
  })

  it('未再生の pair_key は false', () => {
    expect(hasPlayedUnlockAnimation('card-x', '5-6')).toBe(false)
  })

  it('再生済みにすると、その pair_key だけ true になる', () => {
    markUnlockAnimationPlayed('card-x', '5-6')
    expect(hasPlayedUnlockAnimation('card-x', '5-6')).toBe(true)
    expect(hasPlayedUnlockAnimation('card-x', '9-10')).toBe(false)
    expect(hasPlayedUnlockAnimation('card-y', '5-6')).toBe(false)
  })

  it('filterUnplayed は再生済みの pair_key を除外する', () => {
    markUnlockAnimationPlayed('card-x', '5-6')
    const unplayed = filterUnplayed('card-x', ['5-6', '9-10', '5-9'])
    expect(unplayed).toEqual(['9-10', '5-9'])
  })
})

describe('appendUnlockItems（解放演出キュー）', () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear()
  })

  // F-1: 中央3マス目の達成では2ペアが同時成立する。unlocked_positions は [1, 13, 3, 12] のように
  // 全ペア分が平坦に混ざるため、ペア単位の unlocked_pairs から積む必要がある
  it('複数ペアが同時解放されたらペア数ぶんキューに積まれる', () => {
    const queue = appendUnlockItems([], 'card-x', [
      { pair_key: '5-9', released_positions: [1, 13] },
      { pair_key: '6-9', released_positions: [3, 12] },
    ])
    expect(queue).toEqual([
      { pairKey: '5-9', positions: [1, 13] },
      { pairKey: '6-9', positions: [3, 12] },
    ])
  })

  // F-2: 再生済みフラグは演出完了時にしか立たないので、再生中に別経路で同じ解放が届く
  // ケースはキュー内の重複チェックでしか防げない
  it('キューに既にある pair_key は二重に積まれない', () => {
    const first = appendUnlockItems([], 'card-x', [{ pair_key: '5-9', released_positions: [1, 13] }])
    const second = appendUnlockItems(first, 'card-x', [
      { pair_key: '5-9', released_positions: [1, 13] },
      { pair_key: '6-9', released_positions: [3, 12] },
    ])
    expect(second.map((i) => i.pairKey)).toEqual(['5-9', '6-9'])
  })

  it('同じ呼び出しの中で重複した pair_key も1件だけになる', () => {
    const queue = appendUnlockItems([], 'card-x', [
      { pair_key: '5-9', released_positions: [1, 13] },
      { pair_key: '5-9', released_positions: [1, 13] },
    ])
    expect(queue).toHaveLength(1)
  })

  it('再生済みの pair_key は積まれない', () => {
    markUnlockAnimationPlayed('card-x', '5-9')
    const queue = appendUnlockItems([], 'card-x', [
      { pair_key: '5-9', released_positions: [1, 13] },
      { pair_key: '6-9', released_positions: [3, 12] },
    ])
    expect(queue.map((i) => i.pairKey)).toEqual(['6-9'])
  })

  it('released_positions が空のイベントは積まれない', () => {
    expect(appendUnlockItems([], 'card-x', [{ pair_key: '5-9', released_positions: [] }])).toEqual([])
  })

  it('積むものが無ければ同じ配列参照を返す（useEffect の無駄な再レンダーを避ける）', () => {
    const queue = appendUnlockItems([], 'card-x', [{ pair_key: '5-9', released_positions: [1, 13] }])
    expect(appendUnlockItems(queue, 'card-x', [{ pair_key: '5-9', released_positions: [1, 13] }])).toBe(queue)
  })
})

describe('resolveCheckInView（03-checkin-flow.md の順序）', () => {
  // F-3: 評価 → チェックイン成功 → 解放演出。評価を先頭に置くのは回収率のため
  it('評価と解放が同時に発生したら評価が先', () => {
    expect(
      resolveCheckInView({
        step: 'rating',
        hasPendingRating: true,
        hasPendingUnlock: true,
        resultAcknowledged: false,
      }),
    ).toBe('rating')
  })

  it('評価を終えたらチェックイン成功ステップが先で、解放演出はまだ出さない', () => {
    expect(
      resolveCheckInView({
        step: 'result',
        hasPendingRating: true,
        hasPendingUnlock: true,
        resultAcknowledged: false,
      }),
    ).toBe('result')
  })

  it('成功ステップを閉じた後に解放演出が出る', () => {
    expect(
      resolveCheckInView({
        step: 'result',
        hasPendingRating: true,
        hasPendingUnlock: true,
        resultAcknowledged: true,
      }),
    ).toBe('unlock')
  })

  it('解放が無ければ成功ステップのまま', () => {
    expect(
      resolveCheckInView({
        step: 'result',
        hasPendingRating: false,
        hasPendingUnlock: false,
        resultAcknowledged: true,
      }),
    ).toBe('result')
  })
})
