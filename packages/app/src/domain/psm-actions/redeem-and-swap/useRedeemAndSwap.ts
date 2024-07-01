import { psmActionsConfig } from '@/config/contracts-generated'
import { useContractAddress } from '@/domain/hooks/useContractAddress'
import { CheckedAddress } from '@/domain/types/CheckedAddress'
import { toBigInt } from '@/utils/bigNumber'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount, useChainId, useConfig } from 'wagmi'
import { ensureConfigTypes, useWrite } from '../../hooks/useWrite'
import { BaseUnitNumber } from '../../types/NumericValues'
import { Token } from '../../types/Token'
import { balancesQueryKey } from '../../wallet/balances'
import { gemMinAmountOutQueryOptions } from './gemMinAmountOutQuery'

export interface UseRedeemAndSwapArgs {
  gem: Token
  assetsToken: Token
  sharesAmount: BaseUnitNumber
  receiver?: CheckedAddress
  onTransactionSettled?: () => void
  enabled?: boolean
}

// @note: Redeem a specified amount of `savingsToken` from the `savingsToken`
// for `dai` and swap for `gem` in the PSM. Use this if you want to withdraw everything.
// Without optional receiver, shares owner will be used as receiver.
// Providing receiver will allow to redeem shares, swap, and send gem tokens to a target address in one transaction.
// @note: Assumes PSM swap rate between `dai` and `gem` is 1:1.
export function useRedeemAndSwap({
  gem,
  assetsToken,
  sharesAmount: _sharesAmount,
  receiver: _receiver,
  onTransactionSettled,
  enabled = true,
}: UseRedeemAndSwapArgs): ReturnType<typeof useWrite> {
  const client = useQueryClient()
  const wagmiConfig = useConfig()
  const chainId = useChainId()

  const psmActions = useContractAddress(psmActionsConfig.address)

  const { address: owner } = useAccount()
  const receiver = _receiver || owner

  const sharesAmount = toBigInt(_sharesAmount)
  const { data: gemMinAmountOut } = useQuery(
    gemMinAmountOutQueryOptions({
      gemDecimals: gem.decimals,
      assetsTokenDecimals: assetsToken.decimals,
      psmActions,
      sharesAmount: _sharesAmount,
      chainId,
      config: wagmiConfig,
    }),
  )

  const config = ensureConfigTypes({
    address: psmActions,
    abi: psmActionsConfig.abi,
    functionName: 'redeemAndSwap',
    args: [receiver!, sharesAmount, gemMinAmountOut!],
  })

  return useWrite(
    {
      ...config,
      enabled: enabled && _sharesAmount.gt(0) && !!receiver && !!gemMinAmountOut,
    },
    {
      onTransactionSettled: async () => {
        void client.invalidateQueries({
          queryKey: balancesQueryKey({ chainId, account: owner }),
        })

        onTransactionSettled?.()
      },
    },
  )
}
