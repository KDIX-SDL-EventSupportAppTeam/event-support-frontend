import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { BingoCard, BingoCell } from '@/shared/types/bingoCard'

const { bingoGuideMessage, nextReleasedCount, pendingPresurveyCell } = await import(
  '@/features/home/components/bingo/bingoGuideMessage'
)

const cardView = readFileSync(
  path.resolve(__dirname, '../../src/features/home/components/bingo/BingoCardView.tsx'),
  'utf-8',
)

const CENTER_POSITIONS = [5, 6, 9, 10]

function cell(position: number, over: Partial<BingoCell> = {}): BingoCell {
  return {
    position,
    zone: CENTER_POSITIONS.includes(position) ? 'CENTER' : 'OUTER',
    is_revealed: false,
    is_achieved: false,
    source: null,
    booth: null,
    ...over,
  }
}

const booth = (name: string) => ({ id: `b-${name}`, name, display_code: null, description: '' })

function card(over: {
  centerAchieved: number
  centerTotal?: number
  presurvey?: { achieved: boolean; name?: string | null }
}): BingoCard {
  const cells = Array.from({ length: 16 }, (_, i) => cell(i))
  if (over.presurvey) {
    cells[5] = cell(5, {
      is_revealed: true,
      is_achieved: over.presurvey.achieved,
      source: 'PRESURVEY',
      booth: over.presurvey.name === null ? null : booth(over.presurvey.name ?? 'ロボット研究会'),
    })
  }
  return {
    card_id: 'card-1',
    rating_scale: 4,
    progress: {
      center_achieved: over.centerAchieved,
      center_total: over.centerTotal ?? 4,
      revealed_cells: 1,
      achieved_cells: over.centerAchieved,
    },
    lines_completed: 0,
    unlock_events: [],
    cells,
  }
}

describe('nextReleasedCount（unlock-pairs.md の対応表）', () => {
  it('中央の残り3・2・1マスで 2・4・6マス', () => {
    expect(nextReleasedCount(1, 4)).toBe(2)
    expect(nextReleasedCount(2, 4)).toBe(4)
    expect(nextReleasedCount(3, 4)).toBe(6)
  })

  it('1マスも埋めていないときは解放が起きないので 0', () => {
    expect(nextReleasedCount(0, 4)).toBe(0)
  })

  it('中央をすべて埋め終わったら 0', () => {
    expect(nextReleasedCount(4, 4)).toBe(0)
  })

  it('起きてはいけないこと: 中央の総数が想定と違うイベントで根拠のない数字を出す', () => {
    expect(nextReleasedCount(1, 5)).toBe(0)
    expect(nextReleasedCount(2, 3)).toBe(0)
  })
})

describe('pendingPresurveyCell', () => {
  it('未達成の事前推薦マスを返す', () => {
    const c = card({ centerAchieved: 1, presurvey: { achieved: false } })
    expect(pendingPresurveyCell(c.cells)?.position).toBe(5)
  })

  it('達成済みなら返さない', () => {
    const c = card({ centerAchieved: 1, presurvey: { achieved: true } })
    expect(pendingPresurveyCell(c.cells)).toBeNull()
  })
})

describe('bingoGuideMessage', () => {
  it('事前推薦マスが未達成なら名指しで薦める（おすすめだと読める）', () => {
    const msg = bingoGuideMessage(card({ centerAchieved: 3, presurvey: { achieved: false } }))
    expect(msg).toContain('おすすめ')
    expect(msg).toContain('ロボット研究会')
  })

  it('残り1マスのとき、埋めると6マス開くことを数字で出す', () => {
    expect(bingoGuideMessage(card({ centerAchieved: 3, presurvey: { achieved: false } }))).toContain('6マス')
    expect(bingoGuideMessage(card({ centerAchieved: 3, presurvey: { achieved: true } }))).toContain('6マス')
  })

  it('残り2マス・3マスでも対応表どおりの数字を出す', () => {
    expect(bingoGuideMessage(card({ centerAchieved: 2, presurvey: { achieved: true } }))).toContain('4マス')
    expect(bingoGuideMessage(card({ centerAchieved: 1, presurvey: { achieved: true } }))).toContain('2マス')
  })

  it('中央を埋め終わったら開いたマスへの導線を出す', () => {
    expect(bingoGuideMessage(card({ centerAchieved: 4, presurvey: { achieved: true } }))).toBe(
      '開いたマスのブースに行ってみよう',
    )
  })

  it('何も埋まっていないときは従来どおり周遊を促す', () => {
    expect(bingoGuideMessage(card({ centerAchieved: 0 }))).toBe('気になるブースを回ってみよう')
  })

  it('起きてはいけないこと: 誘導文が空になる', () => {
    for (const achieved of [0, 1, 2, 3, 4]) {
      for (const presurvey of [undefined, { achieved: false }, { achieved: true }, { achieved: false, name: null }]) {
        expect(bingoGuideMessage(card({ centerAchieved: achieved, presurvey })).length).toBeGreaterThan(0)
      }
    }
  })

  it('起きてはいけないこと: 1行に収まらない長さになる（375px 幅）', () => {
    for (const achieved of [0, 1, 2, 3, 4]) {
      const msg = bingoGuideMessage(card({ centerAchieved: achieved, presurvey: { achieved: false } }))
      expect(msg).not.toContain('\n')
      expect(msg.length).toBeLessThanOrEqual(34)
    }
  })
})

describe('BingoCardView（issue #147）', () => {
  it('進捗の数値表示（中央 x/y ・ 開放nマス ・ 達成nマス ・ ビンゴn本）が無い', () => {
    expect(cardView).not.toContain('bingo-progress ')
    expect(cardView).not.toContain('progress.revealed_cells')
    expect(cardView).not.toContain('progress.achieved_cells')
    expect(cardView).not.toContain('progress.center_total')
  })

  it('起きてはいけないこと: 誘導文の1行まで消える', () => {
    expect(cardView).toContain('bingo-unlock-guide')
    expect(cardView).toContain('{guideMessage}')
  })

  it('BingoProgressStepper は残っている', () => {
    expect(cardView).toContain('<BingoProgressStepper')
  })

  it('評価導線（canRate / isRated）が壊れていない', () => {
    expect(cardView).toContain('const canRate =')
    expect(cardView).toContain('const isRated =')
  })
})
