import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createParticipantClient } from '@/data/createParticipantClient'
import { useAuthStore } from '@/stores/authStore'
import type { LegacyBooth } from '@/types/legacyBooth'
import type { VoteAwardCategory } from '@/types/voteAward'

export function AwardVotePage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)
  const [loading, setLoading] = useState(true)
  const [votingClosed, setVotingClosed] = useState(false)
  const [awards, setAwards] = useState<VoteAwardCategory[]>([])
  const [checkedBooths, setCheckedBooths] = useState<LegacyBooth[]>([])
  const [votes, setVotes] = useState<Record<string, string | null>>({})
  const [saveError, setSaveError] = useState<string | null>(null)

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
      } catch {
        setSaveError('データの取得に失敗しました。')
      } finally {
        setLoading(false)
      }
    })()
  }, [eventId, userId])

  function handleSelect(awardName: string, boothId: string | null) {
    setVotes((prev) => {
      if (!boothId) return { ...prev, [awardName]: null }
      for (const name of Object.keys(prev)) {
        if (name !== awardName && prev[name] === boothId) {
          window.alert('このブースは既に他のアワードに選ばれています。')
          return { ...prev, [awardName]: null }
        }
      }
      return { ...prev, [awardName]: boothId }
    })
  }

  function clearVote(awardName: string) {
    setVotes((v) => ({ ...v, [awardName]: null }))
  }

  function boothName(id: string | null): string | null {
    if (!id) return null
    return checkedBooths.find((b) => b.booth_id === id)?.booth_name ?? '不明なブース'
  }

  async function saveAndGoHome() {
    if (!userId) return
    setSaveError(null)
    try {
      const client = createParticipantClient()
      await client.saveVotes(userId, votes)
      navigate('/home')
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '投票の保存に失敗しました。')
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

  return (
    <div className="award-vote-page container py-3">
      {votingClosed ? (
        <div className="vote-result-container">
          <div className="vote-result-header text-center">
            <h1>投票期間が終了しました</h1>
            <p>あなたの投票内容は以下の通りです。</p>
          </div>
          <div className="vote-result-list">
            {awards.map((award) => (
              <div key={award.name} className="vote-result-row">
                <span className="award-name">{award.name}</span>
                <span className={`award-arrow color-${award.color}`}>&gt;&gt;&gt;</span>
                <div className={`booth-name-box border-${award.color}`}>{boothName(votes[award.name] ?? null) || '未投票'}</div>
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
            <p className="mb-0">チェックインしたブースのみ投票可能です</p>
          </div>
          {checkedBooths.length > 0 ? (
            awards.map((award) => (
              <div key={award.name} className="award-item mb-3">
                <div className="award-title-container">
                  <div className={`award-underline bg-${award.color}`} aria-hidden />
                  <label htmlFor={`vote-${award.name}`} className="form-label fw-bold">
                    {award.name}
                  </label>
                </div>
                <p className="form-text mt-0 mb-2">{award.description}</p>
                <div className="input-group">
                  <select
                    id={`vote-${award.name}`}
                    className="form-select"
                    value={votes[award.name] ?? ''}
                    onChange={(e) => handleSelect(award.name, e.target.value || null)}
                  >
                    <option value="" disabled>
                      ブースを選択してください
                    </option>
                    {checkedBooths.map((booth) => (
                      <option key={booth.booth_id} value={booth.booth_id}>
                        {booth.booth_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={!votes[award.name]}
                    onClick={() => clearVote(award.name)}
                    style={{ borderTopRightRadius: 10, borderBottomRightRadius: 10 }}
                  >
                    クリア
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="alert alert-warning text-center">
              <p className="mb-0">投票するには、まずブースでチェックインを行ってください。</p>
            </div>
          )}
          {saveError ? <p className="text-danger small text-center">{saveError}</p> : null}
          <div className="d-flex gap-2 mt-4">
            <button type="button" className="btn-custom-secondary w-100" onClick={() => void saveAndGoHome()}>
              保存して戻る
            </button>
          </div>
        </>
      )}
    </div>
  )
}
