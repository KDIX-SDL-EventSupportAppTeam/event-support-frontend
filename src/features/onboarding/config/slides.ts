/**
 * オンボーディングのスライド定義。
 * 仕様: docs/specs/design-refresh-2026/06-onboarding.md
 *
 * スマホ画面のモックアップ枠は、2026-09-27 受領のチュートリアル埋め込み素材
 * （`onboarding/mockup-*.png`）をスライドごとに使い分ける。
 * 代用していたアワード投票画面（`onboarding/award-screen-*.png`）は解消済み。
 */

/** スライドごとのスマホモックアップ。素材の対応は docs/reference/assets.md を見ること。 */
const MOCKUP_HOME = '/onboarding/mockup-home.png'
const MOCKUP_BINGO_CARD = '/onboarding/mockup-bingo-card.png'
const MOCKUP_VENUE_MAP = '/onboarding/mockup-venue-map.png'
const MOCKUP_AWARD = '/onboarding/mockup-award.png'

/**
 * イラストをスマホモックアップのどこに置くか。
 *
 * モックアップは「アプリの画面そのもの」なので、**絵柄を画面の上に重ねてはいけない。**
 * 重ねると画面が何枚も積み重なって見える（実際にそうなっていた）。
 * 置ける場所は次の2通りだけで、どちらも画面の絵を隠さない。
 *
 * - `aside-*`: 端末の**外側の余白**にはみ出させる。縦の高さを食わないので、
 *   画面の低い端末でもモックアップを小さくせずに済む
 * - `below`: モックアップの**下に普通に並べる**。横長の図解のように、
 *   端末の横幅に収まらない絵はこちら
 */
export type OnboardingIllustrationPlacement = 'aside-bottom-start' | 'aside-top-end' | 'below'

export type OnboardingSlide = {
  id: string
  title: string
  description: string
  /** スライド固有のイラスト（キャラ・図解等）。モックアップの画面には重ねない */
  illustrations: { src: string; alt: string; className: string; placement: OnboardingIllustrationPlacement }[]
  /** スライドが紹介する画面のスマホモックアップ画像 */
  mockup: { src: string; alt: string }
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'features',
    title: 'PRoToFESでできること',
    description: 'ブース紹介、チェックイン、ビンゴ、会場マップ、アワード投票。すべてこのアプリでまとめて楽しめます。',
    // 5つ並ぶので端末の外側には入らない。モックアップの下に1行で並べて凡例のように見せる
    illustrations: [
      { src: '/icon/feature/feature-bingo.png', alt: 'ビンゴ', className: 'onboarding-feature-icon', placement: 'below' },
      { src: '/icon/feature/feature-checkin.png', alt: 'チェックイン', className: 'onboarding-feature-icon', placement: 'below' },
      { src: '/icon/feature/feature-map.png', alt: '会場マップ', className: 'onboarding-feature-icon', placement: 'below' },
      { src: '/icon/feature/feature-award.png', alt: 'アワード投票', className: 'onboarding-feature-icon', placement: 'below' },
      { src: '/icon/feature/feature-schedule.png', alt: 'スケジュール', className: 'onboarding-feature-icon', placement: 'below' },
    ],
    mockup: { src: MOCKUP_HOME, alt: 'ホーム画面' },
  },
  {
    id: 'bingo',
    title: 'ブースを回ってビンゴを完成させよう',
    description: '各ブースでチェックインするとビンゴカードのマスが埋まります。ラインをそろえて景品をゲットしましょう。',
    illustrations: [
      // 横長（縦横比 約2.1）で端末の横幅に収まらないため下に置く
      {
        src: '/onboarding/bingo-flow-steps.png',
        alt: 'ブース訪問からビンゴ達成までの流れ',
        className: 'onboarding-flow-image',
        placement: 'below',
      },
      { src: '/mascot/mascot-cheering.png', alt: '喜ぶマスコット', className: 'onboarding-mascot', placement: 'aside-bottom-start' },
    ],
    mockup: { src: MOCKUP_BINGO_CARD, alt: 'ビンゴカード画面' },
  },
  {
    id: 'map',
    title: '会場マップで目的のブースを見つけよう',
    description: '会場マップから目的のブースの場所をすぐに確認できます。',
    illustrations: [
      { src: '/mascot/mascot-with-map.png', alt: '地図を持つマスコット', className: 'onboarding-mascot', placement: 'aside-bottom-start' },
      {
        src: '/icon/feature/feature-floor-map.png',
        alt: 'フロアマップ表示切替',
        className: 'onboarding-feature-icon',
        placement: 'aside-top-end',
      },
    ],
    mockup: { src: MOCKUP_VENUE_MAP, alt: '会場マップ画面' },
  },
  {
    id: 'award',
    title: 'アワード投票で盛り上がろう',
    description: 'お気に入りのブースに投票して、イベントをみんなで盛り上げましょう。',
    // イラストは無し。仕様が挙げている `award-screen-decorated.png` は
    // モックアップが未受領だった頃の代用で、`mockup-award.png` と同じアワード投票画面。
    // 両方出すと同じ画面が2枚重なるだけなので、モックアップ1枚に寄せる
    illustrations: [],
    mockup: { src: MOCKUP_AWARD, alt: 'アワード投票画面' },
  },
]
