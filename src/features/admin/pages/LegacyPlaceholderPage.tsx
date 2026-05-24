import { Link } from 'react-router-dom'

type Props = { title: string; backTo?: string }

export function LegacyPlaceholderPage({ title, backTo = '/home' }: Props) {
  return (
    <div className="container py-4">
      <h1 className="h4 mb-3">{title}</h1>
      <p className="text-muted">React 化リプレイス中です。旧 Vue と同じルートを維持しています。</p>
      <Link to={backTo} className="btn btn-outline-secondary btn-sm">
        戻る
      </Link>
    </div>
  )
}
