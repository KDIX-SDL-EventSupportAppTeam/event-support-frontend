/**
 * チェックイン成功モーダルで「今どの画面を出すか」の判定。
 * 仕様: docs/specs/bingo-dynamic-unlock/03-checkin-flow.md
 * `scan` はチェックイン前のカメラ画面（QR読み取り）で、上の 1〜3 の前段に置く。
 * `manual` はチェックイン前の手動コード入力画面。
 *
 *   1. 評価ステップ（pending_rating が非 null のときだけ）
 *   2. チェックイン成功ステップ
 *   3. 解放演出（解放が起きたときだけ）
 *
 * **評価が先頭**であることが重要。「後で評価してね」に依存すると回収率は3割を切るため、
 * 解放演出を先に流して評価を後ろへ押しやってはいけない。解放演出は成功ステップよりも後ろ
 * （参加者が成功ステップを閉じた後 = `resultAcknowledged`）に置く。
 */
export type CheckInStep = 'scan' | 'manual' | 'booth' | 'rating' | 'already_visited' | 'result'
export type CheckInView = CheckInStep | 'unlock'

export function resolveCheckInView(input: {
  step: CheckInStep
  hasPendingRating: boolean
  hasPendingUnlock: boolean
  /** 参加者がチェックイン成功ステップを閉じたか（「ホームに戻る」を押したか） */
  resultAcknowledged: boolean
}): CheckInView {
  // 1. 評価ステップ。解放演出より必ず先。
  if (input.step === 'rating' && input.hasPendingRating) return 'rating'
  // 3. 解放演出。2.（成功ステップ）を閉じた後にだけ出す。
  if (input.hasPendingUnlock && input.resultAcknowledged) return 'unlock'
  return input.step
}
