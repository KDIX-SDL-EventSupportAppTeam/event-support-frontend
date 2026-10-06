import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const src = (p: string) => readFileSync(path.resolve(__dirname, '../../src', p), 'utf-8')
const cellView = src('features/home/components/bingo/BingoCellView.tsx')
const cardView = src('features/home/components/bingo/BingoCardView.tsx')
const styles = src('features/home/styles/bingo-card.scss')

/** コメント行（「〜ではない」という説明そのもの）を除いた実コード。 */
const cellCode = cellView
  .split(/\r?\n/)
  .filter((line) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line))
  .join('\n')

describe('割り当て可能なブースが残っていないマス（is_revealed かつ booth: null）', () => {
  it('「すべてのブースを訪問しました」と出す', () => {
    expect(cellCode).toContain('すべてのブースを訪問しました')
  })

  it('起きてはいけないこと: 「ブースが決まりませんでした」が残る', () => {
    expect(cellView).not.toContain('ブースが決まりませんでした')
    expect(cardView).not.toContain('ブースが決まりませんでした')
    expect(styles).not.toContain('bingo-cell-undecided')
  })

  it('達成マスと同じスタンプで描く', () => {
    const block = cellCode.slice(cellCode.indexOf('すべてのブースを訪問しました') - 600)
    expect(block).toContain('/bingo/bingo-cell-stamp.png')
  })

  it('タップできる（未解放マスも含め全マスがタップ可能）', () => {
    expect(cellCode).toContain('const tappable = true')
    expect(cellCode).not.toContain('cell.is_revealed && Boolean(cell.booth)')
  })

  it('未解放マスはモーダルで解放条件を説明する', () => {
    expect(cardView).toContain('ロックが解除されます')
  })

  it('モーダルでブース名が無い理由を説明する', () => {
    expect(cardView).toContain('割り当てられるブースが残っていません')
    expect(cardView).toContain('不具合ではありません')
  })

  it('起きてはいけないこと: 評価導線（星）が出る', () => {
    // canRate / isRated は booth があることを条件にしているので、booth: null では出ない
    expect(cardView).toContain('cell.is_achieved && Boolean(cell.booth) && ratedByBoothId')
    expect(cardView.match(/Boolean\(cell\.booth\)/g)).toHaveLength(2)
  })

  it('4×4 で溢れないよう文言とスタンプを小さくしている（375px 幅）', () => {
    expect(styles).toContain('.bingo-cell-all-visited-text')
    expect(styles).toContain('.bingo-cell-all-visited .bingo-cell-stamp')
  })
})
