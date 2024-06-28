import { tenderlyRpcActions } from '@/domain/tenderly/TenderlyRpcActions'
import { ActionsPageObject } from '@/features/actions/ActionsContainer.PageObject'
import { SavingsPageObject } from '@/pages/Savings.PageObject'
import { DEFAULT_BLOCK_NUMBER } from '@/test/e2e/constants'
import { setup } from '@/test/e2e/setup'
import { setupFork } from '@/test/e2e/setupFork'
import { sleep } from '@/utils/promises'
import { test } from '@playwright/test'
import { mainnet } from 'viem/chains'
import { SavingsDialogPageObject } from '../../../common/e2e/SavingsDialog.PageObject'

test.describe('Deposit DAI on Mainnet', () => {
  const fork = setupFork({ blockNumber: DEFAULT_BLOCK_NUMBER, chainId: mainnet.id })
  let savingsPage: SavingsPageObject
  let depositDialog: SavingsDialogPageObject

  test.beforeEach(async ({ page }) => {
    await setup(page, fork, {
      initialPage: 'savings',
      account: {
        type: 'connected',
        assetBalances: {
          // ETH: 1,
          DAI: 10_000,
        },
      },
    })

    savingsPage = new SavingsPageObject(page)
    await savingsPage.clickDepositButtonAction('DAI')

    depositDialog = new SavingsDialogPageObject({ page, type: 'deposit' })
    await depositDialog.fillAmountAction(10_000)
  })

  test('uses native sDai deposit', async () => {
    await depositDialog.actionsContainer.expectActions([
      { type: 'approve', asset: 'DAI' },
      { type: 'daiToSDaiDeposit', asset: 'DAI' },
    ])
  })

  test('displays transaction overview', async () => {
    await depositDialog.expectNativeRouteTransactionOverview({
      apy: {
        value: '5.00%',
        description: '~500.00 DAI per year',
      },
      routeItems: [
        {
          tokenAmount: '10,000.00 DAI',
          tokenUsdValue: '$10,000.00',
        },
        {
          tokenAmount: '9,332.66 sDAI',
          tokenUsdValue: '$10,000.00',
        },
      ],
      outcome: '9,332.66 sDAI worth $10,000.00',
      badgeToken: 'DAI',
    })
  })

  test('executes deposit', async () => {
    const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))

    await actionsContainer.acceptActionAtIndex(0)
    await sleep(2000)
    await tenderlyRpcActions.evmSetNextBlockTimestamp(fork.forkUrl, 1699871817)

    await actionsContainer.acceptActionAtIndex(1)
    await sleep(2000)
    await tenderlyRpcActions.evmSetNextBlockTimestamp(fork.forkUrl, 1699871827)

    await depositDialog.expectSuccessPage()
    await depositDialog.clickBackToSavingsButton()

    await savingsPage.expectSavingsBalance({ sDaiBalance: '9,332.66 sDAI', estimatedDaiValue: '10,000' })
    await savingsPage.expectCashInWalletAssetBalance('DAI', '-')
  })
})
