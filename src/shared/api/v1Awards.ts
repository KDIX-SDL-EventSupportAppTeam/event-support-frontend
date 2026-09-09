import { apiClient } from '@/shared/api/client'
import { toApiError, unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'
import type { Award } from '@/shared/types/award'
import type { LegacyBooth } from '@/shared/types/legacyBooth'
import type { AwardVoteSnapshot } from '@/shared/data/participantTypes'

/**
 * 参加者向けアワード投票 API（issue #89 / server #124）。
 *
 * API 契約の正本: event-support-server `docs/specs/gacha-and-award/06-api/award-api.md`
 * - 投票のキーは `award_id`（賞名ではない）
 * - `saveVotes` は全票を1回で送る（1票ずつのループにしない。途中失敗で部分保存が残る）
 * - 関門はサーバー（チェックイン済み判定・開閉）。UI の選択肢制限は表示の都合
 */

const DEFAULT_BOOTH_EMOJI = '🎪'

type ServerAwardBooth = {
  id: string
  name: string
  description: string
  display_code: string | null
  category_id: string | null
}

type ServerSnapshot = {
  voting_open: boolean
  awards: Award[]
  checked_booths: ServerAwardBooth[]
  votes: Record<string, string>
}

/** `checked_booths` の1行を LegacyBooth へ。GET /v1/booths と同形だが labels は無いので既定絵文字。 */
function toLegacyBooth(b: ServerAwardBooth): LegacyBooth {
  return {
    booth_id: b.id,
    booth_display_code: b.display_code ?? undefined,
    booth_name: b.name,
    booth_emoji: DEFAULT_BOOTH_EMOJI,
    booth_description: b.description ?? '',
    booth_image_url: null,
  }
}

function toSnapshot(s: ServerSnapshot): AwardVoteSnapshot {
  return {
    votingOpen: s.voting_open,
    awards: s.awards,
    checkedBooths: s.checked_booths.map(toLegacyBooth),
    votes: s.votes ?? {},
  }
}

export async function fetchAwardVoteSnapshot(eventId: string): Promise<AwardVoteSnapshot> {
  try {
    const res = await apiClient.get<ApiResponse<ServerSnapshot>>(
      `/events/${encodeURIComponent(eventId)}/awards/vote`,
    )
    return toSnapshot(unwrapApiData(res))
  } catch (e) {
    throw toApiError(e)
  }
}

/**
 * 全票をまとめて送る。`null` は取り消し。応答は保存後スナップショット。
 * 失敗は ApiError（code: VOTING_CLOSED | NOT_CHECKED_IN | NOT_FOUND 等）。
 */
export async function postAwardVotes(
  eventId: string,
  votes: Record<string, string | null>,
): Promise<AwardVoteSnapshot> {
  try {
    const res = await apiClient.post<ApiResponse<ServerSnapshot>>(
      `/events/${encodeURIComponent(eventId)}/awards/vote`,
      { votes },
    )
    return toSnapshot(unwrapApiData(res))
  } catch (e) {
    throw toApiError(e)
  }
}
