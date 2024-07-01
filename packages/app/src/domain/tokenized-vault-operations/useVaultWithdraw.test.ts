import { BaseUnitNumber } from '@/domain/types/NumericValues'
import { testAddresses } from '@/test/integration/constants'
import { handlers } from '@/test/integration/mockTransport'
import { setupHookRenderer } from '@/test/integration/setupHookRenderer'
import { toBigInt } from '@/utils/bigNumber'
import { waitFor } from '@testing-library/react'
import { erc4626Abi } from 'viem'
import { mainnet } from 'viem/chains'
import { useVaultWithdraw } from './useVaultWithdraw'

const owner = testAddresses.alice
const receiver = testAddresses.bob
const assetsAmount = BaseUnitNumber(10)
const vault = testAddresses.token

const hookRenderer = setupHookRenderer({
  hook: useVaultWithdraw,
  account: owner,
  handlers: [handlers.chainIdCall({ chainId: mainnet.id }), handlers.balanceCall({ balance: 0n, address: owner })],
  args: { assetsAmount, vault },
})

describe(useVaultWithdraw.name, () => {
  it('is not enabled for guest ', async () => {
    const { result } = hookRenderer({ account: undefined })

    await waitFor(() => {
      expect(result.current.status.kind).toBe('disabled')
    })
  })

  it('is not enabled for 0 value', async () => {
    const { result } = hookRenderer({ args: { assetsAmount: BaseUnitNumber(0), vault } })

    await waitFor(() => {
      expect(result.current.status.kind).toBe('disabled')
    })
  })

  it('is not enabled when explicitly disabled', async () => {
    const { result } = hookRenderer({ args: { enabled: false, assetsAmount, vault } })

    await waitFor(() => {
      expect(result.current.status.kind).toBe('disabled')
    })
  })

  it('withdraws from vault', async () => {
    const { result } = hookRenderer({
      extraHandlers: [
        handlers.contractCall({
          to: vault,
          abi: erc4626Abi,
          functionName: 'withdraw',
          args: [toBigInt(assetsAmount), owner, owner],
          from: owner,
          result: 1n,
        }),
        handlers.mineTransaction(),
      ],
    })

    await waitFor(() => {
      expect(result.current.status.kind).toBe('ready')
    })
    expect((result.current as any).error).toBeUndefined()

    result.current.write()

    await waitFor(() => {
      expect(result.current.status.kind).toBe('success')
    })
  })

  it('withdraws from vault with custom receiver', async () => {
    const { result } = hookRenderer({
      args: {
        assetsAmount,
        vault,
        receiver,
      },
      extraHandlers: [
        handlers.contractCall({
          to: vault,
          abi: erc4626Abi,
          functionName: 'withdraw',
          args: [toBigInt(assetsAmount), receiver, owner],
          from: owner,
          result: 1n,
        }),
        handlers.mineTransaction(),
      ],
    })

    await waitFor(() => {
      expect(result.current.status.kind).toBe('ready')
    })
    expect((result.current as any).error).toBeUndefined()

    result.current.write()

    await waitFor(() => {
      expect(result.current.status.kind).toBe('success')
    })
  })
})
