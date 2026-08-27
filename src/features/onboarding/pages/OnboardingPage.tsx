import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ONBOARDING_SLIDES } from '@/features/onboarding/config/slides'
import { markOnboardingSeen } from '@/shared/lib/onboardingSeen'
import '@/features/onboarding/styles/onboarding.scss'

const LAST_INDEX = ONBOARDING_SLIDES.length - 1

/**
 * 初回ログイン後に自動で1回だけ表示するオンボーディング（横スワイプ4枚）。
 * 仕様: docs/specs/design-refresh-2026/06-onboarding.md
 *
 * ライブラリを増やさず CSS の scroll-snap でスワイプを実現する。
 * スワイプできない利用者のために「次へ」ボタンだけで最後まで進められる。
 * ボトムナビは出さないため ParticipantLayout の外（router/index.tsx）に置くこと。
 */
export function OnboardingPage() {
  const navigate = useNavigate()
  const trackRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)

  // スワイプでスライドが変わった時に、ドットとボタン文言をスクロール位置から追従させる
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    function handleScroll() {
      if (!track) return
      const index = Math.round(track.scrollLeft / track.clientWidth)
      setCurrent(Math.min(Math.max(index, 0), LAST_INDEX))
    }

    track.addEventListener('scroll', handleScroll, { passive: true })
    return () => track.removeEventListener('scroll', handleScroll)
  }, [])

  function finish() {
    markOnboardingSeen()
    navigate('/home', { replace: true })
  }

  function goNext() {
    if (current >= LAST_INDEX) {
      finish()
      return
    }
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: track.clientWidth * (current + 1), behavior: 'smooth' })
  }

  const isLast = current === LAST_INDEX

  return (
    <div className="onboarding-page">
      <img className="onboarding-background" src="/background/onboarding-scene.png" alt="" aria-hidden />

      <div className="onboarding-header">
        <img className="onboarding-logo" src="/brand/logo-protofes.png" alt="PRoToFES" />
        <button type="button" className="onboarding-skip" onClick={finish}>
          スキップ
        </button>
      </div>

      <div className="onboarding-track" ref={trackRef} role="group" aria-label="オンボーディング">
        {ONBOARDING_SLIDES.map((slide, index) => (
          <section
            key={slide.id}
            className="onboarding-slide"
            aria-hidden={index !== current}
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${ONBOARDING_SLIDES.length}`}
          >
            <div className="onboarding-mockup-frame">
              <img className="onboarding-mockup" src={slide.mockup.src} alt={slide.mockup.alt} />
              <div className="onboarding-illustrations">
                {slide.illustrations.map((illustration) => (
                  <img
                    key={illustration.src}
                    src={illustration.src}
                    alt={illustration.alt}
                    className={illustration.className}
                  />
                ))}
              </div>
            </div>
            <h2 className="onboarding-title">{slide.title}</h2>
            <p className="onboarding-description">{slide.description}</p>
            {index === 0 ? (
              <img
                className="onboarding-gesture-hint"
                src="/icon/action/gesture-swipe.png"
                alt="左右にスワイプして進めます"
              />
            ) : null}
          </section>
        ))}
      </div>

      <div className="onboarding-progress">
        <div className="onboarding-dots" aria-hidden>
          {ONBOARDING_SLIDES.map((slide, index) => (
            <span key={slide.id} className={index === current ? 'active' : undefined} />
          ))}
        </div>
        <span className="onboarding-page-count" aria-hidden>
          {current + 1} / {ONBOARDING_SLIDES.length}
        </span>
      </div>

      <button type="button" className="onboarding-next" onClick={goNext}>
        <img src="/ui/button/bottom-bar-primary.png" alt="" aria-hidden />
        <span>{isLast ? 'はじめる' : '次へ'}</span>
      </button>
    </div>
  )
}
