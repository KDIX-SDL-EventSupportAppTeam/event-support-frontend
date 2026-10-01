import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BOOTH_ICON_NUMBERS, boothIconNumber, boothIconSrc } from '@/shared/lib/boothIcon'

/**
 * ブースアイコンは「番号 → public/booth/ のファイル名」をフロントが持つ方式で、
 * サーバーは URL を返さない（docs/reference/assets.md「booth」）。
 * 素材を足し引きしたときに boothIcon.ts の番号表がずれると、
 * 壊れた img が無言で並ぶだけなので、ファイルと突き合わせておく。
 */
const boothDir = fileURLToPath(new URL('../../public/booth', import.meta.url))

describe('boothIcon の番号表は public/booth/ と一致する', () => {
  it('ファイル名から読める番号と BOOTH_ICON_NUMBERS が一致する', () => {
    const fromFiles = readdirSync(boothDir)
      .map((name) => /^booth-(\d{2})\.png$/.exec(name))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b)

    expect(fromFiles).toEqual([...BOOTH_ICON_NUMBERS].sort((a, b) => a - b))
  })

  it('boothIconSrc が返すパスは実在する', () => {
    for (const n of BOOTH_ICON_NUMBERS) {
      const src = boothIconSrc(String(n))
      expect(src).not.toBeNull()
      expect(existsSync(join(boothDir, '..', src!.replace(/^\//, '')))).toBe(true)
    }
  })
})

describe('display_code の解釈', () => {
  it('ゼロ詰め・全角・前後の空白を吸収する', () => {
    expect(boothIconSrc('7')).toBe('/booth/booth-07.png')
    expect(boothIconSrc('07')).toBe('/booth/booth-07.png')
    expect(boothIconSrc('０７')).toBe('/booth/booth-07.png')
    expect(boothIconSrc(' 7 ')).toBe('/booth/booth-07.png')
    expect(boothIconSrc('39')).toBe('/booth/booth-39.png')
  })

  it('番号が無い・数字でない・範囲外なら null', () => {
    expect(boothIconNumber(null)).toBeNull()
    expect(boothIconNumber(undefined)).toBeNull()
    expect(boothIconNumber('')).toBeNull()
    expect(boothIconNumber('A-3')).toBeNull()
    expect(boothIconNumber('3F')).toBeNull()
    expect(boothIconNumber('99')).toBeNull()
    expect(boothIconNumber('0')).toBeNull()
  })
})
