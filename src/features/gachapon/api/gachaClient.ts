import { apiClient } from '@/shared/api/client'
import { ApiError, unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'
import { MAX_GACHAPON_COINS } from '@/shared/config/gachapon'
import { SampleEventData } from '@/shared/data/sample/SampleEventData'
import { incrementSampleGachaponExtraSpent } from '@/shared/data/sample/sampleSession'

/**
 * ガチャコイン API クライアント。
 *
 * API 契約の正本: event-support-server `docs/specs/gacha-and-award/04-api/participant-api.md`
 * - 残高カラムは存在しない。`available = max(0, earned - used)` はサーバーが毎回導出する
 * - 冪等キーはクライアントが生成し、リトライでも同じ値を送る（G-5）
 */

export interface GachaCoins {
  is_enabled: boolean
  lines_completed: number
  earned: number
  used: number
  available: number
  max_coins: number
}

export interface GachaUseResult extends GachaCoins {
  /** そのユーザーの何枚目か（0 起点）。 */
  coin_index: number
  /** ISO 8601。 */
  used_at: string
}

/** サーバー側のエラーコード（participant-api.md）。 */
export const GACHA_DISABLED = 'GACHA_DISABLED'
export const NO_COINS_AVAILABLE = 'NO_COINS_AVAILABLE'

async function apiGetCoins(eventId: string): Promise<GachaCoins> {
  const res = await apiClient.get<ApiResponse<GachaCoins>>(
    `/events/${encodeURIComponent(eventId)}/gacha/coins`,
  )
  return unwrapApiData(res)
}

async function apiUseCoin(eventId: string, idempotencyKey: string): Promise<GachaUseResult> {
  const res = await apiClient.post<ApiResponse<GachaUseResult>>(
    `/events/${encodeURIComponent(eventId)}/gacha/coins/use`,
    { idempotency_key: idempotencyKey },
  )
  return unwrapApiData(res)
}

// --- サンプルモード（VITE_DATA_SOURCE=sample。開発既定） --------------------------
// 本番 API と独立。ライン数＝コイン枚数（上限 MAX_GACHAPON_COINS）として扱う。

const sample = new SampleEventData()

function sampleCoins(eventId: string, userId: string): GachaCoins {
  const lines = sample.getBingoCount(eventId, userId)
  const used = sample.getGachaponCoinsSpent(eventId, userId)
  const earned = Math.min(lines, MAX_GACHAPON_COINS)
  return {
    is_enabled: true,
    lines_completed: lines,
    earned,
    used,
    available: Math.max(0, earned - used),
    max_coins: MAX_GACHAPON_COINS,
  }
}

function sampleUseCoin(eventId: string, userId: string): GachaUseResult {
  const lines = sample.getBingoCount(eventId, userId)
  const base = sample.getGachaponBaseSpent(eventId, userId)
  const usedBefore = sample.getGachaponCoinsSpent(eventId, userId)
  const ok = incrementSampleGachaponExtraSpent(userId, lines, base)
  if (!ok) {
    throw new ApiError(NO_COINS_AVAILABLE, '使用できるコインがありません')
  }
  return {
    ...sampleCoins(eventId, userId),
    coin_index: usedBefore,
    used_at: new Date().toISOString(),
  }
}

export interface GachaClient {
  getCoins(eventId: string, userId: string): Promise<GachaCoins>
  useCoin(eventId: string, userId: string, idempotencyKey: string): Promise<GachaUseResult>
}

export function createGachaClient(): GachaClient {
  if (resolveEventDataSourceMode() === 'sample') {
    return {
      getCoins: async (eventId, userId) => sampleCoins(eventId, userId),
      useCoin: async (eventId, userId) => sampleUseCoin(eventId, userId),
    }
  }
  return {
    getCoins: (eventId) => apiGetCoins(eventId),
    useCoin: (eventId, _userId, key) => apiUseCoin(eventId, key),
  }
}
