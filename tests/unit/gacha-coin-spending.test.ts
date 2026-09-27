import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ApiError } from '@/shared/api/unwrap'
import { NO_COINS_AVAILABLE, GACHA_DISABLED, type GachaUseResult } from '@/features/gachapon/api/gachaClient'

const {
  buildIdempotencyKeys,
  clampCoinCount,
  spendCoins,
  spendResultMessage,
  usedCoinLabel,
} = await import('@/features/gachapon/lib/coinSpending')

const src = (p: string) => readFileSync(path.resolve(__dirname, '../../src', p), 'utf-8')
const usePage = src('features/gachapon/pages/GachaponUsePage.tsx')

/** 台帳方式のサーバーを模す: 使えるのは `available` 枚まで。冪等キーは成立済みを返す。 */
function fakeServer(available: number) {
  const byKey = new Map<string, GachaUseResult>()
  const calls: string[] = []
  let used = 0
  return {
    calls,
    get ledgerSize() {
      return used
    },
    useCoin: async (idempotencyKey: string): Promise<GachaUseResult> => {
      calls.push(idempotencyKey)
      const already = byKey.get(idempotencyKey)
      if (already) return already // 再送は「成立済み」として同じ結果を返す（200）
      if (used >= available) throw new ApiError(NO_COINS_AVAILABLE, '使用できるコインがありません')
      const result: GachaUseResult = {
        is_enabled: true,
        lines_completed: 4,
        earned: available,
        used: used + 1,
        available: available - used - 1,
        max_coins: 4,
        coin_index: used,
        used_at: `2026-09-28T10:0${used}:00.000Z`,
      }
      used += 1
      byKey.set(idempotencyKey, result)
      return result
    },
  }
}

describe('buildIdempotencyKeys', () => {
  it('操作ID + ":" + 通し番号（1 起点）', () => {
    expect(buildIdempotencyKeys('op', 2)).toEqual(['op:1', 'op:2'])
  })

  it('同じ操作IDと同じ枚数なら同じキー列になる（再試行で枚数が増えない）', () => {
    expect(buildIdempotencyKeys('op', 3)).toEqual(buildIdempotencyKeys('op', 3))
  })

  it('起きてはいけないこと: キーが重複する（1リクエストぶんしか成立しなくなる）', () => {
    const keys = buildIdempotencyKeys('op', 4)
    expect(new Set(keys).size).toBe(4)
  })
})

describe('clampCoinCount', () => {
  it('1 〜 available に収める（上限はサーバーが返した available）', () => {
    expect(clampCoinCount(0, 4)).toBe(1)
    expect(clampCoinCount(5, 4)).toBe(4)
    expect(clampCoinCount(2, 4)).toBe(2)
  })

  it('available が0なら0（使用ボタンを出さない状態）', () => {
    expect(clampCoinCount(2, 0)).toBe(0)
  })
})

describe('spendCoins', () => {
  it('2枚指定すると1枚消費 API を2回、別の冪等キーで逐次呼ぶ', async () => {
    const server = fakeServer(4)
    const out = await spendCoins({ count: 2, operationId: 'op', useCoin: server.useCoin })
    expect(server.calls).toEqual(['op:1', 'op:2'])
    expect(server.ledgerSize).toBe(2)
    expect(out.summary?.used_count).toBe(2)
    expect(out.summary?.coin_indexes).toEqual([0, 1])
    expect(out.summary?.available).toBe(2)
  })

  it('二度押ししても消費枚数が指定枚数を超えない（冪等キーが効く）', async () => {
    const server = fakeServer(4)
    await spendCoins({ count: 2, operationId: 'op', useCoin: server.useCoin })
    const second = await spendCoins({ count: 2, operationId: 'op', useCoin: server.useCoin })
    expect(server.ledgerSize).toBe(2)
    expect(second.summary?.used_count).toBe(2)
  })

  it('2枚目で 409 になったら、1枚目は成立したまま止まる', async () => {
    const server = fakeServer(1)
    const out = await spendCoins({ count: 2, operationId: 'op', useCoin: server.useCoin })
    expect(out.stoppedByNoCoins).toBe(true)
    expect(out.summary?.used_count).toBe(1)
    expect(out.summary?.requested).toBe(2)
    expect(server.ledgerSize).toBe(1)
  })

  it('起きてはいけないこと: 成立した分をロールバックする／0枚として扱う', async () => {
    const server = fakeServer(1)
    const out = await spendCoins({ count: 3, operationId: 'op', useCoin: server.useCoin })
    expect(out.summary).not.toBeNull()
    expect(out.summary?.used_count).toBe(1)
  })

  it('409 以外のエラーは error として返し、成立分は保つ', async () => {
    let n = 0
    const out = await spendCoins({
      count: 2,
      operationId: 'op',
      useCoin: async () => {
        n += 1
        if (n === 1) {
          return {
            is_enabled: true,
            lines_completed: 4,
            earned: 4,
            used: 1,
            available: 3,
            max_coins: 4,
            coin_index: 0,
            used_at: '2026-09-28T10:00:00.000Z',
          }
        }
        throw new ApiError(GACHA_DISABLED, 'ガチャを停止しています')
      },
    })
    expect(out.stoppedByNoCoins).toBe(false)
    expect(out.error).toBeInstanceOf(ApiError)
    expect(out.summary?.used_count).toBe(1)
  })

  it('1枚目から 409 のときは summary が null（既存のエラー表示に落ちる）', async () => {
    const server = fakeServer(0)
    const out = await spendCoins({ count: 1, operationId: 'op', useCoin: server.useCoin })
    expect(out.summary).toBeNull()
    expect(out.stoppedByNoCoins).toBe(true)
  })
})

describe('結果の文言（成立枚数に基づく）', () => {
  const summary = (requested: number, used: number) => ({
    requested,
    used_count: used,
    coin_indexes: Array.from({ length: used }, (_, i) => i),
    used_at: '2026-09-28T10:00:00.000Z',
    available: 0,
  })

  it('全枚数成立', () => {
    expect(spendResultMessage(summary(2, 2))).toBe('2枚使いました')
  })

  it('一部成立', () => {
    expect(spendResultMessage(summary(3, 2))).toBe('2枚使えました。残り1枚は使えませんでした。')
  })

  it('使用したコインの通し番号（1枚・複数枚）', () => {
    expect(usedCoinLabel(summary(1, 1))).toBe('1枚目')
    expect(usedCoinLabel(summary(2, 2))).toBe('1・2枚目（計2枚）')
  })
})

describe('使用確認画面（issue #150）', () => {
  it('上限判定に MAX_GACHAPON_COINS を使っていない（import もしていない）', () => {
    expect(usePage).not.toContain("from '@/shared/config/gachapon'")
    // JSDoc の「使わない」という記述以外に登場しないこと
    expect(usePage.split('MAX_GACHAPON_COINS').length - 1).toBe(1)
    expect(usePage).toContain('clampCoinCount(next, coins.available)')
  })

  it('確認は1段のまま（モーダルを重ねていない）', () => {
    expect(usePage).not.toContain('Modal')
  })

  it('取り消せない旨を確認画面に出している', () => {
    expect(usePage).toContain('使用後は取り消せません')
  })

  it('ボタンのラベルに枚数が出る／押下直後は「使用中…」', () => {
    expect(usePage).toContain('`${count}枚使う`')
    expect(usePage).toContain('使用中…')
  })

  it('枚数を変えたら操作IDを作り直す', () => {
    expect(usePage).toContain('setOperationId(crypto.randomUUID())')
  })

  it('完了画面へは履歴を置換して遷移する', () => {
    expect(usePage).toContain("navigate('/gachapon/complete', { replace: true, state: summary })")
  })

  it('起きてはいけないこと: GACHA_DISABLED の既存表示が消える', () => {
    expect(usePage).toContain('GACHA_DISABLED')
    expect(usePage).toContain('コインは無くなりません')
  })

  it('起きてはいけないこと: 並行に投げる（coin_index が競合する）', () => {
    expect(usePage).not.toContain('Promise.all')
  })
})
