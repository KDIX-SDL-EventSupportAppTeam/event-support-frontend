import { ApiParticipantClient } from '@/shared/data/api/apiParticipantClient'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'
import type { ParticipantClient } from '@/shared/data/participantTypes'
import { SampleParticipantClient } from '@/shared/data/sample/sampleParticipantClient'

export function createParticipantClient(): ParticipantClient {
  return resolveEventDataSourceMode() === 'sample' ? new SampleParticipantClient() : new ApiParticipantClient()
}
