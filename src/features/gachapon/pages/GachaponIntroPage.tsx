import { useNavigate } from 'react-router-dom'

/**
 * 注意事項画面。API は呼ばない。
 * 立会い無しで、操作はこの3画面だけで完結する（G-10）。
 * 旧実装にあった立会いを促す文言は使わない。
 */
export function GachaponIntroPage() {
  const navigate = useNavigate()
  return (
    <div className="gachapon-container">
      <div className="card p-4">
        <h1 className="text-center display-1 mb-3">⚠️</h1>
        <h4 className="text-center mb-4">
          ガチャポンコイン
          <br />
          ご利用の注意
        </h4>
        <ul className="list-group list-group-flush mb-4">
          <li
            className="list-group-item"
            style={{ fontSize: '1.1rem', lineHeight: 1.5, fontWeight: 500 }}
          >
            ・一度使用したコインを元に戻すことはできません
            <br />
            <br />
            ・次の画面で「使用する」を押すと、その場でコインが1枚消費されます
          </li>
        </ul>
        <div className="d-grid gap-4">
          <button
            type="button"
            className="btn btn-primary btn-proceed"
            onClick={() => navigate('/gachapon/use')}
          >
            ガチャポンに進む
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-back"
            onClick={() => navigate('/home')}
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  )
}
