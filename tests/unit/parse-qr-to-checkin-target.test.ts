import { describe, expect, it } from 'vitest'
import { parseQrToCheckinTarget } from '@/features/checkin/lib/parseQrToCheckinTarget'

const BOOTH_ID = '20000000-0000-4000-8000-000000000021'

describe('parseQrToCheckinTarget（issue #168）', () => {
  it('短縮形式 /c/<10 文字> は token として返す', () => {
    expect(parseQrToCheckinTarget('https://app.example/c/A7K3PQ2MXF')).toEqual({ kind: 'token', token: 'A7K3PQ2MXF' })
    expect(parseQrToCheckinTarget('https://app.example/c/A7K3PQ2MXF/')).toEqual({ kind: 'token', token: 'A7K3PQ2MXF' })
    expect(parseQrToCheckinTarget('  https://app.example/c/A7K3PQ2MXF  ')).toEqual({ kind: 'token', token: 'A7K3PQ2MXF' })
  })

  it('旧形式（?booth_id= / 生の UUID）は booth_id として返す（既に印刷された QR を壊さない）', () => {
    expect(parseQrToCheckinTarget(`https://app.example/checkin?booth_id=${BOOTH_ID}`)).toEqual({
      kind: 'booth_id',
      boothId: BOOTH_ID,
    })
    expect(parseQrToCheckinTarget(BOOTH_ID)).toEqual({ kind: 'booth_id', boothId: BOOTH_ID })
  })

  it('字母外の文字（0 O 1 I L U）や桁違いは token として扱わない', () => {
    for (const bad of ['A7K3PQ2MX0', 'A7K3PQ2MXO', 'A7K3PQ2MXI', 'A7K3PQ2MXU', 'A7K3PQ2MX', 'A7K3PQ2MXFF']) {
      expect(parseQrToCheckinTarget(`https://app.example/c/${bad}`)).toBeNull()
    }
  })

  it('/c/ 以外のパス・無関係な文字列・空は null', () => {
    expect(parseQrToCheckinTarget('https://app.example/x/A7K3PQ2MXF')).toBeNull()
    expect(parseQrToCheckinTarget('A7K3PQ2MXF')).toBeNull()
    expect(parseQrToCheckinTarget('hello')).toBeNull()
    expect(parseQrToCheckinTarget('')).toBeNull()
    expect(parseQrToCheckinTarget(null)).toBeNull()
    expect(parseQrToCheckinTarget(undefined)).toBeNull()
  })
})
