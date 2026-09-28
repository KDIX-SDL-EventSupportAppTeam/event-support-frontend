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

export type OnboardingSlide = {
  id: string
  title: string
  description: string
  /** スライド固有のイラスト（キャラ・図解等） */
  illustrations: { src: string; alt: string; className: string }[]
  /** スライドが紹介する画面のスマホモックアップ画像 */
  mockup: { src: string; alt: string }
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'features',
    title: 'PRoToFESでできること',
    description: 'ブース紹介、チェックイン、ビンゴ、会場マップ、アワード投票。すべてこのアプリでまとめて楽しめます。',
    illustrations: [
      { src: '/icon/feature/feature-bingo.png', alt: 'ビンゴ', className: 'onboarding-feature-icon' },
      { src: '/icon/feature/feature-checkin.png', alt: 'チェックイン', className: 'onboarding-feature-icon' },
      { src: '/icon/feature/feature-map.png', alt: '会場マップ', className: 'onboarding-feature-icon' },
      { src: '/icon/feature/feature-award.png', alt: 'アワード投票', className: 'onboarding-feature-icon' },
      { src: '/icon/feature/feature-schedule.png', alt: 'スケジュール', className: 'onboarding-feature-icon' },
    ],
    mockup: { src: MOCKUP_HOME, alt: 'ホーム画面' },
  },
  {
    id: 'bingo',
    title: 'ブースを回ってビンゴを完成させよう',
    description: '各ブースでチェックインするとビンゴカードのマスが埋まります。ラインをそろえて景品をゲットしましょう。',
    illustrations: [
      { src: '/onboarding/bingo-flow-steps.png', alt: 'ブース訪問からビンゴ達成までの流れ', className: 'onboarding-flow-image' },
      { src: '/mascot/mascot-cheering.png', alt: '喜ぶマスコット', className: 'onboarding-mascot' },
    ],
    mockup: { src: MOCKUP_BINGO_CARD, alt: 'ビンゴカード画面' },
  },
  {
    id: 'map',
    title: '会場マップで目的のブースを見つけよう',
    description: '会場マップから目的のブースの場所をすぐに確認できます。',
    illustrations: [
      { src: '/mascot/mascot-with-map.png', alt: '地図を持つマスコット', className: 'onboarding-mascot' },
      { src: '/icon/feature/feature-floor-map.png', alt: 'フロアマップ表示切替', className: 'onboarding-feature-icon' },
    ],
    mockup: { src: MOCKUP_VENUE_MAP, alt: '会場マップ画面' },
  },
  {
    id: 'award',
    title: 'アワード投票で盛り上がろう',
    description: 'お気に入りのブースに投票して、イベントをみんなで盛り上げましょう。',
    illustrations: [
      { src: '/onboarding/award-screen-decorated.png', alt: 'アワード投票画面', className: 'onboarding-award-image' },
    ],
    mockup: { src: MOCKUP_AWARD, alt: 'アワード投票画面' },
  },
]
