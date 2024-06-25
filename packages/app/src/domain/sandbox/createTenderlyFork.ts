import { assert } from '@/utils/assert'
import { randomHexId } from '@/utils/random'
import { TenderlyVnetClient } from '../tenderly/TenderlyVnetClient'

interface CreateTenderlyForkArgs {
  originChainId: number
  forkChainId: number
  namePrefix: string
  blockNumber?: bigint
}

export async function createTenderlyFork({
  originChainId,
  forkChainId,
  namePrefix,
  blockNumber,
}: CreateTenderlyForkArgs): Promise<{ rpcUrl: string }> {
  // @todo rewrite to use new lambda instead
  const projectName = import.meta.env.VITE_TENDERLY_PROJECT!
  const accountName = import.meta.env.VITE_TENDERLY_ACCOUNT!
  const tenderlyApiKey = import.meta.env.VITE_TENDERLY_API_KEY!
  assert(projectName && accountName && tenderlyApiKey, 'tenderly not configured properly!')

  const client = new TenderlyVnetClient({
    account: accountName,
    apiKey: tenderlyApiKey,
    project: projectName,
  })

  return client.create({ name: `${namePrefix}_${randomHexId()}`, originChainId, forkChainId, blockNumber })
}
