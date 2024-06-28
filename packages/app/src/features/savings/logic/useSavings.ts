import { getChainConfigEntry } from '@/config/chain'
import { SupportedChainId } from '@/config/chain/types'
import { TokenWithBalance } from '@/domain/common/types'
import { useMarketInfo } from '@/domain/market-info/useMarketInfo'
import { useSavingsInfo } from '@/domain/savings-info/useSavingsInfo'
import { makeAssetsInWalletList } from '@/domain/savings/makeAssetsInWalletList'
import { OpenDialogFunction, useOpenDialog } from '@/domain/state/dialogs'
import { NormalizedUnitNumber, Percentage } from '@/domain/types/NumericValues'
import { useWalletInfo } from '@/domain/wallet/useWalletInfo'
import { SandboxDialog } from '@/features/dialogs/sandbox/SandboxDialog'
import { useTimestamp } from '@/utils/useTimestamp'
import { Projections } from '../types'
import { makeSavingsOverview } from './makeSavingsOverview'
import { calculateProjections } from './projections'

const stepInMs = 50

export interface UseSavingsResults {
  guestMode: boolean
  openDialog: OpenDialogFunction
  openSandboxModal: () => void
  savingsDetails:
    | {
        state: 'supported'
        APY: Percentage
        depositedUSD: NormalizedUnitNumber
        depositedUSDPrecision: number
        sDAIBalance: TokenWithBalance
        currentProjections: Projections
        opportunityProjections: Projections
        assetsInWallet: TokenWithBalance[]
        totalEligibleCashUSD: NormalizedUnitNumber
        maxBalanceToken: TokenWithBalance
        chainId: SupportedChainId
      }
    | { state: 'unsupported' }
}
export function useSavings(): UseSavingsResults {
  const { savingsInfo } = useSavingsInfo()
  const walletInfo = useWalletInfo()
  const guestMode = !walletInfo.isConnected
  const { marketInfo } = useMarketInfo()
  const chainId = getChainConfigEntry(marketInfo.chainId).id
  const { timestamp, timestampInMs } = useTimestamp({
    refreshIntervalInMs: savingsInfo?.supportsRealTimeInterestAccrual ? stepInMs : undefined,
  })
  // console.log('timestamp', new Date(timestampInMs).toISOString())
  const openDialog = useOpenDialog()

  if (!savingsInfo) {
    return { guestMode, openDialog, openSandboxModal, savingsDetails: { state: 'unsupported' } }
  }

  const {
    assets: assetsInWallet,
    totalUSD: totalEligibleCashUSD,
    maxBalanceToken,
  } = makeAssetsInWalletList({ walletInfo })
  const { shares, potentialShares, depositedUSD, depositedUSDPrecision, sDAIBalance } = makeSavingsOverview({
    marketInfo,
    walletInfo,
    savingsInfo,
    eligibleCashUSD: totalEligibleCashUSD,
    timestampInMs,
    stepInMs,
  })

  const currentProjections = calculateProjections({ timestamp, shares, savingsInfo })
  const opportunityProjections = calculateProjections({
    timestamp,
    shares: potentialShares,
    savingsInfo,
  })

  function openSandboxModal(): void {
    openDialog(SandboxDialog, { mode: 'ephemeral' } as const)
  }

  return {
    guestMode,
    openSandboxModal,
    openDialog,
    savingsDetails: {
      state: 'supported',
      APY: savingsInfo.apy,
      depositedUSD,
      depositedUSDPrecision,
      sDAIBalance,
      currentProjections,
      opportunityProjections,
      assetsInWallet,
      totalEligibleCashUSD,
      maxBalanceToken,
      chainId,
    },
  }
}
