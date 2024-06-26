import { randomInt } from '@/utils/random'
import { solidFetch } from '@/utils/solidFetch'

export async function request(forkUrl: string, method: 'tenderly_setBalance', params: [string, string]): Promise<void>
export async function request(
  forkUrl: string,
  method: 'tenderly_setErc20Balance',
  params: [string, string, string],
): Promise<void>
export async function request(forkUrl: string, method: 'evm_snapshot', params: []): Promise<string>
export async function request(forkUrl: string, method: 'evm_revert', params: [string]): Promise<void>
export async function request(forkUrl: string, method: 'evm_increaseTime', params: [number]): Promise<void>
export async function request(forkUrl: string, method: 'evm_setNextBlockTimestamp', params: [number]): Promise<void>
export async function request(forkUrl: string, method: string, params: any[]): Promise<any> {
  const id = randomInt().toString()

  const result = await solidFetch(forkUrl, {
    method: 'post',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id,
    }),
  })

  if (!result.ok) {
    throw new Error(`${method} failed: ${await result.text()}`)
  }

  const data = await result.text()
  return data
}
