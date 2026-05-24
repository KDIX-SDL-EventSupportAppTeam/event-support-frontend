import type { LegacyBooth } from '@/types/legacyBooth'

/** サンプル用ブース一覧（ビンゴ・チェックイン・投票の共通マスタ） */
export const SAMPLE_LEGACY_BOOTHS: LegacyBooth[] = [
  {
    booth_id: 'A',
    booth_name: 'AI デモ',
    booth_emoji: '🤖',
    booth_description: '生成 AI の展示です。',
    booth_image_url: null,
  },
  {
    booth_id: 'B',
    booth_name: 'デザイン相談',
    booth_emoji: '🎨',
    booth_description: 'デザインシステムの相談窓口。',
    booth_image_url: null,
  },
  {
    booth_id: 'C',
    booth_name: 'ハードウェア',
    booth_emoji: '🔧',
    booth_description: '試作基板の展示。',
    booth_image_url: null,
  },
  {
    booth_id: 'D',
    booth_name: 'コミュニティ',
    booth_emoji: '👥',
    booth_description: '学生団体の紹介。',
    booth_image_url: null,
  },
  {
    booth_id: 'E',
    booth_name: 'スポンサー',
    booth_emoji: '⭐',
    booth_description: '協賛企業ブース。',
    booth_image_url: null,
  },
  {
    booth_id: 'F',
    booth_name: 'スタートアップ',
    booth_emoji: '🚀',
    booth_description: 'ピッチ資料の閲覧。',
    booth_image_url: null,
  },
]
