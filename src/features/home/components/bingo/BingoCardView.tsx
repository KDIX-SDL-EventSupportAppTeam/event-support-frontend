import { useEffect, useState } from 'react'
import { fetchV1Checkins } from '@/shared/api/v1Participant'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'
import { MAX_GACHAPON_COINS } from '@/shared/config/gachapon'
import type { BingoCard, BingoCell } from '@/shared/types/bingoCard'
import { BingoCellView } from '@/features/home/components/bingo/BingoCellView'
import { CheckInRatingModal } from '@/features/checkin/pages/CheckInRatingModal'
import { BingoProgressStepper } from '@/features/home/components/bingo/BingoProgressStepper'
import { Modal } from '@/shared/components/modal/Modal'
import { useLaterRating } from '@/features/checkin/hooks/useLaterRating'

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
  // booth_id → 評価済みか。カードが開いたときに1回取得する（issue #115 D2）
  const [ratedByBoothId, setRatedByBoothId] = useState<Map<string, boolean>>(new Map())

  const isSample = resolveEventDataSourceMode() === 'sample'

  useEffect(() => {
    if (isSample) return
    let active = true
    fetchV1Checkins(eventId).then((checkins) => {
      if (!active) return
      setRatedByBoothId(new Map(checkins.map((c) => [c.booth_id, c.rated])))
    })
    return () => {
      active = false
    }
  }, [eventId, isSample])

  const rating = useLaterRating(eventId, (boothId) => {
    setRatedByBoothId((prev) => new Map(prev).set(boothId, true))
    onRated?.()
  })

  // マス評価の対象は「達成済み かつ ブースあり かつ 未評価」（issue #115 D2）。
  // source は問わない: is_achieved が真なら事前推薦マスでも実際に訪問済みで check_ins 行がある。
  const canRate = (cell: BingoCell) =>
    cell.is_achieved && Boolean(cell.booth) && ratedByBoothId.get(cell.booth!.id) !== true
  const isRated = (cell: BingoCell) =>
    cell.is_achieved && Boolean(cell.booth) && ratedByBoothId.get(cell.booth!.id) === true

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
          <img src="/brand/logo-protofes.png" alt="PRoTo FES" className="bingo-logo pf-logo" />
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
        <Modal
          titleId="booth-detail-title"
          onClose={() => setSelectedCell(null)}
          contentClassName="booth-detail-popup text-start"
        >
          <div className="modal-header border-0 pb-0">
            <h5 id="booth-detail-title" className="modal-title w-100">
              {selectedCell.booth?.name ?? 'ブース情報'}
            </h5>
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
                  onClick={() => void rating.open(selectedCell.booth!.id, selectedCell.booth!.name)}
                >
                  このブースを評価する
                </button>
                {rating.error ? <p className="text-danger small mt-2 mb-0">{rating.error}</p> : null}
              </div>
            ) : null}
            {isRated(selectedCell) ? <p className="text-success small mt-3 mb-0">評価済み</p> : null}
          </div>
          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-secondary btn-modal-close" onClick={() => setSelectedCell(null)}>
              閉じる
            </button>
          </div>
        </Modal>
      ) : null}

      {rating.target ? (
        <CheckInRatingModal
          boothName={rating.target.boothName}
          ratingScale={card.rating_scale}
          submitting={rating.submitting}
          onComplete={(r, c) => void rating.submit(r, c)}
        />
      ) : null}
    </div>
  )
}
