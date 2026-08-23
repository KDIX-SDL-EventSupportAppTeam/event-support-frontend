import type {
  PreSurveyAnswerValue,
  PreSurveyQuestion,
} from '@/features/presurvey/types/presurvey'

/**
 * 質問 1 件の入力欄。質問定義（type）に応じて描画を切り替える。
 * 値の保持は親（PreSurveyFormPage）が担当し、ここは表示と onChange のみ。
 */
export function PreSurveyQuestionField({
  question,
  value,
  onChange,
}: {
  question: PreSurveyQuestion
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
      {question.help ? <p className="text-muted small mb-2">{question.help}</p> : null}

      {question.type === 'single'
        ? question.choices?.map((choice) => (
            <div className="form-check" key={choice.value}>
              <input
                className="form-check-input"
                type="radio"
                id={`${question.id}-${choice.value}`}
                name={question.id}
                checked={value === choice.value}
                onChange={() => onChange(choice.value)}
              />
              <label className="form-check-label" htmlFor={`${question.id}-${choice.value}`}>
                {choice.label}
              </label>
            </div>
          ))
        : null}

      {question.type === 'multi'
        ? question.choices?.map((choice) => (
            <div className="form-check" key={choice.value}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`${question.id}-${choice.value}`}
                checked={selected.includes(choice.value)}
                onChange={() =>
                  onChange(
                    selected.includes(choice.value)
                      ? selected.filter((v) => v !== choice.value)
                      : [...selected, choice.value],
                  )
                }
              />
              <label className="form-check-label" htmlFor={`${question.id}-${choice.value}`}>
                {choice.label}
              </label>
            </div>
          ))
        : null}

      {question.type === 'text' ? (
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
