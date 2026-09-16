type Props = {
  /** 達成済みライン数。`card.lines_completed` をそのまま渡す（フロントで数え直さない）。 */
  current: number
  /** ステッパーの段階数（= ガチャポンコインの最大所有枚数）。 */
  max: number
}

/**
 * ビンゴ進捗ステッパー。4段階の丸連番インジケータを CSS だけで組む。
 * 仕様: docs/specs/design-refresh-2026/04-home-and-bingo.md「ビンゴ進捗ステッパー」
 * 素材は無い。現在値はサーバーの lines_completed をそのまま使い、フロントで数え直さない。
 */
export function BingoProgressStepper({ current, max }: Props) {
  const steps = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className="bingo-progress-stepper" role="img" aria-label={`ビンゴ ${current}/${max}本達成`}>
      {steps.map((step, i) => {
        const achieved = step <= current
        return (
          <div className="bingo-progress-stepper-item" key={step}>
            {i > 0 ? (
              <span
                className={
                  'bingo-progress-stepper-line' + (step <= current ? ' bingo-progress-stepper-line-achieved' : '')
                }
                aria-hidden
              />
            ) : null}
            <span
              className={
                'bingo-progress-stepper-dot' + (achieved ? ' bingo-progress-stepper-dot-achieved' : '')
              }
              aria-hidden
            >
              {step}
            </span>
          </div>
        )
      })}
    </div>
  )
}
