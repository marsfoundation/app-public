import { assert } from '@/utils/assert'
import { Address, zeroAddress } from 'viem'
import { gnosis } from 'viem/chains'

import { NATIVE_ASSET_MOCK_ADDRESS, SANDBOX_NETWORKS_CHAIN_ID_PREFIX } from '@/config/consts'
import { wethGatewayAddress } from '@/config/contracts-generated'

/**
 * Do basic sanity checks when sending txs.
 * These checks should never fail in the real life scenario and it's the final line of defense against bugs in the app.
 */
export function sanityCheckTx(
  tx: { address?: Address; value?: bigint; gas?: bigint },
  { originChainId, chainId }: { originChainId: number; chainId: number },
): void {
  assert(tx.address, 'Address is required')
  assert(tx.address.toLowerCase() !== NATIVE_ASSET_MOCK_ADDRESS.toLowerCase(), 'Cannot interact with ETH mock address')
  assert(tx.address !== zeroAddress, 'Cannot interact with zero address')

  if (tx.gas) {
    assert(
      chainId.toString().startsWith(SANDBOX_NETWORKS_CHAIN_ID_PREFIX.toString()),
      'Explicit gas should be used only for sandbox networks',
    )
  }

  if (tx.value && originChainId !== gnosis.id) {
    assert(
      tx.address === (wethGatewayAddress as any)[originChainId],
      'Sending the native asset is only allowed to gateway contracts',
    )
  }
}
