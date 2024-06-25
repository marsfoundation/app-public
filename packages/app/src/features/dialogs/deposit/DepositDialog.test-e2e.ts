import { test } from '@playwright/test'
import { mainnet } from 'viem/chains'

import { ActionsPageObject } from '@/features/actions/ActionsContainer.PageObject'
import { BorrowPageObject } from '@/pages/Borrow.PageObject'
import { DashboardPageObject } from '@/pages/Dashboard.PageObject'
import { DEFAULT_BLOCK_NUMBER } from '@/test/e2e/constants'
import { setup } from '@/test/e2e/setup'
import { setupFork } from '@/test/e2e/setupFork'
import { screenshot } from '@/test/e2e/utils'

import { tenderlyRpcActions } from '@/domain/tenderly/TenderlyRpcActions'
import { DialogPageObject } from '../common/Dialog.PageObject'

const headerRegExp = /Deposit */

test.describe('Deposit dialog', () => {
  const fork = setupFork({ blockNumber: DEFAULT_BLOCK_NUMBER, chainId: mainnet.id })
  const initialBalances = {
    wstETH: 100,
    rETH: 100,
    ETH: 100,
  }

  test.describe('Position with deposit and borrow', () => {
    const initialDeposits = {
      wstETH: 1,
      rETH: 2,
    }
    const daiToBorrow = 1500
    const expectedInitialHealthFactor = '4.03'
    const expectedHealthFactor = '5.35'

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
      await dashboardPage.clickDepositButtonAction('rETH')

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.expectSelectedAsset('rETH')
      await depositDialog.expectDialogHeader('Deposit rETH')
      await depositDialog.expectHealthFactorBeforeVisible()

      await screenshot(depositDialog.getDialog(), 'deposit-dialog-default-view')
    })

    test('calculates health factor changes correctly', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickDepositButtonAction('rETH')

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(1)

      await depositDialog.expectRiskLevelBefore('Healthy')
      await depositDialog.expectHealthFactorBefore(expectedInitialHealthFactor)
      await depositDialog.expectRiskLevelAfter('Healthy')
      await depositDialog.expectHealthFactorAfter(expectedHealthFactor)

      // @note this is needed for deterministic screenshots
      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await actionsContainer.expectEnabledActionAtIndex(0)

      await screenshot(depositDialog.getDialog(), 'deposit-dialog-health-factor')
    })

    test('after deposit, health factor matches dashboard', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickDepositButtonAction('rETH')

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(1)

      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)

      await depositDialog.viewInDashboardAction()
      await dashboardPage.expectHealthFactor(expectedHealthFactor)
    })

    test('has correct action plan for erc-20 with permit support', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.expectDepositTable(initialDeposits)

      await dashboardPage.clickDepositButtonAction('wstETH')

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(1)
      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await actionsContainer.expectActions([
        { type: 'permit', asset: 'wstETH' },
        { type: 'deposit', asset: 'wstETH' },
      ])
    })

    test('can switch to approves in action plan', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.expectDepositTable(initialDeposits)

      await dashboardPage.clickDepositButtonAction('wstETH')

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(1)
      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))

      await actionsContainer.expectEnabledActionAtIndex(0)
      await actionsContainer.expectActions([
        { type: 'permit', asset: 'wstETH' },
        { type: 'deposit', asset: 'wstETH' },
      ])

      await actionsContainer.switchPreferPermitsAction()

      await actionsContainer.expectEnabledActionAtIndex(0)
      await actionsContainer.expectActions([
        { type: 'approve', asset: 'wstETH' },
        { type: 'deposit', asset: 'wstETH' },
      ])
    })

    test('has correct action plan for erc-20 with no permit support', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.expectDepositTable(initialDeposits)

      await dashboardPage.clickDepositButtonAction('rETH')

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(1)
      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await actionsContainer.expectActions([
        { type: 'approve', asset: 'rETH' },
        { type: 'deposit', asset: 'rETH' },
      ])
    })

    test('can deposit erc-20 using permits', async ({ page }) => {
      const deposit = {
        asset: 'wstETH',
        amount: 1,
      }

      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.expectDepositTable(initialDeposits)

      await dashboardPage.clickDepositButtonAction(deposit.asset)

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(deposit.amount)
      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)
      await depositDialog.expectSuccessPage([deposit], fork)

      await screenshot(depositDialog.getDialog(), 'deposit-dialog-wsteth-success')

      await depositDialog.viewInDashboardAction()

      await dashboardPage.expectDepositTable({
        ...initialDeposits,
        wstETH: initialDeposits.wstETH + 1,
      })
    })

    test('can deposit erc-20 using approves', async ({ page }) => {
      const deposit = {
        asset: 'rETH',
        amount: 1,
      }

      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.expectDepositTable(initialDeposits)

      await dashboardPage.clickDepositButtonAction(deposit.asset)

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(deposit.amount)
      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)
      await depositDialog.expectSuccessPage([deposit], fork)

      await screenshot(depositDialog.getDialog(), 'deposit-dialog-reth-success')

      await depositDialog.viewInDashboardAction()

      await dashboardPage.expectDepositTable({
        ...initialDeposits,
        rETH: initialDeposits.rETH + 1,
      })
    })

    test('has correct action plan for native asset', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.expectDepositTable(initialDeposits)

      await dashboardPage.clickDepositButtonAction('WETH')

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.selectAssetAction('ETH')
      await depositDialog.fillAmountAction(1)
      await depositDialog.expectHealthFactorVisible()
      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await actionsContainer.expectActions([{ type: 'deposit', asset: 'ETH' }])

      await screenshot(depositDialog.getDialog(), 'deposit-dialog-eth-action-plan')
    })

    test('can deposit native asset', async ({ page }) => {
      const deposit = {
        asset: 'WETH',
        amount: 1,
      }

      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.expectDepositTable(initialDeposits)

      await dashboardPage.clickDepositButtonAction(deposit.asset)

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.selectAssetAction('ETH')
      await depositDialog.fillAmountAction(deposit.amount)
      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(1)
      await depositDialog.expectSuccessPage(
        [
          {
            asset: 'ETH',
            amount: deposit.amount,
          },
        ],
        fork,
      )
      await screenshot(depositDialog.getDialog(), 'deposit-dialog-eth-success')

      await depositDialog.viewInDashboardAction()

      await dashboardPage.expectDepositTable({
        ...initialDeposits,
        // @todo Figure out how WETH and ETH conversion should work
        WETH: 1,
      })
    })

    test("can't deposit more than wallet balance", async ({ page }) => {
      const depositAsset = 'rETH'
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickDepositButtonAction(depositAsset)

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(initialBalances[depositAsset] - initialDeposits[depositAsset] + 1)

      await depositDialog.expectAssetInputError('Exceeds your balance')
      await depositDialog.expectHealthFactorBeforeVisible()
      await screenshot(depositDialog.getDialog(), 'deposit-dialog-exceeds-balance')
    })

    test('requires new approve when the input value is increased', async ({ page }) => {
      const depositAsset = 'rETH'
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickDepositButtonAction(depositAsset)

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(1)

      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))

      await actionsContainer.acceptActionAtIndex(0)
      await actionsContainer.expectEnabledActionAtIndex(1, { type: 'deposit', asset: depositAsset })

      await depositDialog.fillAmountAction(2)

      await actionsContainer.expectEnabledActionAtIndex(0, { type: 'approve', asset: depositAsset })
    })

    test('requires new permit when the input value is changed', async ({ page }) => {
      const depositAsset = 'wstETH'
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickDepositButtonAction(depositAsset)

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(2)

      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))

      await actionsContainer.acceptActionAtIndex(0)
      await actionsContainer.expectEnabledActionAtIndex(1, { type: 'deposit', asset: depositAsset })

      await depositDialog.fillAmountAction(1)

      await actionsContainer.expectEnabledActionAtIndex(0, { type: 'permit', asset: depositAsset })
    })
  })

  test.describe('Position with only deposit', () => {
    const initialDeposits = {
      wstETH: 10,
      rETH: 2,
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
      // to simulate a position with only deposits, we go through the easy borrow flow
      // but interrupt it before the borrow action, going directly to the dashboard
      // this way we have deposit transactions executed, but no borrow transaction
      // resulting in a position with only deposits
      await borrowPage.fillDepositAssetAction(0, 'wstETH', initialDeposits.wstETH)
      await borrowPage.addNewDepositAssetAction()
      await borrowPage.fillBorrowAssetAction(1) // doesn't matter, we're not borrowing anything
      await borrowPage.fillDepositAssetAction(1, 'rETH', initialDeposits.rETH)
      await borrowPage.submitAction()

      const actionsContainer = new ActionsPageObject(page)
      for (let i = 0; i < 4; i++) {
        await actionsContainer.acceptActionAtIndex(i)
      }
      await actionsContainer.expectEnabledActionAtIndex(4)

      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.goToDashboardAction()
    })

    test('does not display health factor', async ({ page }) => {
      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickDepositButtonAction('rETH')

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(1)

      await depositDialog.expectHealthFactorNotVisible()

      // @note this is needed for deterministic screenshots
      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await actionsContainer.expectEnabledActionAtIndex(0)

      await screenshot(depositDialog.getDialog(), 'deposit-dialog-only-deposit-health-factor')
    })
  })

  test.describe('No position', () => {
    const fork = setupFork({ blockNumber: 19588510n, chainId: mainnet.id }) // block number with WBTC supply close to cap

    test('can deposit up to max cap', async ({ page }) => {
      const initialBalances = {
        ETH: 1,
        WBTC: 1000,
      }

      await setup(page, fork, {
        initialPage: 'dashboard',
        account: {
          type: 'connected',
          assetBalances: { ...initialBalances },
        },
      })

      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickDepositButtonAction('WBTC')

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.clickMaxAmountAction()
      await tenderlyRpcActions.evmIncreaseTime(fork.forkUrl, 5 * 60)

      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)
      await depositDialog.expectSuccessPage(
        [
          {
            asset: 'WBTC',
            amount: 507.527307,
          },
        ],
        fork,
        {
          WBTC: 34_087_363.63,
        },
      )

      await depositDialog.viewInDashboardAction()
      await dashboardPage.expectDepositTable({
        WBTC: 507.527307,
      })
    })

    test('can deposit asset that cannot be used as collateral', async ({ page }) => {
      const initialBalances = {
        ETH: 1,
        USDT: 10000,
      }

      await setup(page, fork, {
        initialPage: 'dashboard',
        account: {
          type: 'connected',
          assetBalances: { ...initialBalances },
        },
      })

      const dashboardPage = new DashboardPageObject(page)
      await dashboardPage.clickDepositButtonAction('USDT')

      const depositDialog = new DialogPageObject(page, headerRegExp)
      await depositDialog.fillAmountAction(initialBalances.USDT)

      const actionsContainer = new ActionsPageObject(depositDialog.locatePanelByHeader('Actions'))
      await actionsContainer.acceptAllActionsAction(2)
      await depositDialog.expectSuccessPage(
        [
          {
            asset: 'USDT',
            amount: initialBalances.USDT,
          },
        ],
        fork,
      )

      await depositDialog.viewInDashboardAction()
      await dashboardPage.expectDepositTable({
        USDT: initialBalances.USDT,
      })
    })
  })
})
