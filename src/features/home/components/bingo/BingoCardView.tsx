import { useState } from 'react'
import { fetchV1Checkins, postV1CheckInRating } from '@/shared/api/v1Participant'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'
import { formatClientError } from '@/shared/lib/formatClientError'
import type { BingoCard, BingoCell } from '@/shared/types/bingoCard'
import { BingoCellView } from '@/features/home/components/bingo/BingoCellView'
import { CheckInRatingModal } from '@/features/checkin/pages/CheckInRatingModal'
import { ReasonPanel } from '@/features/home/components/bingo/ReasonPanel'

type Props = {
  card: BingoCard
  eventId: string
  onRated?: () => void
}

/**
 * 段階解放ビンゴカードの表示。
 * 仕様: docs/.sdd/02-bingo-card/card-display.md
 */
export function BingoCardView({ card, eventId, onRated }: Props) {
  const [selectedCell, setSelectedCell] = useState<BingoCell | null>(null)
  const [ratingTarget, setRatingTarget] = useState<{ checkinId: string; boothName: string } | null>(null)
  const [ratingLookupError, setRatingLookupError] = useState<string | null>(null)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)

  const isSample = resolveEventDataSourceMode() === 'sample'

  async function openManualRating(cell: BingoCell) {
    if (!cell.booth) return
    setRatingLookupError(null)
    if (isSample) {
      // サンプルモードには評価 API が無いため、導線のみ見せる（送信は無効）
      setRatingTarget({ checkinId: 'sample', boothName: cell.booth.name })
      return
    }
    try {
      const checkins = await fetchV1Checkins(eventId)
      const match = [...checkins].reverse().find((c) => c.booth_id === cell.booth!.id)
      if (!match) {
        setRatingLookupError('チェックイン履歴が見つかりませんでした。')
        return
      }
      setRatingTarget({ checkinId: match.id, boothName: cell.booth.name })
    } catch (e) {
      setRatingLookupError(formatClientError(e, 'チェックイン履歴の取得に失敗しました'))
    }
  }

  async function submitManualRating(rating: number) {
    if (!ratingTarget || isSample) {
      setRatingTarget(null)
      return
    }
    setRatingSubmitting(true)
    try {
      await postV1CheckInRating(eventId, ratingTarget.checkinId, rating, undefined, 'MANUAL')
      onRated?.()
    } catch {
      // 評価の送信失敗はチェックイン等の成功表示を妨げないのと同様、静かに握りつぶす
    } finally {
      setRatingSubmitting(false)
      setRatingTarget(null)
    }
  }

  // マス評価の対象は ACHIEVED かつ参加ボーナスではないマス（reason-text.md）
  const canRate = (cell: BingoCell) => cell.state === 'ACHIEVED' && cell.source !== 'SIGNUP_BONUS' && cell.booth

  return (
    <div className="bingo-card-v2">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1 className="mb-0 main-title">
          <span className="sub-title">PRoTo FES</span>
          <br />
          BINGO
        </h1>
        <div className="bingo-coins" aria-label={`ガチャポンコイン ${card.coins.earned}/${card.coins.max}`}>
          {Array.from({ length: card.coins.earned }).map((_, i) => (
            <img key={`gold-${i}`} src="/icons/coin-gold.png" alt="" />
          ))}
          {Array.from({ length: Math.max(0, card.coins.max - card.coins.earned) }).map((_, i) => (
            <img key={`gray-${i}`} src="/icons/coin-gray.png" alt="" />
          ))}
        </div>
      </div>

      {card.status === 'CENTER_ONLY' ? (
        <p className="bingo-unlock-guide mb-2">
          あと{card.progress.visits_to_unlock}ブース回るとカードが広がります
        </p>
      ) : null}

      <div className="row g-1 g-sm-2 mt-1">
        {card.cells.map((cell) => (
          <div key={cell.position} className="col-3">
            <BingoCellView cell={cell} onTap={setSelectedCell} />
          </div>
        ))}
      </div>

      {selectedCell ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedCell(null)}
        >
          <div className="modal-content booth-detail-popup text-start" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title w-100">{selectedCell.booth?.name ?? 'ご参加ありがとうございます'}</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="閉じる"
                onClick={() => setSelectedCell(null)}
              />
            </div>
            <div className="modal-body pt-2">
              {selectedCell.source === 'SIGNUP_BONUS' ? (
                <p className="mb-0">ご参加ありがとうございます。中央のマスに参加ボーナスとして配られました。</p>
              ) : null}
              <ReasonPanel reason={selectedCell.reason} />
              {canRate(selectedCell) ? (
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => void openManualRating(selectedCell)}
                  >
                    このブースを評価する
                  </button>
                  {ratingLookupError ? <p className="text-danger small mt-2 mb-0">{ratingLookupError}</p> : null}
                </div>
              ) : null}
            </div>
            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-secondary btn-modal-close"
                onClick={() => setSelectedCell(null)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {ratingTarget ? (
        <CheckInRatingModal
          boothName={ratingTarget.boothName}
          ratingScale={card.rating_scale}
          submitting={ratingSubmitting}
          onSubmit={(r) => void submitManualRating(r)}
          onSkip={() => setRatingTarget(null)}
        />
      ) : null}
    </div>
  )
}
