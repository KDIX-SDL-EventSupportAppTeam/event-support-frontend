import { describe, expect, it } from 'vitest'
import { SURVEY_URL_MAX_LENGTH, validateSurveyUrl } from '@/shared/lib/validateSurveyUrl'

describe('validateSurveyUrl（issue #177）', () => {
  it('http(s) の正しい URL は null', () => {
    expect(validateSurveyUrl('https://forms.gle/abc123')).toBeNull()
    expect(validateSurveyUrl('http://example.com/a?b=c')).toBeNull()
  })

  it('http(s) 以外のスキームは弾く', () => {
    expect(validateSurveyUrl('javascript:alert(1)')).toContain('http(s)://')
    expect(validateSurveyUrl('forms.gle/abc')).toContain('http(s)://')
  })

  it('2048 文字を超えると弾く（境界: 2048 は通る）', () => {
    const base = 'https://example.com/'
    expect(validateSurveyUrl(base + 'a'.repeat(SURVEY_URL_MAX_LENGTH - base.length))).toBeNull()
    expect(validateSurveyUrl(base + 'a'.repeat(SURVEY_URL_MAX_LENGTH - base.length + 1))).toContain('2048')
  })

  it('パースできない URL は「URL の形式が正しくありません」', () => {
    expect(validateSurveyUrl('https://')).toBe('URL の形式が正しくありません')
    expect(validateSurveyUrl('http://')).toBe('URL の形式が正しくありません')
  })
})
