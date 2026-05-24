import { useNavigate } from 'react-router-dom'

export function GachaponCompletePage() {
  const navigate = useNavigate()
  return (
    <div className="gachapon-container">
      <div className="card p-4 text-center">
        <img src="/logo_main.png" alt="ProtoFes" className="logo mb-4" style={{ maxWidth: 150, height: 'auto' }} />
        <h1 className="mb-3 h3">ガチャポンコイン使用済</h1>
        <p className="lead mb-4">プロトフェスを引き続きお楽しみください</p>
        <div className="d-grid">
          <button type="button" className="btn btn-primary btn-back" onClick={() => navigate('/home')}>
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  )
}
