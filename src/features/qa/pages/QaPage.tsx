import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createParticipantClient } from '@/shared/data/createParticipantClient'
import type { QaItem } from '@/shared/types/eventContent'

export function QaPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<QaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    const client = createParticipantClient()
    ;(async () => {
      try {
        setItems(await client.getQa())
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="qa-page container">
      <h1 className="main-title">Q&A</h1>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="qa-list">
          {/* 質問だけを並べ、タップした項目の答えだけを開く（全文を並べると長くて探せない） */}
          {items.map((item, index) => {
            const open = openIndex === index
            return (
              <div key={index} className={`qa-item${open ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="question"
                  aria-expanded={open}
                  aria-controls={`qa-answer-${index}`}
                  onClick={() => setOpenIndex(open ? null : index)}
                >
                  <span className="q-icon">Q</span>
                  <p>{item.question}</p>
                  <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'} qa-chevron`} aria-hidden />
                </button>
                {open ? (
                  <div className="answer" id={`qa-answer-${index}`}>
                    <span className="a-icon">A</span>
                    <p>{item.answer}</p>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
      <div className="footer">
        <button type="button" className="checkin-home-button" onClick={() => navigate('/home')}>
          ホームに戻る
        </button>
      </div>
    </div>
  )
}
