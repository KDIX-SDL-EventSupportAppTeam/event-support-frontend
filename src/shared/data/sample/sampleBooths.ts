import type { LegacyBooth } from '@/shared/types/legacyBooth'

/**
 * サンプル用ブース一覧（ビンゴ・チェックイン・投票の共通マスタ）。
 *
 * `booth_display_code` は本番と同じ「公開してよいブース番号」。
 * 1〜6 を振ってあるので、サンプルでも `public/booth/booth-0*.png` のブースアイコンが出る
 * （docs/reference/assets.md「booth」）。
 */
export const SAMPLE_LEGACY_BOOTHS: LegacyBooth[] = [
  {
    booth_id: 'A',
    booth_display_code: '1',
    booth_name: 'AI デモ',
    booth_emoji: '🤖',
    booth_description: '生成 AI の展示です。',
    booth_image_url: null,
  },
  {
    booth_id: 'B',
    booth_display_code: '2',
    booth_name: 'デザイン相談',
    booth_emoji: '🎨',
    booth_description: 'デザインシステムの相談窓口。',
    booth_image_url: null,
  },
  {
    booth_id: 'C',
    booth_display_code: '3',
    booth_name: 'ハードウェア',
    booth_emoji: '🔧',
    booth_description: '試作基板の展示。',
    booth_image_url: null,
  },
  {
    booth_id: 'D',
    booth_display_code: '4',
    booth_name: 'コミュニティ',
    booth_emoji: '👥',
    booth_description: '学生団体の紹介。',
    booth_image_url: null,
  },
  {
    booth_id: 'E',
    booth_display_code: '5',
    booth_name: 'スポンサー',
    booth_emoji: '⭐',
    booth_description: '協賛企業ブース。',
    booth_image_url: null,
  },
  {
    booth_id: 'F',
    booth_display_code: '6',
    booth_name: 'スタートアップ',
    booth_emoji: '🚀',
    booth_description: 'ピッチ資料の閲覧。',
    booth_image_url: null,
  },
]
