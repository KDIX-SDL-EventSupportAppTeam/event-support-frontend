import type { PreSurveyAnswerValue } from '@/features/entry/types/presurvey'
import type { DisplaySurveyQuestion } from '@/features/entry/lib/deriveSurveyQuestions'

/**
 * 質問 1 件の入力欄。`answer_type` に応じて描画を切り替える。
 * 選択肢は常にサーバーが返した `options` をそのまま描画する（分野名等をハードコードしない。P-10）。
 * 値の保持と設問間の連動は親（SurveyStep + deriveSurveyQuestions）が担当し、ここは表示と onChange のみ。
 * `notice` が付いた設問は、依存元が未選択で選択肢を出せない状態なので案内文だけを出す。
 */
export function PreSurveyQuestionField({
  question,
  value,
  onChange,
}: {
  question: DisplaySurveyQuestion
  value: PreSurveyAnswerValue | undefined
  onChange: (value: PreSurveyAnswerValue) => void
}) {
  const selected = Array.isArray(value) ? value : []

  return (
    <fieldset className="mb-4">
      <legend className="form-label h6 mb-2">
        {question.label}
        {question.required ? <span className="text-danger ms-1">*</span> : null}
      </legend>

      {question.notice ? <p className="form-text mb-0">{question.notice}</p> : null}

      {question.answer_type === 'single'
        ? question.options.map((option) => (
            <div className="form-check" key={option.value}>
              <input
                className="form-check-input"
                type="radio"
                id={`${question.id}-${option.value}`}
                name={question.id}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              <label className="form-check-label" htmlFor={`${question.id}-${option.value}`}>
                {option.label}
              </label>
            </div>
          ))
        : null}

      {question.answer_type === 'multi'
        ? question.options.map((option) => (
            <div className="form-check" key={option.value}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`${question.id}-${option.value}`}
                checked={selected.includes(option.value)}
                onChange={() =>
                  onChange(
                    selected.includes(option.value)
                      ? selected.filter((v) => v !== option.value)
                      : [...selected, option.value],
                  )
                }
              />
              <label className="form-check-label" htmlFor={`${question.id}-${option.value}`}>
                {option.label}
              </label>
            </div>
          ))
        : null}

      {question.answer_type === 'text' ? (
        <textarea
          id={question.id}
          className="form-control"
          rows={3}
          value={typeof value === 'string' ? value : ''}
          onChange={(ev) => onChange(ev.target.value)}
        />
      ) : null}
    </fieldset>
  )
}
