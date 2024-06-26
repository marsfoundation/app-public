import { assert } from '@/utils/assert'
import { queryOptions } from '@tanstack/react-query'
import { zeroAddress } from 'viem'

import BigNumber from 'bignumber.js'
import { CheckedAddress } from '../../types/CheckedAddress'
import { BaseUnitNumber, NormalizedUnitNumber } from '../../types/NumericValues'
import { SwapMeta, SwapRequest } from '../types'
import { LiFiClient } from './LifiClient'
import { QuoteResponse } from './types'

const SLIPPAGE_EPSILON = new BigNumber('0.000000000001')

export interface FetchLiFiTxDataParams {
  client: LiFiClient
  type: 'direct' | 'reverse'
  fromToken: CheckedAddress
  toToken: CheckedAddress
  amount: BaseUnitNumber
  userAddress: CheckedAddress
  chainId: number
  meta: SwapMeta
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function fetchLiFiTxData({
  client,
  type,
  fromToken,
  toToken,
  amount,
  userAddress,
  chainId,
  meta,
}: FetchLiFiTxDataParams) {
  return queryOptions<SwapRequest>({
    queryKey: ['liFiTxData', chainId, userAddress, type, fromToken, toToken, amount, meta.maxSlippage],
    queryFn: async (): Promise<SwapRequest> => {
      if (import.meta.env.STORYBOOK_PREVIEW) {
        return {
          txRequest: {
            data: '0x4630a0d8', // just a sighash
            from: zeroAddress,
            to: zeroAddress,
            value: 0n,
            gasPrice: 0n,
            gasLimit: 0n,
          },
          fromToken: CheckedAddress(zeroAddress),
          toToken: CheckedAddress(zeroAddress),
          type: 'direct',

          estimate: {
            fromAmount: BaseUnitNumber(1n),
            toAmount: BaseUnitNumber(1n),
            toAmountMin: BaseUnitNumber(1n),
            feeCostsUSD: NormalizedUnitNumber(1),
          },
        }
      }
      if (type === 'direct') {
        const response = await client.getQuote({ userAddress, chainId, fromToken, toToken, amount, ...meta })
        const fromAmount = BaseUnitNumber(response.estimate.fromAmount)
        assert(amount.eq(fromAmount), 'amount should eq fromAmount')
        assert(
          // due to precision issues, these might not be exactly equal
          response.action.slippage
            .minus(meta.maxSlippage)
            .abs()
            .lte(SLIPPAGE_EPSILON),
          `slippage (${response.action.slippage}) should eq maxSlippage (${meta.maxSlippage})`,
        )

        return {
          txRequest: response.transactionRequest,
          fromToken: CheckedAddress(response.action.fromToken.address),
          toToken: CheckedAddress(response.action.toToken.address),
          type: 'direct',

          estimate: {
            fromAmount,
            toAmount: BaseUnitNumber(response.estimate.toAmount),
            toAmountMin: BaseUnitNumber(response.estimate.toAmountMin),
            feeCostsUSD: calculateFees(response.estimate.feeCosts),
          },
        }
      }
      const response = await client.getReverseQuote({
        userAddress,
        chainId,
        fromToken,
        toToken,
        amount,
        ...meta,
      })

      assert(
        // due to precision issues, these might not be exactly equal
        response.action.slippage
          .minus(meta.maxSlippage)
          .abs()
          .lte(SLIPPAGE_EPSILON),
        `slippage (${response.action.slippage}) should eq maxSlippage (${meta.maxSlippage})`,
      )

      return {
        txRequest: response.transactionRequest,
        fromToken: CheckedAddress(response.action.fromToken.address),
        toToken: CheckedAddress(response.action.toToken.address),
        type: 'reverse',

        estimate: {
          fromAmount: BaseUnitNumber(response.estimate.fromAmount),
          toAmount: BaseUnitNumber(response.estimate.toAmount),
          toAmountMin: BaseUnitNumber(response.estimate.toAmountMin),
          feeCostsUSD: calculateFees(response.estimate.feeCosts),
        },
      }
    },
  })
}

function calculateFees(feeCosts: QuoteResponse['estimate']['feeCosts']): NormalizedUnitNumber {
  return feeCosts.reduce((acc, { amountUSD }) => NormalizedUnitNumber(acc.plus(amountUSD)), NormalizedUnitNumber(0))
}
