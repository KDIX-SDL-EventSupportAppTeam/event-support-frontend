/**
 * ホームの「X にポストする」ボタン。
 * 見た目・クリックハンドリング・アクセシビリティだけを持つ。
 * **文面の内容や URL の組み立ては知らない**（issue #63 の責務分離）。
 */

type Props = {
  /** クリック時の処理（確認モーダルを開くなど。実際の遷移は呼び出し側） */
  onClick: () => void
}

export function XShareButton({ onClick }: Props) {
  return (
    <button
      type="button"
      className="btn btn-sub-action w-100"
      onClick={onClick}
      aria-label="このイベントの様子を X にポストする"
    >
      <i className="bi bi-twitter-x me-1" aria-hidden="true" />
      X にポストする
    </button>
  )
}
