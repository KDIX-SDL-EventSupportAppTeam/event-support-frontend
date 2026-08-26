import { useState } from 'react'
import { fetchV1Checkins, postV1CheckInRating } from '@/shared/api/v1Participant'
import { ApiError } from '@/shared/api/unwrap'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'
import { formatClientError } from '@/shared/lib/formatClientError'
import { MAX_GACHAPON_COINS } from '@/shared/config/gachapon'
import type { BingoCard, BingoCell } from '@/shared/types/bingoCard'
import { BingoCellView } from '@/features/home/components/bingo/BingoCellView'
import { CheckInRatingModal } from '@/features/checkin/pages/CheckInRatingModal'
import { BingoProgressStepper } from '@/features/home/components/bingo/BingoProgressStepper'

type Props = {
  card: BingoCard
  eventId: string
  onRated?: () => void
}

/**
 * 段階解放ビンゴカードの表示。
 * 仕様: docs/specs/bingo-dynamic-unlock/01-card-display.md
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
      // 1ブース1チェックインのため該当は高々1件
      const match = checkins.find((c) => c.booth_id === cell.booth!.id)
      if (!match) {
        setRatingLookupError('チェックイン履歴が見つかりませんでした。')
        return
      }
      setRatingTarget({ checkinId: match.id, boothName: cell.booth.name })
    } catch (e) {
      setRatingLookupError(formatClientError(e, 'チェックイン履歴の取得に失敗しました'))
    }
  }

  async function submitManualRating(rating: number, comment: string) {
    if (!ratingTarget || isSample) {
      setRatingTarget(null)
      return
    }
    setRatingSubmitting(true)
    setRatingLookupError(null)
    try {
      await postV1CheckInRating(eventId, ratingTarget.checkinId, rating, comment, 'MANUAL')
      onRated?.()
    } catch (e) {
      // 評価済み（409）は無言で閉じると「押しても何も起きない」ため理由を出す。
      // それ以外の送信失敗はチェックイン等と同様、表示を妨げない
      if (e instanceof ApiError && e.code === 'CONFLICT') {
        setRatingLookupError('このブースは既に評価済みです。')
      }
    } finally {
      setRatingSubmitting(false)
      setRatingTarget(null)
    }
  }

  // マス評価の対象は「達成済みかつブースが紐づくマス」。
  // source は問わない: is_achieved が真なら事前推薦マスでも実際に訪問済みで check_ins 行があり、
  // かつ NEXT_CHECKIN では最後の1件を構造上取り逃すため、手動評価が唯一の回収手段になる
  // （03-checkin-flow.md「手動評価の導線」）。
  const canRate = (cell: BingoCell) => cell.is_achieved && Boolean(cell.booth)

  const guideMessage =
    card.progress.center_achieved < 2
      ? '気になるブースを回ってみよう'
      : card.progress.revealed_cells > card.progress.center_total
        ? '新しいマスが開きました。開いたマスのブースに行ってみよう'
        : '気になるブースを回ってみよう'

  return (
    <div className="bingo-card-v2">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1 className="mb-0 main-title">
          <img src="/brand/logo-protofes.png" alt="PRoTo FES" className="bingo-logo" />
          <br />
          BINGO
        </h1>
      </div>

      <p className="bingo-unlock-guide mb-2">{guideMessage}</p>

      <BingoProgressStepper current={card.lines_completed} max={MAX_GACHAPON_COINS} />

      <div className="bingo-progress small text-muted mb-2">
        中央 {card.progress.center_achieved}/{card.progress.center_total} ・ 開放
        {card.progress.revealed_cells}マス ・ 達成{card.progress.achieved_cells}マス ・ ビンゴ
        {card.lines_completed}本
      </div>

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
              <h5 className="modal-title w-100">{selectedCell.booth?.name ?? 'ブース情報'}</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="閉じる"
                onClick={() => setSelectedCell(null)}
              />
            </div>
            <div className="modal-body pt-2">
              {selectedCell.booth?.description ? <p className="mb-2">{selectedCell.booth.description}</p> : null}
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
          onComplete={(r, c) => void submitManualRating(r, c)}
        />
      ) : null}
    </div>
  )
}
