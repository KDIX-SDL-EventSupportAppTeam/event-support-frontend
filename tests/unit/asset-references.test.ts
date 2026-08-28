import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * src/ から参照している画像パスが public/ に実在することを検査する。
 *
 * 画像パスの間違いは無言で壊れる（壊れた img は多くの場合ページを落とさない）ため、
 * 目視でしか気づけない。design-refresh-2026/02-legacy-asset-cleanup.md で
 * 「参照パスの不整合は解消済み」とした状態を、機械的に維持するためのテスト。
 */
const srcDir = fileURLToPath(new URL('../../src', import.meta.url))
const publicDir = fileURLToPath(new URL('../../public', import.meta.url))

const SOURCE_EXT = /\.(tsx?|scss|css)$/
const IMAGE_REF = /['"`(](\/[A-Za-z0-9_\-./]+\.(?:png|jpe?g|svg|webp|gif|ico))['"`)]/g

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (SOURCE_EXT.test(name)) out.push(full)
  }
  return out
}

const references = new Map<string, string[]>()
for (const file of walk(srcDir)) {
  const text = readFileSync(file, 'utf-8')
  for (const m of text.matchAll(IMAGE_REF)) {
    const path = m[1]
    const list = references.get(path) ?? []
    list.push(file.slice(srcDir.length + 1).split(sep).join('/'))
    references.set(path, list)
  }
}

describe('src/ が参照する画像は public/ に実在する', () => {
  it('参照を1件以上拾えている（正規表現が壊れていないことの確認）', () => {
    expect(references.size).toBeGreaterThan(0)
  })

  const cases = [...references.entries()].map(([path, files]) => ({ path, files: files.join(', ') }))
  it.each(cases)('$path（$files）', ({ path }) => {
    expect(existsSync(join(publicDir, path.replace(/^\//, '')))).toBe(true)
  })
})

describe('legacy 素材を新規実装から参照しない', () => {
  // docs/reference/assets.md:「public/legacy/ は前年版。新規実装では参照しない。」
  it('src/ に /legacy/ の画像参照が無い', () => {
    const legacy = [...references.keys()].filter((p) => p.startsWith('/legacy/'))
    expect(legacy).toEqual([])
  })
})
