import { useEffect } from 'react'
import { Abi, ContractFunctionName } from 'viem'
import { UseSimulateContractParameters, useAccount, useSimulateContract, useWriteContract } from 'wagmi'

import { useSandboxState } from '../sandbox/useSandboxState'
import { sanityCheckTx } from './sanityChecks'
import { useOriginChainId } from './useOriginChainId'
import { useWaitForTransactionReceiptUniversal } from './useWaitForTransactionReceiptUniversal'

export type WriteStatus =
  | { kind: 'disabled' }
  | { kind: 'simulating' }
  | { kind: 'ready' }
  | { kind: 'tx-sending' }
  | { kind: 'tx-mining' }
  | { kind: 'success' }
  | { kind: 'error'; errorKind: WriteErrorKind; error: Error }
export type WriteErrorKind = 'simulation' | 'tx-submission' | 'tx-reverted'

export interface UseWriteResult {
  write: () => void
  resimulate: () => void
  reset: () => void
  status: WriteStatus
}

export interface UseWriteCallbacks {
  onTransactionSettled?: () => void
}

/**
 * Write to a contract with a sane API.
 * - Prepares txs
 * - Waits for tx to be mined
 * - Does not propagate simulation errors if disabled
 */
export function useWrite<TAbi extends Abi, TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>>(
  args: UseSimulateContractParameters<TAbi, TFunctionName> & { enabled?: boolean },
  callbacks: UseWriteCallbacks = {},
): UseWriteResult {
  const originChainId = useOriginChainId()
  const sandboxState = useSandboxState()
  const enabled = args.enabled ?? true
  // used to reset the write state when the args change

  const { address: account } = useAccount()
  const {
    data: parameters,
    error: _simulationError,
    refetch: resimulate,
    isLoading: isSimulationLoading,
  } = useSimulateContract({
    account,
    ...args,
    query: {
      gcTime: 0,
      enabled,
      ...args.query,
    },
  } as any)
  // @note: workaround for wagmi serving results from cache even if enabled = false. https://github.com/wevm/wagmi/issues/888
  const simulationError = enabled ? _simulationError : undefined

  const {
    writeContract,
    data: txHash,
    isPending: isTxSending,
    isSuccess: wasTxSent,
    error: _txSubmissionError,
    reset,
  } = useWriteContract()

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

  const finalWrite =
    parameters && enabled
      ? () => {
          if (sandboxState.isInSandbox) {
            // @note: workaround for tenderly virtual testnets requiring explicit gas
            parameters.request.gas = 1_00_000n
          }

          sanityCheckTx(parameters.request, { chainId: parameters.chainId, originChainId })

          writeContract({ ...(parameters.request as any), gas: 500_000 })
        }
      : () => {}

  return {
    reset,
    write: finalWrite,
    resimulate,
    status,
  }
}

// useful for creating conditional configs without losing type-safety
export function ensureConfigTypes<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(config: UseSimulateContractParameters<TAbi, TFunctionName>): UseSimulateContractParameters<Abi, string> {
  return config as any
}
