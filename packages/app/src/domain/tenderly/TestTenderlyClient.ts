import { randomHexId } from '@/utils/random'
import { TenderlyVnetClient } from './TenderlyVnetClient'

export class TestTenderlyClient {
  private readonly client: TenderlyVnetClient

  constructor(opts: { apiKey: string; account: string; project: string }) {
    this.client = new TenderlyVnetClient(opts)
  }

  async createFork({
    originChainId,
    forkChainId,
    blockNumber,
  }: {
    originChainId: number
    forkChainId: number
    blockNumber: bigint
  }): Promise<string> {
    const { rpcUrl } = await this.client.create({
      forkChainId,
      originChainId,
      blockNumber,
      name: `test-e2e-${randomHexId()}`,
    })

    return rpcUrl
  }

  async deleteFork(_forkUrl: string): Promise<void> {
    // doesn't support deleting vnets yet
  }
}
