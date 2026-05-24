import type { V1BoothDetail, V1BoothListItem } from '@/shared/api/v1Participant'
import type { LegacyBooth } from '@/shared/types/legacyBooth'

const DEFAULT_EMOJI = '🎪'

/** v1 の labels 先頭から絵文字っぽい先頭文字を拾う（なければ既定） */
function emojiFromLabels(labels: string[]): string {
  for (const label of labels) {
    const trimmed = label.trim()
    if (!trimmed) continue
    const parts = [...trimmed]
    const first = parts[0]
    if (first && /\p{Extended_Pictographic}/u.test(first)) {
      return first
    }
  }
  return DEFAULT_EMOJI
}

export function mapV1BoothListItemToLegacy(b: V1BoothListItem): LegacyBooth {
  return {
    booth_id: b.id,
    booth_display_code: b.manual_code?.trim() || undefined,
    booth_name: b.name,
    booth_emoji: emojiFromLabels(b.labels),
    booth_description: b.description ?? '',
    booth_image_url: null,
  }
}

export function mapV1BoothDetailToLegacy(b: V1BoothDetail, description = ''): LegacyBooth {
  return {
    booth_id: b.id,
    booth_name: b.name,
    booth_emoji: emojiFromLabels(b.labels),
    booth_description: description,
    booth_image_url: null,
  }
}
