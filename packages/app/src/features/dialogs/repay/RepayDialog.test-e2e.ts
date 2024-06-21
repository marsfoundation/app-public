import { test } from '@playwright/test'
import { mainnet } from 'viem/chains'

import { repayValidationIssueToMessage } from '@/domain/market-validators/validateRepay'
import { ActionsPageObject } from '@/features/actions/ActionsContainer.PageObject'
import { BorrowPageObject } from '@/pages/Borrow.PageObject'
import { DashboardPageObject } from '@/pages/Dashboard.PageObject'
import { DEFAULT_BLOCK_NUMBER } from '@/test/e2e/constants'
import { setup } from '@/test/e2e/setup'
import { setupFork } from '@/test/e2e/setupFork'
import { screenshot } from '@/test/e2e/utils'

import { publicTenderlyActions } from '@/domain/sandbox/publicTenderlyActions'
import { BaseUnitNumber, NormalizedUnitNumber } from '@/domain/types/NumericValues'
import { Address } from 'viem'
import { DialogPageObject } from '../common/Dialog.PageObject'

const headerRegExp = /Repa*/

test.describe('Repay dialog', () => {
  const fork = setupFork({ blockNumber: DEFAULT_BLOCK_NUMBER, chainId: mainnet.id })
  const initialBalances = {
    wstETH: 100,
    rETH: 100,
    WETH: 100,
    DAI: 10000,
  }
  const expectedInitialHealthFactor = '5.65'
  const expectedHealthFactor = '5.82'

  test.describe('Position with borrowed DAI', () => {
    const initialDeposits = {
      rETH: 10,
    } as const
    const daiToBorrow = 3500

    test.beforeEach(async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'easyBorrow',
        account: {
          type: 'connected',
          assetBalances: { ...initialBalances },
        },
      })

      const borrowPage = new BorrowPageObject(page)
      await borrowPage.depositAssetsActions(initialDeposits, daiToBorrow)
      await borrowPage.viewInDashboardAction()

      const dashboardPage = new DashboardPageObject(page)
      // @todo This waits for the refetch of the data after successful borrow transaction to happen.
      // This is no ideal, probably we need to refactor expectDepositTable so it takes advantage from
      // playwright's timeouts instead of parsing it's current state. Then we would be able to
      // easily wait for the table to be updated.
      await dashboardPage.expectAssetToBeInDepositTable('DAI')
    })

    test('opens dialog with selected asset', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickRepayButtonAction('DAI')

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.expectSelectedAsset('DAI')
      await repayDialog.expectDialogHeader('Repay DAI')
      await repayDialog.expectHealthFactorBeforeVisible()

      await screenshot(repayDialog.getDialog(), 'repay-dialog-default-view')
    })

    test('calculates health factor changes correctly when repaying part', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickRepayButtonAction('DAI')

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.fillAmountAction(100)

      await repayDialog.expectRiskLevelBefore('Healthy')
      await repayDialog.expectHealthFactorBefore(expectedInitialHealthFactor)
      await repayDialog.expectRiskLevelAfter('Healthy')
      await repayDialog.expectHealthFactorAfter(expectedHealthFactor)

      // @note this is needed for deterministic screenshots
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.expectEnabledActionAtIndex(0)

      await screenshot(repayDialog.getDialog(), 'repay-dialog-health-factor-partial-repay')
    })

    test('calculates health factor changes correctly when repaying all', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickRepayButtonAction('DAI')

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.clickMaxAmountAction()

      await repayDialog.expectRiskLevelBefore('Healthy')
      await repayDialog.expectHealthFactorBefore(expectedInitialHealthFactor)
      await repayDialog.expectRiskLevelAfter('No debt')
      await repayDialog.expectHealthFactorAfter(String.fromCharCode(0x221e))

      // @note this is needed for deterministic screenshots
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.expectEnabledActionAtIndex(0)

      await screenshot(repayDialog.getDialog(), 'repay-dialog-health-factor-full-repay')
    })

    test('after repay, health factor matches dashboard', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickRepayButtonAction('DAI')

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.fillAmountAction(100)

      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)

      await repayDialog.viewInDashboardAction()
      await dashboardPage.expectHealthFactor(expectedHealthFactor)
    })

    test('has correct action plan for DAI', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)

      await dashboardPage.clickRepayButtonAction('DAI')

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.fillAmountAction(100)
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.expectActions([
        { type: 'approve', asset: 'DAI' },
        { type: 'repay', asset: 'DAI' },
      ])
    })

    test('can repay DAI', async ({ page }) => {
      const repay = {
        asset: 'DAI',
        amount: 100,
      } as const

      const dashboardPage = new DashboardPageObject(page)

      await dashboardPage.clickRepayButtonAction(repay.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.fillAmountAction(repay.amount)
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)
      await repayDialog.expectSuccessPage([repay], fork)

      await screenshot(repayDialog.getDialog(), 'repay-dialog-dai-success')

      await repayDialog.viewInDashboardAction()

      await dashboardPage.expectBorrowTable({
        [repay.asset]: daiToBorrow - repay.amount,
      })
    })

    test('can fully repay DAI', async ({ page }) => {
      const repay = {
        asset: 'DAI',
        amount: 3500,
      } as const

      const dashboardPage = new DashboardPageObject(page)

      await dashboardPage.clickRepayButtonAction(repay.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.clickMaxAmountAction()
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)
      await repayDialog.expectSuccessPage([repay], fork)

      await screenshot(repayDialog.getDialog(), 'repay-dialog-dai-success')

      await repayDialog.viewInDashboardAction()

      await dashboardPage.expectBorrowTable({
        [repay.asset]: 0,
      })
    })

    // @todo: doesn't work properly because of fixed date or something
    test.skip('exact approvals are not required when repaying all', async ({ page }) => {
      const repay = {
        asset: 'DAI',
        amount: 3500,
      } as const

      const dashboardPage = new DashboardPageObject(page)

      await dashboardPage.clickRepayButtonAction(repay.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.clickMaxAmountAction()
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      // (1) first approval with extra buffer
      await actionsContainer.acceptActionAtIndex(0)
      await actionsContainer.expectEnabledActionAtIndex(1)

      await page.reload()
      await dashboardPage.clickRepayButtonAction(repay.asset)
      await repayDialog.clickMaxAmountAction()

      // exact amount of debt slightly increased but approval (1) has a buffer so it should be enough
      // this should be rewrite to assert whole action plan and then accept
      // await actionsContainer.acceptActionAtIndex(1, { type: 'repay', asset: repay.asset })
      // await actionsContainer.acceptNextActionAction()

      await repayDialog.expectSuccessPage([repay], fork)
    })
  })

  test.describe('Position when borrowed asset was not in user wallet before', () => {
    const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    const DAI_DECIMALS = 18

    const initialDeposits = {
      wstETH: 1000,
    } as const

    const daiToBorrow = 1_000_000
    const daiDebtIncreaseIn1Epoch = 1.0000029476774694 // hardcoded for DAI borrow rate 5.53%
    const daiDebtIncreaseIn2Epochs = 1.0000058953636277 // hardcoded for DAI borrow rate 5.53%

    let account: Address

    test.beforeEach(async ({ page }) => {
      ;({ account } = await setup(page, fork, {
        initialPage: 'easyBorrow',
        account: {
          type: 'connected',
          assetBalances: { wstETH: 10_000 },
        },
      }))

      const borrowPage = new BorrowPageObject(page)
      await borrowPage.depositAssetsActions(initialDeposits, daiToBorrow)
      await borrowPage.viewInDashboardAction()

      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.expectAssetToBeInDepositTable('wstETH')
    })

    test('can repay if balance is less than debt', async ({ page }) => {
      const repay = {
        asset: 'DAI',
        amount: daiToBorrow,
      } as const

      const dashboardPage = new DashboardPageObject(page)

      await dashboardPage.clickRepayButtonAction(repay.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.clickMaxAmountAction()
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)
      await repayDialog.expectSuccessPage([repay], fork)

      await repayDialog.viewInDashboardAction()

      await dashboardPage.expectNonZeroAmountInBorrowTable(repay.asset)
    })

    test('can repay if balance gt debt but lt debt after 1 epoch', async ({ page }) => {
      const repay = {
        asset: 'DAI',
        amount: daiToBorrow,
      } as const

      // overrides the balance of the user simulating that user already had some dust
      await publicTenderlyActions.setTokenBalance(
        fork.forkUrl,
        DAI_ADDRESS,
        account,
        BaseUnitNumber(
          NormalizedUnitNumber(daiToBorrow).times(daiDebtIncreaseIn1Epoch).shiftedBy(DAI_DECIMALS).minus(1),
        ),
      )

      const dashboardPage = new DashboardPageObject(page)

      // The code below is needed to refresh the balances.
      // Doing reload breaks the current debt amount for some reason.
      // Any other solution tried had the same issue.
      await dashboardPage.clickBorrowButtonAction('wstETH')
      const borrowDialog = new DialogPageObject(page, /Borrow */)
      await borrowDialog.fillAmountAction(1)
      await new ActionsPageObject(borrowDialog.locatePanelByHeader('Actions')).acceptAllActionsAction(1)
      await borrowDialog.expectSuccessPage([{ asset: 'wstETH', amount: 1 }], fork)
      await borrowDialog.viewInDashboardAction()

      await dashboardPage.clickRepayButtonAction(repay.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.clickMaxAmountAction()
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)
      await repayDialog.expectSuccessPage(
        [
          {
            asset: repay.asset,
            amount: 1_000_000.01,
          },
        ],
        fork,
      )

      await repayDialog.viewInDashboardAction()

      // non zero because we didn't try to repay the whole debt
      await dashboardPage.expectNonZeroAmountInBorrowTable(repay.asset)
    })

    test('can repay if balance gt debt after 1 epoch but lt debt after 2 epocs', async ({ page }) => {
      const repay = {
        asset: 'DAI',
        amount: daiToBorrow,
      } as const

      // overrides the balance of the user simulating that user already had some dust
      await publicTenderlyActions.setTokenBalance(
        fork.forkUrl,
        DAI_ADDRESS,
        account,
        BaseUnitNumber(
          NormalizedUnitNumber(daiToBorrow).times(daiDebtIncreaseIn2Epochs).shiftedBy(DAI_DECIMALS).minus(1),
        ),
      )

      const dashboardPage = new DashboardPageObject(page)

      // The code below is needed to refresh the balances.
      // Doing reload breaks the current debt amount for some reason.
      // Any other solution tried had the same issue.
      await dashboardPage.clickBorrowButtonAction('wstETH')
      const borrowDialog = new DialogPageObject(page, /Borrow */)
      await borrowDialog.fillAmountAction(1)
      await new ActionsPageObject(borrowDialog.locatePanelByHeader('Actions')).acceptAllActionsAction(1)
      await borrowDialog.expectSuccessPage([{ asset: 'wstETH', amount: 1 }], fork)
      await borrowDialog.viewInDashboardAction()

      await dashboardPage.clickRepayButtonAction(repay.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.clickMaxAmountAction()
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)
      await repayDialog.expectSuccessPage(
        [
          {
            asset: repay.asset,
            amount: 1_000_000.01,
          },
        ],
        fork,
      )

      await repayDialog.viewInDashboardAction()

      // zero because we tried to repay the whole debt
      await dashboardPage.expectBorrowTable({
        [repay.asset]: 0,
      })
    })
  })

  test.describe('Position with multiple borrowed assets', () => {
    const initialDeposits = {
      wstETH: initialBalances.wstETH, // deposit whole balance
    } as const

    const wstETHBorrow = {
      asset: 'wstETH',
      amount: 10,
    }

    const WETHBorrow = {
      asset: 'WETH',
      amount: 10,
    }

    test.beforeEach(async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'easyBorrow',
        account: {
          type: 'connected',
          assetBalances: { ...initialBalances },
        },
      })

      const borrowPage = new BorrowPageObject(page)
      await borrowPage.depositWithoutBorrowActions(initialDeposits) // deposit whole wallet balance
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.goToDashboardAction()

      // borrow wstETH and WETH
      const borrowDialog = new DialogPageObject(page, /Borrow */)
      const borrowActionsContainer = new ActionsPageObject(borrowDialog.locatePanelByHeader('Actions'))
      // borrow wstETH
      await dashboardPage.clickBorrowButtonAction(wstETHBorrow.asset)
      await borrowDialog.fillAmountAction(wstETHBorrow.amount)
      await borrowActionsContainer.acceptAllActionsAction(1)
      await borrowDialog.viewInDashboardAction()
      // borrow WETH
      await dashboardPage.clickBorrowButtonAction(WETHBorrow.asset)
      await borrowDialog.fillAmountAction(WETHBorrow.amount)
      await borrowActionsContainer.acceptAllActionsAction(1)
      await borrowDialog.viewInDashboardAction()
    })

    test('can change asset to aToken', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickRepayButtonAction('wstETH')

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.selectAssetAction('awstETH')
      await repayDialog.expectSelectedAsset('awstETH')
      await repayDialog.expectDialogHeader('Repay wstETH')
      await repayDialog.expectHealthFactorBeforeVisible()
    })

    test('has correct action plan for repaying erc-20 using aToken', async ({ page }) => {
      const repay = {
        asset: 'awstETH',
        amount: 5,
      } as const

      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickRepayButtonAction('wstETH')

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.selectAssetAction(repay.asset)
      await repayDialog.fillAmountAction(repay.amount)

      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.expectActions([{ type: 'repay', asset: repay.asset }])

      await screenshot(repayDialog.getDialog(), 'repay-dialog-erc20-atoken-action-plan')
    })

    test('can repay erc-20 using aToken', async ({ page }) => {
      const repay = {
        asset: 'awstETH',
        amount: 5,
      } as const

      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickRepayButtonAction('wstETH')

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.selectAssetAction(repay.asset)
      await repayDialog.fillAmountAction(repay.amount)

      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(1)

      await screenshot(repayDialog.getDialog(), 'repay-dialog-erc20-atoken-success')

      await repayDialog.viewInDashboardAction()

      await dashboardPage.expectBorrowTable({
        wstETH: wstETHBorrow.amount - repay.amount,
      })
    })

    test('has correct action plan for erc-20 repay with permits', async ({ page }) => {
      const repay = {
        asset: 'wstETH',
        amount: 5,
      } as const

      const dashboardPage = new DashboardPageObject(page)

      await dashboardPage.clickRepayButtonAction(repay.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.fillAmountAction(repay.amount)
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.expectActions([
        { type: 'permit', asset: repay.asset },
        { type: 'repay', asset: repay.asset },
      ])

      await screenshot(repayDialog.getDialog(), 'repay-dialog-erc20-permit-action-plan')
    })

    test('has correct action plan for erc-20 repay with approves', async ({ page }) => {
      const repay = {
        asset: 'wstETH',
        amount: 5,
      } as const

      const dashboardPage = new DashboardPageObject(page)

      await dashboardPage.clickRepayButtonAction(repay.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.switchPreferPermitsAction()

      await repayDialog.fillAmountAction(repay.amount)
      await actionsContainer.expectActions([
        { type: 'approve', asset: repay.asset },
        { type: 'repay', asset: repay.asset },
      ])

      await screenshot(repayDialog.getDialog(), 'repay-dialog-erc20-approve-action-plan')
    })

    test('can repay erc-20 using permits', async ({ page }) => {
      const repay = {
        asset: 'wstETH',
        amount: 5,
      } as const

      const dashboardPage = new DashboardPageObject(page)

      await dashboardPage.clickRepayButtonAction(repay.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.fillAmountAction(repay.amount)
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)
      await repayDialog.expectSuccessPage([repay], fork)

      await screenshot(repayDialog.getDialog(), 'repay-dialog-erc20-success')

      await repayDialog.viewInDashboardAction()

      await dashboardPage.expectBorrowTable({
        [repay.asset]: wstETHBorrow.amount - repay.amount,
      })
    })

    test('can repay erc-20 using approves', async ({ page }) => {
      const repay = {
        asset: 'wstETH',
        amount: 5,
      } as const

      const dashboardPage = new DashboardPageObject(page)

      await dashboardPage.clickRepayButtonAction(repay.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      const actionsContainer = new ActionsPageObject(repayDialog.locatePanelByHeader('Actions'))
      await actionsContainer.switchPreferPermitsAction()
      await repayDialog.fillAmountAction(repay.amount)
      await actionsContainer.acceptAllActionsAction(2)
      await repayDialog.expectSuccessPage([repay], fork)

      await repayDialog.viewInDashboardAction()

      await dashboardPage.expectBorrowTable({
        [repay.asset]: wstETHBorrow.amount - repay.amount,
      })
    })
  })

  test.describe('Form validation', () => {
    const initialDeposits = {
      wstETH: initialBalances.wstETH, // deposit whole balance
    } as const

    const wstETHBorrow = {
      asset: 'wstETH',
      amount: 50,
    }

    const wstETHDeposit = {
      asset: 'wstETH',
      amount: 50,
    }

    const WETHBorrow = {
      asset: 'WETH',
      amount: 10,
    }

    test.beforeEach(async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'easyBorrow',
        account: {
          type: 'connected',
          assetBalances: { ...initialBalances },
        },
      })

      const borrowPage = new BorrowPageObject(page)
      await borrowPage.depositWithoutBorrowActions(initialDeposits) // deposit whole wallet balance
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.goToDashboardAction()

      // borrow wstETH and WETH
      const borrowDialog = new DialogPageObject(page, /Borrow */)
      const borrowActionsContainer = new ActionsPageObject(borrowDialog.locatePanelByHeader('Actions'))
      // borrow wstETH
      await dashboardPage.clickBorrowButtonAction(wstETHBorrow.asset)
      await borrowDialog.fillAmountAction(wstETHBorrow.amount)
      await borrowActionsContainer.acceptAllActionsAction(1)
      await borrowDialog.viewInDashboardAction()
      // borrow WETH
      await dashboardPage.clickBorrowButtonAction(WETHBorrow.asset)
      await borrowDialog.fillAmountAction(WETHBorrow.amount)
      await borrowActionsContainer.acceptAllActionsAction(1)
      await borrowDialog.viewInDashboardAction()

      // deposit wstETH to have balance not enough to later repay debt using wstETH
      const depositDialog = new DialogPageObject(page, /Deposit */)
      const depositActionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await dashboardPage.clickDepositButtonAction(wstETHDeposit.asset)
      await depositDialog.fillAmountAction(wstETHDeposit.amount)
      await depositActionsContainer.acceptAllActionsAction(2)
      await depositDialog.viewInDashboardAction()
    })

    test('cannot repay repay more than owe', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickRepayButtonAction(WETHBorrow.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.expectHealthFactorBefore('2.03')
      await repayDialog.fillAmountAction(WETHBorrow.amount + 1)
      await repayDialog.expectAssetInputError(repayValidationIssueToMessage['exceeds-debt'])

      await screenshot(repayDialog.getDialog(), 'repay-dialog-more-than-owe')
    })

    test('cannot repay more than wallet balance', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickRepayButtonAction(wstETHBorrow.asset)

      const repayDialog = new DialogPageObject(page, headerRegExp)
      await repayDialog.expectHealthFactorBefore('2.03')
      await repayDialog.fillAmountAction(1)
      await repayDialog.expectAssetInputError(repayValidationIssueToMessage['exceeds-balance'])

      await screenshot(repayDialog.getDialog(), 'repay-dialog-more-than-balance')
    })
  })

  // @note Add tests when problem with native asset deposit is solved
  test.describe('Position with native token debt', () => {})

  test.describe('Position with only deposit', () => {
    const initialDeposits = {
      wstETH: 10,
    } as const

    test.beforeEach(async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'easyBorrow',
        account: {
          type: 'connected',
          assetBalances: { ...initialBalances },
        },
      })

      const borrowPage = new BorrowPageObject(page)
      await borrowPage.depositWithoutBorrowActions(initialDeposits)
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.goToDashboardAction()
    })

    test('nothing to repay', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.expectBorrowedAssetsToBeEmpty()
      await screenshot(page, 'repay-dialog-nothing-to-repay')
    })
  })
})
