import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * 今年のチェックインは **QR 読み取りと手動コード入力の2方式だけ**である。
 *
 * ブース一覧から選ぶ経路と `?booth_id=` の URL 経路は、カメラをかざさずに
 * 任意のブースへチェックインできてしまうため撤去した。どちらも「画面は正常に動く」
 * たぐいの穴で、動かして気づける類のものではない。DOM を描画する統合テスト基盤が
 * 無いため、ソースを静的に検査して戻ってこないことを担保する。
 *
 * 仕様: issue #84 / #86、および「チェックイン＝実際にそのブースを訪問した」という
 * 研究上の前提（当日のデータは二度と取り直せない）。
 */
const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf-8')

const checkInPage = read('../../src/features/checkin/pages/CheckInPage.tsx')
const scanView = read('../../src/features/checkin/pages/CheckInQrScanView.tsx')

describe('チェックインの入口は QR と手動コードだけ', () => {
  it('T-1 CheckInPage が URL の booth_id を読まない', () => {
    // booth_id そのものは送信ボディ・ブース検索で正当に使う。禁じたいのは
    // 「URL のクエリから booth_id を受け取って確定させる」経路だけである
    expect(checkInPage).not.toContain('useSearchParams')
    expect(checkInPage).not.toContain('boothIdParam')
    expect(checkInPage).not.toMatch(/searchParams[\s\S]{0,40}booth_id/)
  })

  it('T-2 ブース一覧から選ぶ経路（boothSource = list）が存在しない', () => {
    expect(checkInPage).not.toMatch(/'list'/)
    expect(checkInPage).not.toContain('checkin-booth-picker')
  })

  it('T-3 初期ステップがカメラ（scan）で固定されている', () => {
    expect(checkInPage).toMatch(/useState<Step>\('scan'\)/)
  })

  it('T-4 QR 画面に時間経過でフォールバックを出すタイマーが無い', () => {
    expect(scanView).not.toContain('FALLBACK_DELAY_MS')
    expect(scanView).not.toContain('setTimeout')
    expect(scanView).not.toContain('onFallback')
  })

  it('T-5 カメラ失敗時の案内が「ブース一覧」ではなくコード入力を指す', () => {
    expect(scanView).not.toContain('ブース一覧')
    expect(scanView).toContain('コードを入力')
  })
})
