import { formatPercentage } from '@/domain/common/format'
import { DialogPanel } from '@/features/dialogs/common/components/DialogPanel'
import { DialogPanelTitle } from '@/features/dialogs/common/components/DialogPanelTitle'
import { TransactionOverviewDetailsItem } from '@/features/dialogs/common/components/TransactionOverviewDetailsItem'

import { assets } from '@/ui/assets'
import { testIds } from '@/ui/utils/testIds'
import { SavingsDialogTxOverviewLiFi } from '../types'
import { TransactionOverviewBalanceChangeDetail } from './TransactionOverviewBalanceChangeDetail'
import { TransactionOverviewExchangeRateDetail } from './TransactionOverviewExchangeRateDetail'

export interface LiFiTransactionOverviewProps {
  txOverview: SavingsDialogTxOverviewLiFi
}
export function LiFiTransactionOverview({ txOverview }: LiFiTransactionOverviewProps) {
  if (txOverview.status !== 'success') {
    return (
      <LiFiTransactionOverviewPlaceholder
        isLoading={txOverview.status === 'loading'}
        showExchangeRate={txOverview.showExchangeRate}
      />
    )
  }
  let dataTestIdIndex = 0

  return (
    <DialogPanel>
      <DialogPanelTitle>Transaction overview</DialogPanelTitle>

      <TransactionOverviewDetailsItem
        label="APY"
        data-testid={testIds.dialog.depositSavings.transactionDetailsRow(dataTestIdIndex++)}
      >
        {formatPercentage(txOverview.APY)}
      </TransactionOverviewDetailsItem>
      {txOverview.showExchangeRate && (
        <TransactionOverviewExchangeRateDetail
          fromToken={txOverview.exchangeRatioFromToken}
          toToken={txOverview.exchangeRatioToToken}
          ratio={txOverview.exchangeRatio}
          data-testid={testIds.dialog.depositSavings.transactionDetailsRow(dataTestIdIndex++)}
        />
      )}
      <TransactionOverviewBalanceChangeDetail
        token={txOverview.sDaiToken}
        before={txOverview.sDaiBalanceBefore}
        after={txOverview.sDaiBalanceAfter}
        data-testid={testIds.dialog.depositSavings.transactionDetailsRow(dataTestIdIndex++)}
      />
    </DialogPanel>
  )
}

interface LiFiTransactionOverviewPlaceholder {
  isLoading: boolean
  showExchangeRate: boolean
}
function LiFiTransactionOverviewPlaceholder({ isLoading, showExchangeRate }: LiFiTransactionOverviewPlaceholder) {
  const placeholder = isLoading ? (
    <img src={assets.threeDots} alt="loader" width={20} height={5} data-chromatic="ignore" />
  ) : (
    '-'
  )
  return (
    <DialogPanel>
      <DialogPanelTitle>Transaction overview</DialogPanelTitle>
      <TransactionOverviewDetailsItem label="APY">{placeholder}</TransactionOverviewDetailsItem>
      {showExchangeRate && (
        <TransactionOverviewDetailsItem label="Exchange Rate">{placeholder}</TransactionOverviewDetailsItem>
      )}
      <TransactionOverviewDetailsItem label="sDAI balance">{placeholder}</TransactionOverviewDetailsItem>
    </DialogPanel>
  )
}
