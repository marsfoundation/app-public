import { z } from 'zod'

import { assert } from '@/utils/assert'
import { randomHexId } from '@/utils/random'
import { solidFetch } from '@/utils/solidFetch'

const createForkResponseSchema = z.object({
  simulation_fork: z.object({
    rpc_url: z.string(),
  }),
})

export interface CreateTenderlyForkArgs {
  apiUrl: string
  originChainId: number
  forkChainId: number
  namePrefix: string
  blockNumber?: bigint
  headers?: Record<string, string>
}

export interface CreateTenderlyForkResult {
  rpcUrl: string
}

export async function createTenderlyFork({
  apiUrl,
  originChainId,
  forkChainId,
  namePrefix,
  blockNumber,
  headers,
}: CreateTenderlyForkArgs): Promise<CreateTenderlyForkResult> {
  const response = await solidFetch(apiUrl, {
    method: 'post',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      network_id: originChainId,
      block_number: blockNumber ? Number(blockNumber) : undefined,
      chain_config: { chain_id: forkChainId },
      alias: `${namePrefix}_${randomHexId()}`,
    }),
  })

  const data = createForkResponseSchema.parse(await response.json())
  return { rpcUrl: data.simulation_fork.rpc_url }
}

export async function createTenderlyVnet({
  originChainId,
  forkChainId,
  namePrefix,
  blockNumber,
  headers,
}: CreateTenderlyForkArgs): Promise<CreateTenderlyForkResult> {
  const projectName = import.meta.env.VITE_TENDERLY_PROJECT!
  const accountName = import.meta.env.VITE_TENDERLY_ACCOUNT!
  const tenderlyApiKey = import.meta.env.VITE_TENDERLY_API_KEY!
  assert(projectName && accountName && tenderlyApiKey, 'tenderly not configured properly!')
  const response = await solidFetch(
    `https://api.tenderly.co/api/v1/account/${accountName}/project/${projectName}/vnets `,
    {
      method: 'post',
      headers: { ...headers, 'Content-Type': 'application/json', 'X-Access-Key': tenderlyApiKey },
      // body: JSON.stringify({
      //   network_id: originChainId,
      //   block_number: blockNumber ? Number(blockNumber) : undefined,
      //   chain_config: { chain_id: forkChainId },
      //   alias: `${namePrefix}_${randomHexId()}`,
      // }),
      body: JSON.stringify({
        slug: `${namePrefix}-my-staging-testnet-${randomHexId()}`,
        display_name: 'My Staging TestNet',
        fork_config: {
          network_id: originChainId,
          block_number: Number(blockNumber),
        },
        virtual_network_config: {
          chain_config: {
            chain_id: forkChainId,
          },
        },
        sync_state_config: {
          enabled: false,
          commitment_level: 'latest',
        },
        explorer_page_config: {
          enabled: false,
          verification_visibility: 'bytecode',
        },
      }),
    },
  )

  const data: any = await response.json()
  return { rpcUrl: data.rpcs[0].url }
}
