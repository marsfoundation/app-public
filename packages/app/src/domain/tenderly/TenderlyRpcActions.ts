import { BaseUnitNumber } from '@/domain/types/NumericValues'
import { toHex } from '@/utils/bigNumber'

import { request } from '../sandbox/request'

async function setBalance(forkUrl: string, address: string, balance: BaseUnitNumber): Promise<void> {
  await request(forkUrl, 'tenderly_setBalance', [address, toHex(balance)])
}

async function setTokenBalance(
  forkUrl: string,
  tokenAddress: string,
  walletAddress: string,
  balance: BaseUnitNumber,
): Promise<void> {
  await request(forkUrl, 'tenderly_setErc20Balance', [tokenAddress, walletAddress, toHex(balance)])
}

async function snapshot(forkUrl: string): Promise<string> {
  return request(forkUrl, 'evm_snapshot', [])
}

async function revertToSnapshot(forkUrl: string, checkpoint: string): Promise<void> {
  await request(forkUrl, 'evm_revert', [checkpoint])
}

async function evmIncreaseTime(forkUrl: string, seconds: number): Promise<void> {
  await request(forkUrl, 'evm_increaseTime', [seconds])
}

export const tenderlyRpcActions = {
  setBalance,
  setTokenBalance,
  snapshot,
  revertToSnapshot,
  evmIncreaseTime,
}
