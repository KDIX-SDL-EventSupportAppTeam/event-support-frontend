import type { ReactNode } from 'react'

/**
 * 事前アンケート各画面の共通枠（中央寄せのカード）。
 * Bootstrap のクラスのみを使い、feature 外に依存を持たない。
 */
export function PreSurveyLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6">
          <div className="card p-4">
            <div className="card-body">
              <h1 className="card-title text-center h3 mb-1">{title}</h1>
              {subtitle ? <p className="text-center text-muted small mb-4">{subtitle}</p> : <div className="mb-4" />}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
