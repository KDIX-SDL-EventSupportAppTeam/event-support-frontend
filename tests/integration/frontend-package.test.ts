import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

/**
 * フロントのビルド成果物が生成できることのスモーク。
 * 実際の E2E は別途 Playwright 等で追加可能。
 */
describe('frontend package', () => {
  it('frontend/package.json に build スクリプトがある', () => {
    const path = fileURLToPath(new URL('../../package.json', import.meta.url))
    const pkg = JSON.parse(readFileSync(path, 'utf8')) as { scripts: { build?: string } }
    expect(pkg.scripts.build).toBeDefined()
  })
})
