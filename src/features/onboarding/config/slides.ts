/**
 * オンボーディングのスライド定義。
 * 仕様: docs/specs/design-refresh-2026/06-onboarding.md
 *
 * スマホ画面のモックアップ枠は、装飾つき/なしの2種類のアワード投票画面
 * （`onboarding/award-screen-*.png`）を全スライドで代用している（素材未受領のため）。
 * 差し替えが必要になったら、このファイルの `mockup` だけを直せばよい。
 */

/** 代用素材（アワード投票画面）。装飾つき/なしの2種類しかない。 */
const MOCKUP_DECORATED = '/onboarding/award-screen-decorated.png'
const MOCKUP_PLAIN = '/onboarding/award-screen-plain.png'

export type OnboardingSlide = {
  id: string
  title: string
  description: string
  /** スライド固有のイラスト（キャラ・図解等） */
  illustrations: { src: string; alt: string; className: string }[]
  /** 代用中のスマホモックアップ画像。素材受領後はここを差し替える */
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
    // 代用: 装飾なし版
    mockup: { src: MOCKUP_PLAIN, alt: '' },
  },
  {
    id: 'bingo',
    title: 'ブースを回ってビンゴを完成させよう',
    description: '各ブースでチェックインするとビンゴカードのマスが埋まります。ラインをそろえて景品をゲットしましょう。',
    illustrations: [
      { src: '/onboarding/bingo-flow-steps.png', alt: 'ブース訪問からビンゴ達成までの流れ', className: 'onboarding-flow-image' },
      { src: '/mascot/mascot-cheering.png', alt: '喜ぶマスコット', className: 'onboarding-mascot' },
    ],
    // 代用: 装飾つき版
    mockup: { src: MOCKUP_DECORATED, alt: '' },
  },
  {
    id: 'map',
    title: '会場マップで目的のブースを見つけよう',
    description: '会場マップから目的のブースの場所をすぐに確認できます。',
    illustrations: [
      { src: '/mascot/mascot-with-map.png', alt: '地図を持つマスコット', className: 'onboarding-mascot' },
      { src: '/icon/feature/feature-floor-map.png', alt: 'フロアマップ表示切替', className: 'onboarding-feature-icon' },
    ],
    // 代用: 装飾なし版
    mockup: { src: MOCKUP_PLAIN, alt: '' },
  },
  {
    id: 'award',
    title: 'アワード投票で盛り上がろう',
    description: 'お気に入りのブースに投票して、イベントをみんなで盛り上げましょう。',
    illustrations: [
      { src: '/onboarding/award-screen-decorated.png', alt: 'アワード投票画面', className: 'onboarding-award-image' },
    ],
    // 代用: 装飾つき版
    mockup: { src: MOCKUP_DECORATED, alt: '' },
  },
]
