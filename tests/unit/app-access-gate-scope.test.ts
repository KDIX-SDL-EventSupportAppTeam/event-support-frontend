import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * docs/specs/app-access-gate-scope/README.md の構造要件を機械的に守る。
 *
 * 公開ゲート（RequireAppOpen）は「1画面ずつ書き足す」形にすると画面追加時に漏れる。
 * ルータで1箇所にまとめ、参加者ルートを増やす人が意識せずゲート配下に入る構造を維持する。
 * DOM を描画する統合テスト基盤が無いため、ルータ定義のソースを静的に検査する（T-8 の担保）。
 */
const routerSrc = readFileSync(
  fileURLToPath(new URL('../../src/router/index.tsx', import.meta.url)),
  'utf-8',
)

describe('アプリ公開ゲートの適用範囲', () => {
  it('RequireAppOpen はレイアウトルートとして1箇所だけで使う（children で個別に包まない）', () => {
    const selfClosing = routerSrc.match(/<RequireAppOpen\s*\/>/g) ?? []
    const withChildren = routerSrc.match(/<RequireAppOpen>/g) ?? []
    expect(selfClosing).toHaveLength(1)
    expect(withChildren).toHaveLength(0)
  })

  it('参加者が触る画面がすべてゲート配下（RequireAppOpen 以降）に置かれている', () => {
    const gateIndex = routerSrc.indexOf('<RequireAppOpen />')
    expect(gateIndex).toBeGreaterThan(-1)
    const afterGate = routerSrc.slice(gateIndex)
    for (const path of [
      '/home',
      '/checkin',
      '/schedule',
      '/booth-list',
      '/venue-map',
      '/gachapon',
      '/gachapon/use',
      '/gachapon/complete',
      '/qa',
    ]) {
      expect(afterGate).toContain(`path="${path}"`)
    }
  })

  it('入口とメール確認はゲート配下に置かない', () => {
    const gateIndex = routerSrc.indexOf('<RequireAppOpen />')
    const beforeGate = routerSrc.slice(0, gateIndex)
    for (const path of ['/e', '/e/:eventId', '/verify-email']) {
      expect(beforeGate).toContain(`path="${path}"`)
    }
  })
})
