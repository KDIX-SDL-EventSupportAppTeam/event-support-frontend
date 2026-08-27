import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { contrastRatio, extractCssCustomProperties, extractScssVariables } from './contrast'

const tokensPath = fileURLToPath(new URL('../../src/shared/styles/tokens.scss', import.meta.url))
const legacyAppPath = fileURLToPath(new URL('../../src/shared/styles/legacy-app.scss', import.meta.url))

const tokens = extractCssCustomProperties(readFileSync(tokensPath, 'utf-8'))
const legacyAppVars = extractScssVariables(readFileSync(legacyAppPath, 'utf-8'))

const WHITE = '#ffffff'

describe('design-tokens: コントラスト比（WCAG AA 4.5 以上）', () => {
  it.each([
    ['--pf-ink-strong', '--pf-yellow'],
    ['--pf-ink', '--pf-yellow'],
    ['--pf-ink-strong', '--pf-orange'],
    ['--pf-ink', '--pf-cream-light'],
    ['--pf-ink', '--pf-surface'],
    ['--pf-ink-muted', '--pf-surface'],
    ['--pf-ink-muted', '--pf-cream-light'],
    ['--pf-ink-muted', '--pf-cream'],
  ])('%s × %s は 4.5 以上である', (fg, bg) => {
    expect(tokens[fg]).toBeDefined()
    expect(tokens[bg]).toBeDefined()
    const ratio = contrastRatio(tokens[fg], tokens[bg])
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('白 × --pf-yellow は 4.5 未満である（絶対に作ってはいけない組み合わせ）', () => {
    const ratio = contrastRatio(WHITE, tokens['--pf-yellow'])
    expect(ratio).toBeLessThan(4.5)
  })

  it('白 × --pf-orange は 4.5 未満である（絶対に作ってはいけない組み合わせ）', () => {
    const ratio = contrastRatio(WHITE, tokens['--pf-orange'])
    expect(ratio).toBeLessThan(4.5)
  })
})

describe('design-tokens: legacy-app.scss との二重管理の整合性', () => {
  it('$pf-yellow は tokens.scss の --pf-yellow と同じ値である', () => {
    expect(legacyAppVars['pf-yellow']).toBe(tokens['--pf-yellow'])
  })

  it('$pf-orange は tokens.scss の --pf-orange と同じ値である', () => {
    expect(legacyAppVars['pf-orange']).toBe(tokens['--pf-orange'])
  })
})
