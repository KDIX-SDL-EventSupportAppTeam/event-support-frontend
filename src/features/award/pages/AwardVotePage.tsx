import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createParticipantClient } from '@/shared/data/createParticipantClient'
import { ApiError } from '@/shared/api/unwrap'
import { formatClientError } from '@/shared/lib/formatClientError'
import { useAuthStore } from '@/shared/auth/authStore'
import type { LegacyBooth } from '@/shared/types/legacyBooth'
import type { Award } from '@/shared/types/award'

/**
 * アワード投票（issue #89）。投票できるのはチェックイン済みのブースだけ。
 * 関門はサーバー（`POST /events/:id/awards/vote` が 403 NOT_CHECKED_IN / 409 VOTING_CLOSED を返す）。
 * UI の選択肢制限は表示の都合であって関門ではない。
 */
export function AwardVotePage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)
  const [loading, setLoading] = useState(true)
  const [votingClosed, setVotingClosed] = useState(false)
  const [awards, setAwards] = useState<Award[]>([])
  const [checkedBooths, setCheckedBooths] = useState<LegacyBooth[]>([])
  /** キーは award_id。未投票の賞はキーごと持たない */
  const [votes, setVotes] = useState<Record<string, string>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!eventId || !userId) {
      setLoading(false)
      return
    }
    const client = createParticipantClient()
    ;(async () => {
      try {
        const snap = await client.getAwardVoteSnapshot(eventId, userId)
        setVotingClosed(!snap.votingOpen)
        setAwards(snap.awards)
        setCheckedBooths(snap.checkedBooths)
        setVotes(snap.votes)
      } catch (e) {
        setLoadError(formatClientError(e, 'データの取得に失敗しました。'))
      } finally {
        setLoading(false)
      }
    })()
  }, [eventId, userId])

  function handleSelect(awardId: string, boothId: string | null) {
    setSaved(false)
    setVotes((prev) => {
      const next = { ...prev }
      if (!boothId) {
        delete next[awardId]
        return next
      }
      next[awardId] = boothId
      return next
    })
  }

  function boothName(id: string | undefined): string {
    if (!id) return '未投票'
    return checkedBooths.find((b) => b.booth_id === id)?.booth_name ?? '不明なブース'
  }

  async function saveAndGoHome() {
    if (!eventId || !userId) return
    setSaveError(null)
    setSaving(true)
    try {
      const client = createParticipantClient()
      // 全票を1回で送る（1票ずつのループにしない）。null は取り消し
      const payload: Record<string, string | null> = {}
      for (const a of awards) payload[a.id] = votes[a.id] ?? null
      const snap = await client.saveVotes(eventId, userId, payload)
      setVotes(snap.votes)
      setSaved(true)
      setTimeout(() => navigate('/home'), 700)
    } catch (e) {
      if (e instanceof ApiError && e.code === 'VOTING_CLOSED') {
        setVotingClosed(true)
        setSaveError('アワード投票は締め切られました。')
      } else if (e instanceof ApiError && e.code === 'NOT_CHECKED_IN') {
        setSaveError('チェックインしていないブースが選ばれています。選び直してください。')
      } else {
        setSaveError(formatClientError(e, '投票の保存に失敗しました。'))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="award-vote-page container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">読み込み中</span>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="award-vote-page container py-4">
        <div className="alert alert-danger text-center">{loadError}</div>
        <div className="d-flex gap-2 mt-3">
          <button type="button" className="btn-custom-secondary w-100" onClick={() => navigate('/home')}>
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="award-vote-page container py-3">
      {votingClosed ? (
        <div className="vote-result-container">
          <div className="vote-result-header text-center">
            <img src="/feedback/popup-vote-complete.png" alt="" className="vote-result-image" />
            {/* 「準備中」と出さない。開始前か締切後かのどちらかであることを明示する（issue #89 §4） */}
            <h1 className="visually-hidden">アワード投票は受け付けていません</h1>
            <p>
              アワード投票は現在受け付けていません。
              <br />
              （開始前、または締め切り後です）
            </p>
            {awards.length > 0 ? <p className="mb-0">これまでの投票内容は以下の通りです。</p> : null}
          </div>
          <div className="vote-result-list">
            {awards.map((award) => (
              <div key={award.id} className="vote-result-row">
                <span className="award-name">{award.name}</span>
                <span className={`award-arrow color-${award.color}`}>&gt;&gt;&gt;</span>
                <div className={`booth-name-box border-${award.color}`}>{boothName(votes[award.id])}</div>
              </div>
            ))}
          </div>
          <div className="d-flex gap-2 mt-4">
            <button type="button" className="btn-custom-secondary w-100" onClick={() => navigate('/home')}>
              ホームに戻る
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <h1 className="h3">アワード投票</h1>
            <p className="mb-0">チェックインしたブースにだけ投票できます</p>
          </div>
          {checkedBooths.length > 0 ? (
            awards.map((award) => (
              <div key={award.id} className="award-item mb-3">
                <div className="award-title-container">
                  <div className={`award-underline bg-${award.color}`} aria-hidden />
                  <label htmlFor={`vote-${award.id}`} className="form-label fw-bold">
                    {award.name}
                  </label>
                </div>
                <p className="form-text mt-0 mb-2">{award.description}</p>
                <div className="input-group">
                  <select
                    id={`vote-${award.id}`}
                    className="form-select"
                    value={votes[award.id] ?? ''}
                    onChange={(e) => handleSelect(award.id, e.target.value || null)}
                  >
                    <option value="">ブースを選択してください</option>
                    {checkedBooths.map((booth) => (
                      <option key={booth.booth_id} value={booth.booth_id}>
                        {booth.booth_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={!votes[award.id]}
                    onClick={() => handleSelect(award.id, null)}
                    style={{ borderTopRightRadius: 10, borderBottomRightRadius: 10 }}
                  >
                    クリア
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="alert alert-info text-center">
              <p className="mb-0">
                ブースにチェックインすると投票できます。
                <br />
                会場をまわってチェックインしてから、またお越しください。
              </p>
            </div>
          )}
          {saveError ? <p className="text-danger small text-center">{saveError}</p> : null}
          {saved ? <p className="text-success small text-center">投票を保存しました。</p> : null}
          {checkedBooths.length > 0 ? (
            <div className="d-flex gap-2 mt-4">
              <button
                type="button"
                className="btn-custom-secondary w-100"
                onClick={() => void saveAndGoHome()}
                disabled={saving}
              >
                {saving ? '保存中…' : '保存して戻る'}
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2 mt-4">
              <button type="button" className="btn-custom-secondary w-100" onClick={() => navigate('/home')}>
                ホームに戻る
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
