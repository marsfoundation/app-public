import { savingsXDaiAdapterAbi, savingsXDaiAdapterAddress } from '@/config/contracts-generated'
import { toBigInt } from '@/utils/bigNumber'
import { useQueryClient } from '@tanstack/react-query'
import { gnosis } from 'viem/chains'
import { useAccount, useConfig } from 'wagmi'
import { ensureConfigTypes, useWrite } from '../hooks/useWrite'
import { allowance } from '../market-operations/allowance/query'
import { CheckedAddress } from '../types/CheckedAddress'
import { BaseUnitNumber } from '../types/NumericValues'
import { balancesQueryKey } from '../wallet/balances'

export interface UseSexyDaiRedeemArgs {
  sDai: CheckedAddress
  sharesAmount: BaseUnitNumber
  receiver?: CheckedAddress
  onTransactionSettled?: () => void
  enabled?: boolean
}

// @note: 'redeemXDAI' vault function allows user to redeem a specified amount of sDAI in exchange for the xDAI.
// Without optional receiver, xDAI owner will be used as receiver.
// Providing receiver will allow to redeem sDAI and send xDAI to a target address in one transaction.
// Example: Redeem X sDAI to get Y xDAI (useful if one wants to withdraw all xDAI)
export function useSexyDaiRedeem({
  sDai,
  sharesAmount,
  receiver: _receiver,
  onTransactionSettled,
  enabled = true,
}: UseSexyDaiRedeemArgs): ReturnType<typeof useWrite> {
  const client = useQueryClient()
  const wagmiConfig = useConfig()

  const { address: owner } = useAccount()
  const receiver = _receiver || owner

  const config = ensureConfigTypes({
    address: savingsXDaiAdapterAddress[gnosis.id],
    abi: savingsXDaiAdapterAbi,
    functionName: 'redeemXDAI',
    args: [toBigInt(sharesAmount), receiver!],
  })

  return useWrite(
    {
      ...config,
      enabled: enabled && sharesAmount.gt(0) && !!receiver,
    },
    {
      onTransactionSettled: async () => {
        void client.invalidateQueries({
          queryKey: balancesQueryKey({ chainId: gnosis.id, account: owner }),
        })
        void client.invalidateQueries({
          queryKey: allowance({
            wagmiConfig,
            chainId: gnosis.id,
            token: sDai,
            account: owner!,
            spender: savingsXDaiAdapterAddress[gnosis.id],
          }).queryKey,
        })

        onTransactionSettled?.()
      },
    },
  )
}
