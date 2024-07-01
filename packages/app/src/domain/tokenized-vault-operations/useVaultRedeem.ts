import { toBigInt } from '@/utils/bigNumber'
import { useQueryClient } from '@tanstack/react-query'
import { erc4626Abi } from 'viem'
import { useAccount, useChainId } from 'wagmi'
import { ensureConfigTypes, useWrite } from '../hooks/useWrite'
import { CheckedAddress } from '../types/CheckedAddress'
import { BaseUnitNumber } from '../types/NumericValues'
import { balancesQueryKey } from '../wallet/balances'

interface UseVaultRedeemArgs {
  vault: CheckedAddress
  sharesAmount: BaseUnitNumber
  receiver?: CheckedAddress
  onTransactionSettled?: () => void
  enabled?: boolean
}

// @note: 'redeem' vault function allows user to redeem a specified
// amount of shares in exchange for the underlying asset.
// Without optional receiver, assets owner will be used as receiver.
// Providing receiver will allow to redeem shares and send assets to a target address in one transaction.
// Example: Redeem X sDAI to get Y DAI (useful if one wants to withdraw all DAI)
export function useVaultRedeem({
  vault,
  sharesAmount,
  receiver: _receiver,
  onTransactionSettled,
  enabled = true,
}: UseVaultRedeemArgs): ReturnType<typeof useWrite> {
  const client = useQueryClient()
  const chainId = useChainId()

  const { address: owner } = useAccount()
  const receiver = _receiver || owner

  const config = ensureConfigTypes({
    address: vault,
    abi: erc4626Abi,
    functionName: 'redeem',
    args: [toBigInt(sharesAmount), receiver!, owner!],
  })

  return useWrite(
    {
      ...config,
      enabled: enabled && sharesAmount.gt(0) && !!receiver && !!owner,
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
