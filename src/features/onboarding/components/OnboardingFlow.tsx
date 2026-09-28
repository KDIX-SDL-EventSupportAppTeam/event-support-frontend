import { useEffect, useRef, useState } from 'react'
import { ONBOARDING_SLIDES } from '@/features/onboarding/config/slides'
import type { OnboardingSlide } from '@/features/onboarding/config/slides'
import '@/features/onboarding/styles/onboarding.scss'

const LAST_INDEX = ONBOARDING_SLIDES.length - 1

/** モックアップの下に普通に並べるイラスト（横長の図解やアイコンの列）。 */
function belowIllustrations(slide: OnboardingSlide) {
  return slide.illustrations.filter((illustration) => illustration.placement === 'below')
}

/**
 * アプリ本体へ初めて入るときに1回だけ表示するオンボーディング（横スワイプ4枚）。
 * 仕様: docs/specs/design-refresh-2026/06-onboarding.md
 *
 * ライブラリを増やさず CSS の scroll-snap でスワイプを実現する。
 * スワイプできない利用者のために「次へ」ボタンだけで最後まで進められる。
 *
 * 単一 URL（`/e/:eventId`）の中の一段階なので、自分では遷移せず完了を呼び出し側へ返す。
 * 既読の記録もサーバー側（`POST me/onboarding`）で行うため、ここでは扱わない。
 */
export function OnboardingFlow({ onFinish }: { onFinish: () => void }) {
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
    onFinish()
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
        <img className="onboarding-logo pf-logo" src="/brand/logo-protofes.png" alt="PRoToFES" />
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
            {/*
              モックアップはアプリの画面そのもの。イラストを画面の上に重ねると画面が
              何枚も積み重なって見えるため、外側の余白（aside-*）か下（below）にだけ置く。
              どこに置くかは slides.ts の placement が持つ。
            */}
            <div className="onboarding-art">
              <div className="onboarding-mockup-frame">
                <div className="onboarding-mockup-stage">
                  <img className="onboarding-mockup" src={slide.mockup.src} alt={slide.mockup.alt} />
                  {slide.illustrations
                    .filter((illustration) => illustration.placement !== 'below')
                    .map((illustration) => (
                      <img
                        key={illustration.src}
                        src={illustration.src}
                        alt={illustration.alt}
                        // はみ出し配置では大きさも位置も placement のクラスが決めるので
                        // 通常配置用の className（幅を rem で持つ）は付けない
                        className={`onboarding-aside onboarding-${illustration.placement}`}
                      />
                    ))}
                </div>
              </div>
              {belowIllustrations(slide).length > 0 ? (
                <div className="onboarding-art-row">
                  {belowIllustrations(slide).map((illustration) => (
                    <img
                      key={illustration.src}
                      src={illustration.src}
                      alt={illustration.alt}
                      className={illustration.className}
                    />
                  ))}
                </div>
              ) : null}
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
