import { describe, expect, it } from 'vitest'
import { collectProductionEnvErrors } from '@/shared/config/productionEnvGuard'

const OK = {
  VITE_DATA_SOURCE: 'api',
  VITE_MOCK_API: 'false',
  VITE_API_BASE_URL: 'https://example.run.app/api/v1',
  VITE_DEV_EVENT_ID: '20000000-0000-4000-8000-000000000001',
}

describe('collectProductionEnvErrors', () => {
  it('T-1 正しい本番設定はエラー0件', () => {
    expect(collectProductionEnvErrors(OK)).toEqual([])
  })
  it('T-2 VITE_DATA_SOURCE 未設定は検知される', () => {
    const env: Record<string, string> = { ...OK }
    delete env.VITE_DATA_SOURCE
    expect(collectProductionEnvErrors(env).join('\n')).toContain('VITE_DATA_SOURCE')
  })
  it('T-2 VITE_DATA_SOURCE=sample は検知される', () => {
    expect(collectProductionEnvErrors({ ...OK, VITE_DATA_SOURCE: 'sample' }).join('\n')).toContain('VITE_DATA_SOURCE')
  })
  it('T-3 VITE_MOCK_API=true は検知される', () => {
    expect(collectProductionEnvErrors({ ...OK, VITE_MOCK_API: 'true' }).join('\n')).toContain('VITE_MOCK_API')
  })
  it('T-5 開発用ログイン既定値が設定されていると検知され、値は出力に含まれない', () => {
    const out = collectProductionEnvErrors({ ...OK, VITE_DEV_LOGIN_PASSWORD: 'secret-xyz' }).join('\n')
    expect(out).toContain('VITE_DEV_LOGIN_PASSWORD')
    expect(out).not.toContain('secret-xyz')
  })
  it('VITE_DEV_EVENT_ID 未設定・非UUIDは検知される', () => {
    expect(collectProductionEnvErrors({ ...OK, VITE_DEV_EVENT_ID: '' }).join('\n')).toContain('VITE_DEV_EVENT_ID')
    expect(collectProductionEnvErrors({ ...OK, VITE_DEV_EVENT_ID: '0000' }).join('\n')).toContain('VITE_DEV_EVENT_ID')
  })
  it('VITE_API_BASE_URL は https か 127.0.0.1 のみ許可', () => {
    expect(collectProductionEnvErrors({ ...OK, VITE_API_BASE_URL: '/api/v1' }).join('\n')).toContain('VITE_API_BASE_URL')
    expect(collectProductionEnvErrors({ ...OK, VITE_API_BASE_URL: 'http://127.0.0.1:3000/api/v1' })).toEqual([])
  })
})
