import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const { resolveBingoCelebrationLines, shouldShowCoinCompleteArt, bingoCelebrationArt } = await import(
  '@/features/home/celebration/bingoCelebrationView'
)
const { BINGO_GOAL_LINES } = await import('@/shared/config/bingo')

const homePageSource = readFileSync(
  path.resolve(__dirname, '../../src/features/home/pages/HomePage/HomePage.tsx'),
  'utf-8',
)

describe('resolveBingoCelebrationLines', () => {
  it('カードの lines_completed をそのまま出す（1本目でも本数が出る）', () => {
    expect(resolveBingoCelebrationLines(1, 1)).toBe(1)
    expect(resolveBingoCelebrationLines(4, 1)).toBe(4)
  })

  it('カードが未到着ならチェックインの成立本数で代替する', () => {
    expect(resolveBingoCelebrationLines(undefined, 2)).toBe(2)
    expect(resolveBingoCelebrationLines(null, 2)).toBe(2)
  })

  it('どちらも無ければ null（本数なしの文言で開く）', () => {
    expect(resolveBingoCelebrationLines(0, 0)).toBeNull()
    expect(resolveBingoCelebrationLines(undefined, 0)).toBeNull()
  })
})

describe('bingoCelebrationArt', () => {
  it('1〜3本目は文字の入っていないライン成立バッジ', () => {
    for (const lines of [1, 2, 3]) {
      expect(bingoCelebrationArt(lines)).toEqual({ src: '/bingo/bingo-line-badge.png', isBadge: true })
    }
  })

  it('目標本数に届いたら「ビンゴコンプリート！」の一枚絵', () => {
    expect(bingoCelebrationArt(BINGO_GOAL_LINES)).toEqual({
      src: '/feedback/popup-bingo-complete.png',
      isBadge: false,
    })
    expect(bingoCelebrationArt(BINGO_GOAL_LINES + 1).src).toBe('/feedback/popup-bingo-complete.png')
  })

  it('起きてはいけないこと: 1本目に「すべてのビンゴを達成しました」の絵を出す', () => {
    expect(bingoCelebrationArt(1).src).not.toBe('/feedback/popup-bingo-complete.png')
  })

  it('起きてはいけないこと: 本数が分からないときに達成の絵を出す', () => {
    expect(bingoCelebrationArt(null).src).toBe('/bingo/bingo-line-badge.png')
  })

  it('どの本数でも必ずアートを出す（出さない分岐が無い）', () => {
    for (const lines of [null, 0, 1, 2, 3, 4, 10]) {
      expect(bingoCelebrationArt(lines).src.length).toBeGreaterThan(0)
    }
  })
})

describe('shouldShowCoinCompleteArt', () => {
  it('ビンゴ達成モーダルを出していなければコイン満タンのアートを出す', () => {
    expect(shouldShowCoinCompleteArt(false)).toBe(true)
  })

  it('起きてはいけないこと: 同じ来訪でアート付きモーダルが2枚続く', () => {
    expect(shouldShowCoinCompleteArt(true)).toBe(false)
  })
})

describe('HomePage のビンゴ達成モーダル', () => {
  const bingoModalBlock = homePageSource.slice(
    homePageSource.indexOf('{bingoModal ?'),
    homePageSource.indexOf('{coinCompleteOpen ?'),
  )

  it('ビンゴ達成モーダルの中に gachaCoins が出てこない（依存の向き ガチャ → ビンゴ の禁止）', () => {
    expect(bingoModalBlock.length).toBeGreaterThan(0)
    expect(bingoModalBlock).not.toContain('gachaCoins')
  })

  it('アートは必ず出す（出す・出さないの真偽値が無い）', () => {
    expect(bingoModalBlock).toContain('bingoCelebrationArt(bingoModal.lines)')
    expect(bingoModalBlock).not.toContain('bingoModal.complete')
  })

  it('アートの選択にガチャの上限枚数を使っていない', () => {
    expect(bingoModalBlock).not.toContain('MAX_GACHAPON_COINS')
  })

  it('起きてはいけないこと: コイン満タンの既読管理が外れる', () => {
    expect(homePageSource).toContain('hasSeenCoinComplete(eventId, userId)')
    expect(homePageSource).toContain('markCoinCompleteSeen(eventId, userId)')
  })
})
