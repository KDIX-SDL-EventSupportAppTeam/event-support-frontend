import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="container vh-100 d-flex flex-column justify-content-center align-items-center">
      <img src="/logo.png" alt="Event Logo" className="img-fluid mb-5" style={{ maxWidth: 250 }} />
      <div className="d-grid gap-3 col-10 mx-auto">
        <Link to="/register" className="btn btn-primary btn-lg">
          新規登録
        </Link>
        <Link to="/login" className="btn btn-secondary btn-lg">
          ログイン
        </Link>
      </div>
    </div>
  )
}
