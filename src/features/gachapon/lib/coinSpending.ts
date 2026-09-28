import { ApiError, toApiError } from '@/shared/api/unwrap'
import { NO_COINS_AVAILABLE, type GachaUseResult } from '@/features/gachapon/api/gachaClient'

/**
 * ガチャコインの複数枚使用（issue #150）。
 *
 * API 契約の正本: event-support-server `docs/specs/gacha-and-award/03-coin-lifecycle/spending.md`
 * - **台帳方式。1枚 = `gacha_coin_uses` の1行**。API を「N枚まとめて消費する」形に変えない
 * - **既存の1枚消費エンドポイントを、枚数ぶん順番に呼ぶ**（並行に投げると `coin_index` が競合する）
 * - **冪等キーはクライアントが生成する**（G-5）。枚数ぶん別に持つ
 * - **使用は取り消せない。** 途中で失敗しても成立した分をロールバックしてはならない
 *   （「全部か無か」にはできない）
 */

/** 完了画面へ渡す結果。複数枚に対応する（`location.state`）。 */
export type GachaSpendSummary = {
  /** 参加者が指定した枚数。 */
  requested: number
  /** 実際に成立した枚数。 */
  used_count: number
  /** 成立したコインの `coin_index`（0 起点）を成立順に並べたもの。 */
  coin_indexes: number[]
  /** 最後に成立した使用の時刻（ISO 8601）。 */
  used_at: string
  /** 使用後の残り枚数。最後に成立したレスポンスの `available` をそのまま使う。 */
  available: number
}

/**
 * 冪等キーの列。**1枚につき1個の UUID。**
 *
 * **サーバーは `idempotency_key` を UUID 形式で検証する**（`src/routes/v1/gacha.ts` の
 * `z.string().uuid()`。形式違反は 400 `INVALID_BODY`。正本は
 * `docs/specs/gacha-and-award/04-api/participant-api.md`）。
 * そのため `<操作ID>:<通し番号>` のような派生キーは使えない。**枚数ぶんの UUID を生成する。**
 *
 * 呼び出し側は生成したキー列を**画面の状態として保持する**。そうすることで
 * 同じ枚数での再試行では同じキー列が送られ、サーバーは成立済みの分を `200` で返すので
 * **枚数が増えない**。枚数を変えたときは呼び出し側がキー列を作り直す（別の操作として扱う）。
 */
export function buildIdempotencyKeys(
  count: number,
  newUuid: () => string = () => crypto.randomUUID(),
): string[] {
  return Array.from({ length: Math.max(0, count) }, () => newUuid())
}

/** 枚数の指定を 1〜available に収める。上限は**サーバーが返した `available`**（定数を使わない）。 */
export function clampCoinCount(count: number, available: number): number {
  if (available <= 0) return 0
  return Math.min(Math.max(1, Math.trunc(count)), available)
}

export type SpendOutcome = {
  summary: GachaSpendSummary | null
  /** `NO_COINS_AVAILABLE`（409）で打ち切ったか。 */
  stoppedByNoCoins: boolean
  /** 409 以外で止まったときのエラー（呼び出し側が文言を決める）。 */
  error: unknown
}

/**
 * 指定枚数を**逐次**消費する。1枚ごとに冪等キーを変えて呼ぶ。
 *
 * - `NO_COINS_AVAILABLE`（409）が返ったら**そこで止める**（他の端末で使い切った等）
 * - それ以外の失敗でも止めるが、**成立した分は成立したまま返す**（取り消せないため）
 */
export async function spendCoins(args: {
  /** 使う枚数ぶんの冪等キー（`buildIdempotencyKeys`）。**呼び出し側が保持したものをそのまま渡す。** */
  keys: string[]
  useCoin: (idempotencyKey: string) => Promise<GachaUseResult>
}): Promise<SpendOutcome> {
  const requested = args.keys.length
  const results: GachaUseResult[] = []

  for (const key of args.keys) {
    try {
      results.push(await args.useCoin(key))
    } catch (e) {
      const err = toApiError(e)
      const noCoins = err instanceof ApiError && err.code === NO_COINS_AVAILABLE
      return {
        summary: summarize(requested, results),
        stoppedByNoCoins: noCoins,
        error: noCoins ? null : e,
      }
    }
  }

  return { summary: summarize(requested, results), stoppedByNoCoins: false, error: null }
}

function summarize(requested: number, results: GachaUseResult[]): GachaSpendSummary | null {
  const last = results[results.length - 1]
  if (!last) return null
  return {
    requested,
    used_count: results.length,
    coin_indexes: results.map((r) => r.coin_index),
    used_at: last.used_at,
    available: last.available,
  }
}

/**
 * 結果の文言。**成立枚数に基づく**（指定枚数ではない）。
 * 一部しか成立しなかったことを隠さない（issue #150「部分成功を正直に見せる」）。
 */
export function spendResultMessage(summary: GachaSpendSummary): string {
  const shortfall = summary.requested - summary.used_count
  if (shortfall <= 0) return `${summary.used_count}枚使いました`
  return `${summary.used_count}枚使えました。残り${shortfall}枚は使えませんでした。`
}

/** 使用したコインの表示（複数枚では範囲ではなく枚数と通し番号を出す）。 */
export function usedCoinLabel(summary: GachaSpendSummary): string {
  const numbers = summary.coin_indexes.map((i) => i + 1)
  if (numbers.length === 0) return '—'
  if (numbers.length === 1) return `${numbers[0]}枚目`
  return `${numbers.join('・')}枚目（計${numbers.length}枚）`
}
