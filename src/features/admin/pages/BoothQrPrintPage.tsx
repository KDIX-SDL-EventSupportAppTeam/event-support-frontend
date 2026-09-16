import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { useAuthStore } from '@/shared/auth/authStore'
import { fetchAdminBoothSummaries, type AdminBoothSummary } from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'
import '@/features/admin/styles/booth-qr-print.scss'

/** A4 縦 1 枚に並べる枚数（2 列 × 4 行） */
const CARDS_PER_SHEET = 8

type QrCard = AdminBoothSummary & { qrSvg: string }

/** ブース番号の昇順（番号なしは末尾・名前順）。表示順を決めるだけ */
function compareBooths(a: AdminBoothSummary, b: AdminBoothSummary): number {
  if (a.display_code && b.display_code) {
    return a.display_code.localeCompare(b.display_code, 'ja', { numeric: true })
  }
  if (a.display_code) return -1
  if (b.display_code) return 1
  return a.name.localeCompare(b.name, 'ja')
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/**
 * 全ブースのチェックイン QR を一括生成し、A4 に 2×4 で並べて印刷するための画面。
 * サイドバーは印刷に不要なので AdminShell を使わず単独ページにしている。
 */
export function BoothQrPrintPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [cards, setCards] = useState<QrCard[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    async function load(id: string) {
      const booths = await fetchAdminBoothSummaries(id, { sort: 'name', order: 'asc' })
      const generated = await Promise.all(
        [...booths].sort(compareBooths).map(async (b) => ({
          ...b,
          // 印刷で潰れないよう SVG で出す
          qrSvg: b.checkin_url
            ? await QRCode.toString(b.checkin_url, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 })
            : '',
        })),
      )
      if (!cancelled) setCards(generated)
    }
    load(eventId).catch((e) => {
      if (!cancelled) setError(formatClientError(e, 'ブース取得に失敗しました'))
    })
    return () => {
      cancelled = true
    }
  }, [eventId])

  const sheets = cards ? chunk(cards, CARDS_PER_SHEET) : []

  return (
    <div className="booth-qr-print">
      <div className="booth-qr-print__toolbar d-print-none">
        <Link to="/admin/booths" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1" />
          ブース管理へ戻る
        </Link>
        <div className="flex-grow-1">
          <div className="fw-bold">ブースQRコード一覧（印刷用）</div>
          <div className="small text-muted">
            A4 縦・1 枚 {CARDS_PER_SHEET} ブース。印刷ダイアログでは「余白: なし」「背景のグラフィック: オン」を推奨
          </div>
        </div>
        <span className="badge bg-secondary">
          {cards ? `${cards.length} ブース / ${sheets.length} 枚` : error ? '取得失敗' : '読み込み中'}
        </span>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!cards || cards.length === 0}
          onClick={() => window.print()}
        >
          <i className="bi bi-printer me-1" />
          印刷する
        </button>
      </div>

      {error ? <div className="alert alert-danger mx-3 d-print-none">{error}</div> : null}
      {cards && cards.length === 0 ? (
        <div className="text-center text-muted py-5 d-print-none">ブースがまだありません</div>
      ) : null}

      {sheets.map((sheet, i) => (
        <section key={i} className="booth-qr-sheet" aria-label={`${i + 1} 枚目`}>
          {sheet.map((b) => (
            <article key={b.id} className="booth-qr-card">
              <header className="booth-qr-card__head">
                <span className="booth-qr-card__number">{b.display_code || '—'}</span>
                <span className="booth-qr-card__name">{b.name}</span>
              </header>
              <div className="booth-qr-card__body">
                {b.qrSvg ? (
                  <div
                    className="booth-qr-card__qr"
                    role="img"
                    aria-label={`${b.name} のチェックインQRコード`}
                    dangerouslySetInnerHTML={{ __html: b.qrSvg }}
                  />
                ) : (
                  <div className="booth-qr-card__qr booth-qr-card__qr--missing">URL未発行</div>
                )}
                <img src="/mascot/mascot-with-qr.png" alt="" className="booth-qr-card__mascot" />
              </div>
              <footer className="booth-qr-card__code">
                <span className="booth-qr-card__code-label">手動入力コード</span>
                <span className="booth-qr-card__code-value">{b.manual_code || '------'}</span>
              </footer>
            </article>
          ))}
        </section>
      ))}
    </div>
  )
}
