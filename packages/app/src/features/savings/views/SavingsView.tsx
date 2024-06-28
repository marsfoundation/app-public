import { SupportedChainId } from '@/config/chain/types'
import { TokenWithBalance } from '@/domain/common/types'
import { OpenDialogFunction } from '@/domain/state/dialogs'
import { NormalizedUnitNumber, Percentage } from '@/domain/types/NumericValues'

import { PageHeader } from '../components/PageHeader'
import { PageLayout } from '../components/PageLayout'
import { CashInWallet } from '../components/cash-in-wallet/CashInWallet'
import { SavingsDAI } from '../components/savings-dai/SavingsDAI'
import { SavingsOpportunity } from '../components/savings-opportunity/SavingsOpportunity'
import { SavingsOpportunityNoCash } from '../components/savings-opportunity/SavingsOpportunityNoCash'
import { Projections } from '../types'
import { Dev, useMulticallBlockTimestamp } from './dev'

export interface SavingsViewProps {
  APY: Percentage
  chainId: SupportedChainId
  depositedUSD: NormalizedUnitNumber
  depositedUSDPrecision: number
  sDAIBalance: TokenWithBalance
  currentProjections: Projections
  opportunityProjections: Projections
  assetsInWallet: TokenWithBalance[]
  maxBalanceToken: TokenWithBalance
  totalEligibleCashUSD: NormalizedUnitNumber
  openDialog: OpenDialogFunction
}

export function SavingsView({
  APY,
  chainId,
  depositedUSD,
  depositedUSDPrecision,
  sDAIBalance,
  currentProjections,
  opportunityProjections,
  assetsInWallet,
  totalEligibleCashUSD,
  maxBalanceToken,
  openDialog,
}: SavingsViewProps) {
  const displaySavingsDai = depositedUSD.gt(0)
  const displaySavingsOpportunity = opportunityProjections.thirtyDays.gt(0) && opportunityProjections.oneYear.gt(0)
  const displaySavingsNoCash = !displaySavingsDai && !displaySavingsOpportunity

  return (
    <PageLayout>
      <Dev />
      <PageHeader />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {displaySavingsDai && (
          <div className="last:sm:col-span-2">
            <SavingsDAI
              APY={APY}
              chainId={chainId}
              depositedUSD={depositedUSD}
              projections={currentProjections}
              depositedUSDPrecision={depositedUSDPrecision}
              sDAIBalance={sDAIBalance}
              openDialog={openDialog}
            />
          </div>
        )}
        {displaySavingsOpportunity && (
          <div className="first:sm:col-span-2">
            <SavingsOpportunity
              APY={APY}
              chainId={chainId}
              projections={opportunityProjections}
              maxBalanceToken={maxBalanceToken}
              openDialog={openDialog}
              totalEligibleCashUSD={totalEligibleCashUSD}
            />
          </div>
        )}
        {displaySavingsNoCash && (
          <div className="sm:col-span-2">
            <SavingsOpportunityNoCash APY={APY} chainId={chainId} />
          </div>
        )}
      </div>
      <CashInWallet assets={assetsInWallet} openDialog={openDialog} />
    </PageLayout>
  )
}
