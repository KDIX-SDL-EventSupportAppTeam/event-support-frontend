import { useEffect, useState } from 'react'
import { createGachaClient, type GachaCoins } from '@/features/gachapon/api/gachaClient'

/**
 * ホームのガチャコイン所持枚数。
 *
 * コイン数が変わるのは「成立ライン数が変わったとき」と「コインを使ったとき」だけ。
 * そこで取り直しの条件を **`linesCompleted`（プリミティブ）** にする。
 * カードの他の変化（評価済みフラグ・マスの解放など）で `card` の identity が変わっても取り直さない。
 *
 * - 初回表示は必ず1回取る（カードがまだ無く `linesCompleted` が undefined でも取る）
 * - コインを使った後は `/gachapon/complete` からホームへ戻って再マウントされるので、そこで取り直す
 * - 表示はサーバーの値。フロントで枚数を計算しない
 *
 * **ビンゴ達成モーダルの表示判定には使わない**（issue #149。依存の向き `ガチャ → ビンゴ` は禁止）
 */
export function useGachaCoins(
  eventId: string | undefined,
  userId: string | undefined,
  linesCompleted: number | undefined,
): GachaCoins | null {
  const [gachaCoins, setGachaCoins] = useState<GachaCoins | null>(null)
  useEffect(() => {
    if (!eventId || !userId) return
    let alive = true
    void createGachaClient()
      .getCoins(eventId, userId)
      .then((c) => {
        if (alive) setGachaCoins(c)
      })
      .catch(() => {
        /* コインボタンは枚数なしで表示する（ナビゲーションは可能） */
      })
    return () => {
      alive = false
    }
  }, [eventId, userId, linesCompleted])
  return gachaCoins
}
