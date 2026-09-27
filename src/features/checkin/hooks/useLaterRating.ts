import { useState } from 'react'
import { fetchV1Checkins, postV1CheckInRating } from '@/shared/api/v1Participant'
import { ApiError } from '@/shared/api/unwrap'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'
import { formatClientError } from '@/shared/lib/formatClientError'

export type LaterRatingTarget = { checkinId: string; boothName: string; boothId: string } | null

/**
 * 対象ブースのチェックインを探す。見つからない・評価済みならエラーを返し、
 * それ以外なら評価モーダルを開くための target を返す（issue #115 D1）。
 * React に依存しないため、フック本体から分離して直接テストできる。
 */
export async function resolveLaterRatingTarget(
  eventId: string,
  boothId: string,
  boothName: string,
  isSample: boolean,
): Promise<{ target: LaterRatingTarget; error: string | null }> {
  if (isSample) {
    // サンプルモードには評価 API が無いため、導線のみ見せる（送信は無効）
    return { target: { checkinId: 'sample', boothName, boothId }, error: null }
  }
  try {
    const checkins = await fetchV1Checkins(eventId)
    // 1ブース1チェックインのため該当は高々1件
    const match = checkins.find((c) => c.booth_id === boothId)
    if (!match) {
      return { target: null, error: 'チェックイン履歴が見つかりませんでした。' }
    }
    if (match.rated) {
      return { target: null, error: 'このブースは既に評価済みです。' }
    }
    return { target: { checkinId: match.id, boothName, boothId }, error: null }
  } catch (e) {
    return { target: null, error: formatClientError(e, 'チェックイン履歴の取得に失敗しました') }
  }
}

/**
 * 星0（未選択）なら送らない（D6）。送信は `context: 'MANUAL'`。
 * 409（評価済み）は理由を返す。それ以外の送信失敗は静かに握りつぶす。
 */
export async function submitLaterRating(
  eventId: string,
  target: LaterRatingTarget,
  rating: number,
  comment: string,
  isSample: boolean,
): Promise<{ error: string | null; rated: boolean }> {
  if (!target || isSample || rating < 1) {
    return { error: null, rated: false }
  }
  try {
    await postV1CheckInRating(eventId, target.checkinId, rating, comment, 'MANUAL')
    return { error: null, rated: true }
  } catch (e) {
    if (e instanceof ApiError && e.code === 'CONFLICT') {
      return { error: 'このブースは既に評価済みです。', rated: false }
    }
    return { error: null, rated: false }
  }
}

/**
 * 「あとから評価する」導線の共通処理。ビンゴカード（マスタップ）とブース一覧
 * （詳細モーダル）の両方から使う（issue #115）。
 */
export function useLaterRating(eventId: string, onRated?: (boothId: string) => void) {
  const [target, setTarget] = useState<LaterRatingTarget>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isSample = resolveEventDataSourceMode() === 'sample'

  async function open(boothId: string, boothName: string) {
    setError(null)
    const result = await resolveLaterRatingTarget(eventId, boothId, boothName, isSample)
    setTarget(result.target)
    setError(result.error)
  }

  async function submit(rating: number, comment: string) {
    const current = target
    setSubmitting(true)
    setError(null)
    const result = await submitLaterRating(eventId, current, rating, comment, isSample)
    if (result.rated && current) onRated?.(current.boothId)
    setSubmitting(false)
    setTarget(null)
    setError(result.error)
  }

  function close() {
    setTarget(null)
    setError(null)
  }

  return { target, error, submitting, open, submit, close }
}
