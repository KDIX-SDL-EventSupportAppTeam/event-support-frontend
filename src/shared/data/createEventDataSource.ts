import { ApiEventDataSource } from '@/shared/data/api/ApiEventDataSource'
import type { EventDataSource, EventDataSourceMode } from '@/shared/data/EventDataSource'
import { SampleEventDataSource } from '@/shared/data/sample/SampleEventDataSource'

export type { EventDataSource, EventDataSourceMode } from '@/shared/data/EventDataSource'

/**
 * - 開発: 既定 `sample`（`VITE_DATA_SOURCE=api` で Fastify `/api/v1`）
 * - 本番ビルド: 既定 `api`（`VITE_DATA_SOURCE=sample` でサンプル固定）
 */
export function resolveEventDataSourceMode(): EventDataSourceMode {
  const raw = import.meta.env.VITE_DATA_SOURCE
  if (raw === 'api') return 'api'
  if (raw === 'sample') return 'sample'
  return import.meta.env.DEV ? 'sample' : 'api'
}

export function createEventDataSource(): EventDataSource {
  return resolveEventDataSourceMode() === 'sample'
    ? new SampleEventDataSource()
    : new ApiEventDataSource()
}
