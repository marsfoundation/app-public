import { zeroAddress } from 'viem'
import { gnosis, mainnet } from 'viem/chains'

import { NATIVE_ASSET_MOCK_ADDRESS } from '@/config/consts'
import { testAddresses } from '@/test/integration/constants'

import { sanityCheckTx } from './sanityChecks'

describe(sanityCheckTx.name, () => {
  it('throws when address is on a black list', () => {
    expect(() =>
      sanityCheckTx(
        { address: NATIVE_ASSET_MOCK_ADDRESS, value: 0n },
        {
          chainId: mainnet.id,
          originChainId: mainnet.id,
        },
      ),
    ).toThrow('Cannot interact')
    expect(() =>
      sanityCheckTx(
        { address: zeroAddress, value: 0n },
        {
          chainId: mainnet.id,
          originChainId: mainnet.id,
        },
      ),
    ).toThrow('Cannot interact')
  })

  it('throws when sending native asset to non-gateway contract', () => {
    expect(() =>
      sanityCheckTx(
        { address: testAddresses.alice, value: 1n },
        {
          chainId: mainnet.id,
          originChainId: mainnet.id,
        },
      ),
    ).toThrow('Sending the native asset ')
    expect(() =>
      sanityCheckTx(
        { address: testAddresses.alice, value: 1n },
        {
          chainId: gnosis.id,
          originChainId: gnosis.id,
        },
      ),
    ).not.toThrow()
  })
})
