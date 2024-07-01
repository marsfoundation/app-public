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

interface UseSexyDaiWithdrawArgs {
  sDai: CheckedAddress
  assetsAmount: BaseUnitNumber
  receiver?: CheckedAddress
  onTransactionSettled?: () => void
  enabled?: boolean
}

// @note: 'withdrawXDAI' function allows user to withdraw a specified amount
// of xDAI from the vault by burning the corresponding sDAI amount.
// Without optional receiver, assets owner will be used as receiver.
// Providing receiver will allow to withdraw and send assets to a target address in one transaction.
// Example: Withdraw X xDAI by burning Y sDAI (useful is one wants to withdraw exact number of xDAI)
export function useSexyDaiWithdraw({
  sDai,
  assetsAmount,
  receiver: _receiver,
  onTransactionSettled,
  enabled = true,
}: UseSexyDaiWithdrawArgs): ReturnType<typeof useWrite> {
  const client = useQueryClient()
  const wagmiConfig = useConfig()

  const { address: owner } = useAccount()
  const receiver = _receiver || owner

  const config = ensureConfigTypes({
    address: savingsXDaiAdapterAddress[gnosis.id],
    abi: savingsXDaiAdapterAbi,
    functionName: 'withdrawXDAI',
    args: [toBigInt(assetsAmount), receiver!],
  })

  return useWrite(
    {
      ...config,
      enabled: enabled && assetsAmount.gt(0) && !!receiver,
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
