import { useNavigate } from 'react-router-dom'

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
          <li className="list-group-item" style={{ fontSize: '1.1rem', lineHeight: 1.5, fontWeight: 500 }}>
            ・この画面はスタッフと一緒に操作してください
            <br />
            <br />
            ・一度使用したコインを元に戻すことはできません
          </li>
        </ul>
        <div className="d-grid gap-4">
          <button type="button" className="btn btn-primary btn-proceed" onClick={() => navigate('/gachapon/use')}>
            ガチャポンに進む
          </button>
          <button type="button" className="btn btn-secondary btn-back" onClick={() => navigate('/home')}>
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  )
}
