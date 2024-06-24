import { assert } from '@/utils/assert'
import { UseMutationResult, useMutation } from '@tanstack/react-query'
import { useRef } from 'react'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { useAccount, useConfig } from 'wagmi'
import { connect, getChains, switchChain } from 'wagmi/actions'

import { createSandboxConnector } from '@/domain/sandbox/createSandboxConnector'
import { useSandboxState } from '@/domain/sandbox/useSandboxState'
import { useStore } from '@/domain/state'
import { NotRetryableError, retry } from '@/utils/promises'
import { getTimestampInSeconds } from '@/utils/time'

import { SANDBOX_NETWORKS_CHAIN_ID_PREFIX } from '@/config/consts'
import { SandboxMode } from '../types'
import { createSandbox, getChainIdWithPrefix } from './createSandbox'

export type UseSandboxMutationResult = Omit<UseMutationResult<void, Error, void, unknown>, 'mutate'> & {
  startSandbox: () => void
}

export interface UseSandboxDialogResult extends UseSandboxMutationResult {
  isInSandbox: boolean
}

export function useSandboxDialog(mode: SandboxMode): UseSandboxDialogResult {
  // @note: without this ref, callback in retry will hold the config it was created with.
  // We want to get refreshed configs on every retry.
  // Previously it used to work because config was global,
  // so when it was updated it was reflected in callbacks as well.
  const config = useConfig()
  const configRef = useRef(config)
  configRef.current = config

  const { address } = useAccount()
  const sandboxConfig = useStore((state) => state.appConfig.sandbox)
  const { setNetwork } = useStore((state) => state.sandbox)

  const { isInSandbox } = useSandboxState()

  assert(sandboxConfig, 'It seems that sandbox feature is not enabled.')

  // eslint-disable-next-line func-style
  const startSandboxAsync = async (): Promise<void> => {
    if (!address && mode === 'persisting') {
      throw new Error('Connect wallet first!')
    }

    const createdAt = new Date()
    const forkChainId = getChainIdWithPrefix(SANDBOX_NETWORKS_CHAIN_ID_PREFIX, getTimestampInSeconds(createdAt))

    if (mode === 'ephemeral') {
      const privateKey = generatePrivateKey()
      const account = privateKeyToAccount(privateKey)

      const forkUrl = await createSandbox({
        originChainId: sandboxConfig.originChainId,
        forkChainId,
        userAddress: account.address,
        mintBalances: sandboxConfig.mintBalances,
      })
      setNetwork({
        originChainId: sandboxConfig.originChainId,
        forkChainId,
        forkUrl,
        createdAt,
        name: sandboxConfig.chainName,
        ephemeralAccountPrivateKey: privateKey,
      })
      await retry(
        async () => {
          const chains = getChains(configRef.current)
          if (!chains.some((c) => c.id === forkChainId)) {
            throw new Error('Chain not configured')
          }
        },
        {
          delay: 200,
          retries: 5,
        },
      )

      const connector = createSandboxConnector({
        privateKey,
        chainId: forkChainId,
        forkUrl,
        chainName: sandboxConfig.chainName,
      })
      await connect(configRef.current, {
        chainId: forkChainId,
        connector,
      })
    } else {
      assert(address, 'Address should be defined when not using ephemeral account.')
      const forkUrl = await createSandbox({
        originChainId: sandboxConfig.originChainId,
        forkChainId,
        userAddress: address,
        mintBalances: sandboxConfig.mintBalances,
      })
      setNetwork({
        originChainId: sandboxConfig.originChainId,
        forkChainId,
        forkUrl,
        createdAt,
        name: sandboxConfig.chainName,
      })

      await retry(
        async () => {
          try {
            await switchChain(configRef.current, {
              chainId: forkChainId,
            }) // this can throw with internal error when chains are not yet reloaded or with user rejected error
          } catch (e: any) {
            if (e.message.includes('Chain not configured')) {
              throw e
            }
            throw new NotRetryableError(e)
          }
        },
        { retries: 5, delay: 200 },
      )
    }
  }

  async function startSandbox(): Promise<void> {
    try {
      await startSandboxAsync()
    } catch (e: any) {
      console.error(e)
      throw new Error(`Could not enter sandbox mode: ${e.message}`)
    }
  }

  const startSandboxMutation = useMutation({
    mutationFn: startSandbox,
  })

  return { isInSandbox, startSandbox: startSandboxMutation.mutate, ...startSandboxMutation }
}
