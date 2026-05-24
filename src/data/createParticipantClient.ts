import { ApiParticipantClient } from '@/data/api/apiParticipantClient'
import { resolveEventDataSourceMode } from '@/data/createEventDataSource'
import type { ParticipantClient } from '@/data/participantTypes'
import { SampleParticipantClient } from '@/data/sample/sampleParticipantClient'

export function createParticipantClient(): ParticipantClient {
  return resolveEventDataSourceMode() === 'sample' ? new SampleParticipantClient() : new ApiParticipantClient()
}
