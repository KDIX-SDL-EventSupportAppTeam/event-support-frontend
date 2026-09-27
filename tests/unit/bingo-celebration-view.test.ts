import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const { resolveBingoCelebrationLines, shouldShowCoinCompleteArt } = await import(
  '@/features/home/celebration/bingoCelebrationView'
)

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

  it('専用アートが真偽値で出し分けられていない（常に出す）', () => {
    expect(bingoModalBlock).toContain('/feedback/popup-bingo-complete.png')
    expect(bingoModalBlock).not.toContain('bingoModal.complete')
  })

  it('起きてはいけないこと: コイン満タンの既読管理が外れる', () => {
    expect(homePageSource).toContain('hasSeenCoinComplete(eventId, userId)')
    expect(homePageSource).toContain('markCoinCompleteSeen(eventId, userId)')
  })
})
