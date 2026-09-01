import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * docs/specs/app-access-gate-scope/README.md の構造要件を機械的に守る。
 *
 * 公開ゲート（RequireAppOpen）は「1画面ずつ書き足す」形にすると画面追加時に漏れる。
 * ルータで1箇所にまとめ、参加者ルートを増やす人が意識せずゲート配下に入る構造を維持する。
 * DOM を描画する統合テスト基盤が無いため、ルータ定義のソースを静的に検査する（T-8 の担保）。
 *
 * 「ゲートより後ろに書いてあるか」ではなく **ゲート区間の内側にあるか** を見る。
 * 前者だと、参加者ルートを区間の外（admin 群の側など）へ移しても検知できない。
 */
const routerSrc = readFileSync(
  fileURLToPath(new URL('../../src/router/index.tsx', import.meta.url)),
  'utf-8',
)

/** ルータ側に置いたゲート区間のマーカー。区間の内外を機械的に判定するための目印 */
const START_MARKER = 'participant-gated:start'
const END_MARKER = 'participant-gated:end'

const startIndex = routerSrc.indexOf(START_MARKER)
const endIndex = routerSrc.indexOf(END_MARKER)

/** 仕様の表にある「ゲートを追加」対象 + 既にゲート配下だった /home */
const GATED_PATHS = [
  '/home',
  '/checkin',
  '/award-vote',
  '/schedule',
  '/booth-list',
  '/venue-map',
  '/gachapon',
  '/gachapon/use',
  '/gachapon/complete',
  '/qa',
]

/** ゲートを掛けてはならない入口・メール確認（掛けると事前アンケートが回答不能になる） */
const UNGATED_PATHS = ['/e', '/e/:eventId', '/verify-email']

describe('アプリ公開ゲートの適用範囲', () => {
  it('ゲート区間のマーカーが1組だけ存在する', () => {
    expect(startIndex).toBeGreaterThan(-1)
    expect(endIndex).toBeGreaterThan(startIndex)
    expect(routerSrc.lastIndexOf(START_MARKER)).toBe(startIndex)
    expect(routerSrc.lastIndexOf(END_MARKER)).toBe(endIndex)
  })

  it('RequireAppOpen はレイアウトルートとして1箇所だけで使う（children で個別に包まない）', () => {
    expect(routerSrc.match(/<RequireAppOpen\s*\/>/g) ?? []).toHaveLength(1)
    expect(routerSrc.match(/<RequireAppOpen>/g) ?? []).toHaveLength(0)
  })

  it.each(GATED_PATHS)('%s がゲート区間の内側に1つだけ定義されている', (path) => {
    const decl = `path="${path}"`
    const first = routerSrc.indexOf(decl)
    expect(first, `${decl} がルータに無い`).toBeGreaterThan(-1)
    // 同じパスが区間外にも書かれていたら（移設・重複定義）検知する
    expect(routerSrc.lastIndexOf(decl), `${decl} が複数箇所にある`).toBe(first)
    expect(first, `${decl} がゲート区間より前にある`).toBeGreaterThan(startIndex)
    expect(first, `${decl} がゲート区間より後ろにある`).toBeLessThan(endIndex)
  })

  it.each(UNGATED_PATHS)('%s はゲート区間の外にある', (path) => {
    const decl = `path="${path}"`
    const first = routerSrc.indexOf(decl)
    expect(first, `${decl} がルータに無い`).toBeGreaterThan(-1)
    expect(first < startIndex || first > endIndex, `${decl} がゲート配下に入っている`).toBe(true)
  })
})

/**
 * ゲート（`RequireAppOpen`）と入口（`EntryPage` の `useAppAccess`）が
 * **同じエンドポイント** で開放状態を取ること（issue #80）。
 *
 * サーバー側の判定が一致していても、別々の口を叩いているとキャッシュ差・
 * レプリカ遅延で食い違い、入口とアプリ本体の間で往復リダイレクトが起きうる。
 * 「どのモジュールから取得するか」は配線の不変条件で純関数に落とせないため、
 * ルータ構造と同じくソースを静的に検査する。
 */
describe('開放状態の取得口', () => {
  const gateSrc = readFileSync(
    fileURLToPath(new URL('../../src/shared/access/RequireAppOpen.tsx', import.meta.url)),
    'utf-8',
  )
  const hookSrc = readFileSync(
    fileURLToPath(new URL('../../src/shared/hooks/useAppAccess.ts', import.meta.url)),
    'utf-8',
  )

  it('ゲートも入口も shared/api/appAccess から取得する', () => {
    expect(gateSrc).toMatch(/import\s*\{[^}]*fetchAppAccess[^}]*\}\s*from\s*'@\/shared\/api\/appAccess'/)
    expect(hookSrc).toMatch(/import\s*\{[^}]*fetchAppAccess[^}]*\}\s*from\s*'@\/shared\/api\/appAccess'/)
  })

  it('ゲートは /events/:id/public（publicEvent）から開放状態を読まない', () => {
    expect(gateSrc).not.toMatch(/publicEvent/)
  })

  it('publicEvent は開放状態の写しを持たない（判定の口を増やさない）', () => {
    const publicEventSrc = readFileSync(
      fileURLToPath(new URL('../../src/shared/api/publicEvent.ts', import.meta.url)),
      'utf-8',
    )
    expect(publicEventSrc).not.toMatch(/is_open/)
  })
})
