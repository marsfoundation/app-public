import { test } from '@playwright/test'

import { tenderlyRpcActions } from '@/domain/tenderly/TenderlyRpcActions'
import { TestTenderlyClient } from '../../domain/tenderly/TestTenderlyClient'
import { processEnv } from './processEnv'

export interface ForkContext {
  forkUrl: string
  tenderlyClient: TestTenderlyClient
  initialSnapshotId: string
  simulationDate: Date
  chainId: number
}

// @note: https://github.com/marsfoundation/app#deterministic-time-in-e2e-tests
export const _simulationDate = new Date('2024-06-04T10:21:19Z')

/**
 * Fork is shared across the whole test file and is fixed to a single block number.
 * It's created once and deleted after all tests are finished but after each test it's reverted to the initial state.
 */
export interface SetupForkOptions {
  blockNumber: bigint
  chainId: number
  simulationDateOverride?: Date
}

export function setupFork({ blockNumber, chainId, simulationDateOverride }: SetupForkOptions): ForkContext {
  const simulationDate = simulationDateOverride ?? _simulationDate
  const apiKey = processEnv('TENDERLY_API_KEY')
  const tenderlyAccount = processEnv('TENDERLY_ACCOUNT')
  const tenderlyProject = processEnv('TENDERLY_PROJECT')

  const tenderlyClient = new TestTenderlyClient({ apiKey, account: tenderlyAccount, project: tenderlyProject })

  const forkContext: ForkContext = {
    tenderlyClient,
    // we lie to typescript here, because it will be set in beforeAll
    forkUrl: undefined as any,
    initialSnapshotId: undefined as any,
    simulationDate,
    chainId,
  }

  test.beforeAll(async () => {
    forkContext.forkUrl = await tenderlyClient.createFork({
      blockNumber,
      originChainId: chainId,
      forkChainId: chainId,
    })

    const deltaTimeForward = Math.floor((simulationDate.getTime() - Date.now()) / 1000)
    await tenderlyRpcActions.evmIncreaseTime(forkContext.forkUrl, deltaTimeForward)

    forkContext.initialSnapshotId = await tenderlyRpcActions.snapshot(forkContext.forkUrl)
  })

  test.beforeEach(async () => {
    await tenderlyRpcActions.revertToSnapshot(forkContext.forkUrl, forkContext.initialSnapshotId)
  })

  test.afterAll(async () => {
    if (processEnv.optionalBoolean('TENDERLY_PERSIST_FORK')) {
      return
    }

    if (forkContext.forkUrl) {
      await tenderlyClient.deleteFork(forkContext.forkUrl)
    }
  })

  return forkContext
}
