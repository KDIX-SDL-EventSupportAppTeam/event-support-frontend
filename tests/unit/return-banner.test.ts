import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const { resolveReturnBannerState } = await import('@/features/home/components/returnBannerView')

const src = (p: string) => readFileSync(path.resolve(__dirname, '../../src', p), 'utf-8')
const homePage = src('features/home/pages/HomePage/HomePage.tsx')
const banner = src('features/home/pages/BeforeLeavingPage/BeforeLeavingPage.tsx')
/** コメント（「〜と書かない」という説明そのもの）を除いた実コード。 */
const stripComments = (text: string) =>
  text
    .split(/\r?\n/)
    .filter((line) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line))
    .join('\n')
const bannerCode = stripComments(banner)
const surveyFlag = src('shared/lib/surveyOpenedFlag.ts')

const base = { votingOpen: true, votes: {}, surveyUrl: 'https://example.invalid/survey', surveyOpened: false }

describe('resolveReturnBannerState', () => {
  it('未投票・未回答なら両方の導線を出す', () => {
    expect(resolveReturnBannerState(base)).toEqual({ visible: true, vote: 'open', survey: 'open' })
  })

  it('投票済みなら投票の導線は押せない（済み表示）', () => {
    const s = resolveReturnBannerState({ ...base, votes: { 'award-1': 'booth-1' } })
    expect(s.vote).toBe('done')
    expect(s.visible).toBe(true) // アンケートが残っているので出す
  })

  it('締切後は「受付終了」にする（バナーは消さない。アンケートが残っている）', () => {
    const s = resolveReturnBannerState({ ...base, votingOpen: false })
    expect(s.vote).toBe('closed')
    expect(s.visible).toBe(true)
  })

  it('投票済みは締切より優先（締切後に投票済みの人へ受付終了と出さない）', () => {
    const s = resolveReturnBannerState({ ...base, votingOpen: false, votes: { a: 'b' } })
    expect(s.vote).toBe('done')
  })

  it('surveyUrl が無ければアンケートのリンクだけ出さない（バナーは投票だけで出す）', () => {
    const s = resolveReturnBannerState({ ...base, surveyUrl: null })
    expect(s.survey).toBeNull()
    expect(s.visible).toBe(true)
  })

  it('一度開いたあともアンケートは押せる（開いた ≠ 回答した）', () => {
    const s = resolveReturnBannerState({ ...base, surveyOpened: true })
    expect(s.survey).toBe('opened')
    expect(s.visible).toBe(true)
  })

  it('投票済みでも survey_url があればバナーが出る', () => {
    expect(resolveReturnBannerState({ ...base, votes: { a: 'b' } }).visible).toBe(true)
    expect(
      resolveReturnBannerState({ ...base, votes: { a: 'b' }, surveyOpened: true }).visible,
    ).toBe(true)
  })

  it('起きてはいけないこと: 一度開いただけでアンケートの入口が閉じる', () => {
    for (const votes of [null, {}, { a: 'b' }]) {
      for (const votingOpen of [true, false, null]) {
        const s = resolveReturnBannerState({ ...base, votes, votingOpen, surveyOpened: true })
        expect(s.visible).toBe(true)
        expect(s.survey).not.toBeNull()
      }
    }
  })

  it('投票済み・締切かつ surveyUrl 無しならバナーを出さない（畳むのはこの場合だけ）', () => {
    expect(resolveReturnBannerState({ ...base, votes: { a: 'b' }, surveyUrl: null }).visible).toBe(false)
    expect(resolveReturnBannerState({ ...base, votingOpen: false, surveyUrl: null }).visible).toBe(false)
  })

  it('起きてはいけないこと: 取得できていないときに導線が消える（回収の機会を失う）', () => {
    const s = resolveReturnBannerState({ ...base, votingOpen: null, votes: null })
    expect(s.visible).toBe(true)
    expect(s.vote).toBe('open')
  })
})

describe('ホームの導線（issue #151）', () => {
  it('ホームから「帰宅する方へ」画面へ遷移できる', () => {
    expect(homePage).toContain('帰宅する方へ')
    expect(homePage).toContain("navigate('/before-leaving')")
  })

  it('「帰宅する方へ」はサブアクションより下にある', () => {
    expect(homePage.indexOf("navigate('/before-leaving')")).toBeGreaterThan(homePage.indexOf('sub-actions'))
  })
})

describe('「帰宅する方へ」画面（issue #151）', () => {
  it('アワード投票へ遷移できる', () => {
    expect(banner).toContain("navigate('/award-vote')")
  })

  it('アンケートは確認モーダル経由（window.open は確認モーダル内の1箇所のみ）', () => {
    expect(banner).toContain('setSurveyConfirmOpen(true)')
    expect(banner.split('window.open').length - 1).toBe(1)
  })

  it('見出しに「閉会式を待たずに」と書いていない（離脱を促さない）', () => {
    expect(bannerCode).toContain('お帰りの前に')
    expect(bannerCode).not.toContain('閉会式')
  })

  it('アンケートは開いたあとも押せる button（非活性にしない）', () => {
    const surveyBlock = bannerCode.slice(bannerCode.indexOf('{state.survey ?'))
    expect(surveyBlock).toContain('onClick={() => setSurveyConfirmOpen(true)}')
  })

  it('起きてはいけないこと: 投票済みを localStorage で捏造する', () => {
    expect(banner).toContain('getAwardVoteSnapshot')
    expect(stripComments(surveyFlag)).not.toContain('回答済み')
    expect(bannerCode).not.toContain('回答済み')
  })

  it('feature 間の直接 import をしていない（アワード画面のコンポーネントを読んでいない）', () => {
    expect(homePage).not.toContain("@/features/award/")
    expect(banner).not.toContain("@/features/award/")
  })
})
