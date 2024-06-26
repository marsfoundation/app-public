import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, useAccount } from 'wagmi'

import { I18nTestProvider } from '@/domain/i18n/I18nTestProvider'
import { useAutoConnect } from '@/domain/wallet/useAutoConnect'

import { queryClient as defaultQueryClient } from './query-client'
import { createWagmiTestConfig } from './wagmi-config'

export function TestingWrapper({
  config,
  children,
  queryClient,
}: {
  config: ReturnType<typeof createWagmiTestConfig>
  children: React.ReactNode
  queryClient?: QueryClient
}) {
  const waitForAccount = config.connectors.length > 0
  useAutoConnect({ config })

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient ?? defaultQueryClient}>
        <I18nTestProvider>
          {waitForAccount ? <WaitForAccountToConnect>{children}</WaitForAccountToConnect> : children}
        </I18nTestProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

function WaitForAccountToConnect({ children }: { children: React.ReactNode }) {
  const { address } = useAccount()
  if (!address) {
    return null
  }
  return <>{children}</>
}
