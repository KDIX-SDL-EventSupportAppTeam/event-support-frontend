import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const {
  unlockModalMessage,
  UNLOCK_MODAL_AUTO_CLOSE_MS,
  UNLOCK_MODAL_BUTTON_ENABLE_MS,
} = await import('@/features/home/components/bingo/unlockModalCopy')

const src = (p: string) => readFileSync(path.resolve(__dirname, '../../src', p), 'utf-8')
const component = src('features/home/components/bingo/UnlockAnimation.tsx')
const copy = src('features/home/components/bingo/unlockModalCopy.ts')
const styles = src('features/home/styles/bingo-card.scss')

describe('解放通知モーダルの文言', () => {
  it('1回目・2回目・3回目のマス数がそのまま出る', () => {
    expect(unlockModalMessage(2)).toBe('2マスのブースが決まりました')
    expect(unlockModalMessage(4)).toBe('4マスのブースが決まりました')
    expect(unlockModalMessage(6)).toBe('6マスのブースが決まりました')
  })
})

describe('解放通知モーダルの秒数', () => {
  it('1.5 秒後にボタンが押せるようになる', () => {
    expect(UNLOCK_MODAL_BUTTON_ENABLE_MS).toBe(1500)
  })

  it('3 秒後に自動で閉じる', () => {
    expect(UNLOCK_MODAL_AUTO_CLOSE_MS).toBe(3000)
  })

  it('起きてはいけないこと: 自動クローズより後にボタンが押せるようになる（押せないまま閉じる）', () => {
    expect(UNLOCK_MODAL_BUTTON_ENABLE_MS).toBeLessThan(UNLOCK_MODAL_AUTO_CLOSE_MS)
  })
})

describe('解放通知モーダルの構成', () => {
  it('静止画1枚を装飾として出す（src の指定は1箇所）', () => {
    expect(copy).toContain('export const UNLOCK_MODAL_IMAGE')
    expect(component.match(/alt=""/g)).toHaveLength(1)
    expect(component).toContain('src={UNLOCK_MODAL_IMAGE}')
  })

  it('ボタンのラベルが「閉じる」で、「スキップ」が残っていない', () => {
    expect(component).toContain('閉じる')
    expect(component).not.toContain('スキップ')
  })

  it('ボタンは最初 disabled で、位置・大きさが変わらない（要素ごと差し替えない）', () => {
    expect(component).toContain('disabled={!closable}')
    expect(component.match(/<button/g)).toHaveLength(1)
  })

  it('起きてはいけないこと: バーストアニメーションが残る', () => {
    expect(component).not.toContain('bingo-unlock-burst')
    expect(component).not.toContain('bingo-unlock-piece')
    expect(component).not.toContain('animationDelay')
    expect(styles).not.toContain('bingo-unlock-burst')
    expect(styles).not.toContain('bingo-unlock-piece')
  })

  it('起きてはいけないこと: 自動クローズが外れて操作が無期限にブロックされる', () => {
    expect(component).toContain('window.setTimeout(onDone, UNLOCK_MODAL_AUTO_CLOSE_MS)')
  })
})

describe('呼び出し元（CheckInPage / HomePage）', () => {
  it('両方の経路が同じコンポーネントを使う（見た目が分かれない）', () => {
    for (const p of ['features/checkin/pages/CheckInPage.tsx', 'features/home/pages/HomePage/HomePage.tsx']) {
      expect(src(p)).toContain("from '@/features/home/components/bingo/UnlockAnimation'")
    }
  })

  it('再生済み管理は pair_key ごと（キューの仕組みを変えていない）', () => {
    expect(src('shared/lib/bingoUnlockFlag.ts')).toContain('pair_key')
  })
})
