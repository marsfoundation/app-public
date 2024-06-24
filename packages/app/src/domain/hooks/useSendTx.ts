import { useEffect } from 'react'
import { UseEstimateGasParameters, useAccount, useChainId, useEstimateGas, useSendTransaction } from 'wagmi'
import { sanityCheckTx } from './sanityChecks'
import { useOriginChainId } from './useOriginChainId'
import { useWaitForTransactionReceiptUniversal } from './useWaitForTransactionReceiptUniversal'
import { WriteStatus } from './useWrite'

export interface UseSendTxResult {
  send: () => void
  resimulate: () => void
  reset: () => void
  status: WriteStatus
}

export interface UseeSendTxCallbacks {
  onTransactionSettled?: () => void
}

/**
 * useWrite counterpart for sending generic transactions.
 */
export function useSendTx(
  args: UseEstimateGasParameters & { enabled?: boolean },
  callbacks: UseeSendTxCallbacks = {},
): UseSendTxResult {
  const chainId = useChainId()
  const originChainId = useOriginChainId()
  const enabled = args.enabled ?? !!(args.to && (args.data || args.value))

  const { address: account } = useAccount()
  const {
    data: gasEstimate,
    error: _simulationError,
    refetch: resimulate,
    isLoading: isSimulationLoading,
  } = useEstimateGas({
    account,
    ...args,
    query: {
      gcTime: 0,
      enabled,
      ...args.query,
    },
  })
  // @note: workaround for wagmi serving results from cache even if enabled = false. https://github.com/wevm/wagmi/issues/888
  const simulationError = enabled ? _simulationError : undefined

  const {
    sendTransaction,
    data: txHash,
    isPending: isTxSending,
    isSuccess: wasTxSent,
    error: _txSubmissionError,
    reset,
  } = useSendTransaction()

  const { data: txReceipt, error: txReceiptError } = useWaitForTransactionReceiptUniversal({
    hash: txHash,
  })
  const txSubmissionError = enabled ? _txSubmissionError : undefined

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (txReceipt) {
      callbacks.onTransactionSettled?.()
    }
  }, [txReceipt])

  const status = ((): WriteStatus => {
    if (!enabled) {
      return { kind: 'disabled' }
    }
    if (isSimulationLoading) {
      return { kind: 'simulating' }
    }
    if (simulationError) {
      return { kind: 'error', errorKind: 'simulation', error: simulationError }
    }
    if (isTxSending) {
      return { kind: 'tx-sending' }
    }
    if (txSubmissionError) {
      return { kind: 'error', errorKind: 'tx-submission', error: txSubmissionError }
    }
    if (wasTxSent && txReceipt) {
      // txReceipt is only available when tx didn't revert
      return { kind: 'success' }
    }
    if (wasTxSent && txReceiptError) {
      return { kind: 'error', errorKind: 'tx-reverted', error: txReceiptError }
    }
    if (wasTxSent) {
      return { kind: 'tx-mining' }
    }

    return { kind: 'ready' }
  })()

  const finalSend =
    gasEstimate && enabled
      ? () => {
          sanityCheckTx({ address: args.to ?? undefined, value: args.value }, { chainId, originChainId })

          sendTransaction({
            to: args.to!,
            data: args.data!,
            value: args.value,
            gas: args.gas ?? gasEstimate,
          })
        }
      : () => {}

  return {
    reset,
    send: finalSend,
    resimulate,
    status,
  }
}
