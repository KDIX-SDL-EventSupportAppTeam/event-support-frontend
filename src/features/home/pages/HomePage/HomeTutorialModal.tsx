import { useState } from 'react'
import { MAX_GACHAPON_COINS } from '@/shared/config/gachapon'

const STEPS = [
  {
    title: 'PRoToFESへようこそ！',
    text: 'このアプリでは、イベントを楽しみながらビンゴを完成させることができます。',
  },
  {
    title: 'BINGOカードの使い方',
    text: '各ブースでチェックインすると、ビンゴカードに色が付きます。縦・横・斜めのいずれかがそろうとビンゴ達成です。マスをタップするとブースの説明を表示できます。',
  },
  {
    title: 'コインとガチャポン',
    text: `ビンゴの数に応じてコインを最大${MAX_GACHAPON_COINS}枚までゲットできます。コインを使ってガチャポンを回すことができます。`,
  },
  {
    title: 'チェックインの方法',
    text: 'チェックイン画面から各ブースのQRコードを読み取るとチェックインが完了します。',
  },
  {
    title: 'PRoToFESを始めましょう！',
    text: 'イベントを楽しんで、ビンゴを完成させましょう！',
  },
] as const

type Props = {
  onClose: () => void
}

export function HomeTutorialModal({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const slide = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="home-tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="home-tutorial-card">
        <div className="home-tutorial-visual" aria-hidden>
          {isLast ? (
            <span className="home-tutorial-final-emoji" aria-hidden>
              🎉
            </span>
          ) : (
            <span className="home-tutorial-step-emoji" aria-hidden>
              {['📱', '🎯', '🪙', '📷'][step] ?? '✨'}
            </span>
          )}
        </div>
        <div className="home-tutorial-text">
          <h2 id="tutorial-title" className={isLast ? 'home-tutorial-final-title' : undefined}>
            {slide.title}
          </h2>
          <p>{slide.text}</p>
        </div>
        <div className="home-tutorial-nav">
          <div className="home-tutorial-dots">
            {STEPS.map((_, i) => (
              <span key={i} className={i === step ? 'active' : undefined} />
            ))}
          </div>
          <div className="home-tutorial-buttons">
            {step > 0 ? (
              <button type="button" className="home-tutorial-btn home-tutorial-btn-back" onClick={() => setStep((s) => s - 1)}>
                ←
              </button>
            ) : (
              <span className="home-tutorial-btn-spacer" />
            )}
            {!isLast ? (
              <button type="button" className="home-tutorial-btn home-tutorial-btn-next" onClick={() => setStep((s) => s + 1)}>
                次へ
              </button>
            ) : (
              <button type="button" className="home-tutorial-btn home-tutorial-btn-start" onClick={onClose}>
                START
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
