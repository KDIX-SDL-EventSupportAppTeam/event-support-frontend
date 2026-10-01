import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BOOTH_IMAGE_NUMBERS, boothImageNumber, boothImageSrc } from '@/shared/lib/boothImage'

/**
 * ブースイメージ（モーダル表示用の大きい写真）は「番号 → public/booth/image/ のファイル名」を
 * フロントが持つ方式で、サーバーは URL を返さない（docs/reference/assets.md「booth」）。
 * アイコン（boothIcon.ts・tests/unit/booth-icon.test.ts）とは別素材・別ディレクトリ。
 * 素材を足し引きしたときに boothImage.ts の番号表がずれると、
 * 壊れた img が無言で並ぶだけなので、ファイルと突き合わせておく。
 */
const boothImageDir = fileURLToPath(new URL('../../public/booth/image', import.meta.url))

describe('boothImage の番号表は public/booth/image/ と一致する', () => {
  it('ファイル名から読める番号と BOOTH_IMAGE_NUMBERS が一致する', () => {
    const fromFiles = readdirSync(boothImageDir)
      .map((name) => /^booth-(\d{2})\.png$/.exec(name))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b)

    expect(fromFiles).toEqual([...BOOTH_IMAGE_NUMBERS].sort((a, b) => a - b))
  })

  it('boothImageSrc が返すパスは実在する', () => {
    for (const n of BOOTH_IMAGE_NUMBERS) {
      const src = boothImageSrc(String(n))
      expect(src).not.toBeNull()
      expect(existsSync(join(boothImageDir, '..', src!.replace(/^\/booth\//, '')))).toBe(true)
    }
  })
})

describe('display_code の解釈', () => {
  it('ゼロ詰め・全角・前後の空白を吸収する', () => {
    expect(boothImageSrc('7')).toBe('/booth/image/booth-07.png')
    expect(boothImageSrc('07')).toBe('/booth/image/booth-07.png')
    expect(boothImageSrc('０７')).toBe('/booth/image/booth-07.png')
    expect(boothImageSrc(' 7 ')).toBe('/booth/image/booth-07.png')
    expect(boothImageSrc('39')).toBe('/booth/image/booth-39.png')
  })

  it('番号が無い・数字でない・範囲外なら null', () => {
    expect(boothImageNumber(null)).toBeNull()
    expect(boothImageNumber(undefined)).toBeNull()
    expect(boothImageNumber('')).toBeNull()
    expect(boothImageNumber('A-3')).toBeNull()
    expect(boothImageNumber('3F')).toBeNull()
    expect(boothImageNumber('99')).toBeNull()
    expect(boothImageNumber('0')).toBeNull()
  })
})
