import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createParticipantClient } from '@/data/createParticipantClient'
import type { QaItem } from '@/types/eventContent'

export function QaPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<QaItem[]>([])
  const [loading, setLoading] = useState(true)

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
          {items.map((item, index) => (
            <div key={index} className="qa-item">
              <div className="question">
                <span className="q-icon">Q</span>
                <p>{item.question}</p>
              </div>
              <div className="answer">
                <span className="a-icon">A</span>
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
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
