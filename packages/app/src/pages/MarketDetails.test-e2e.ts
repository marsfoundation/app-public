import { test } from '@playwright/test'
import { mainnet } from 'viem/chains'

import { DialogPageObject } from '@/features/dialogs/common/Dialog.PageObject'
import { DEFAULT_BLOCK_NUMBER } from '@/test/e2e/constants'
import { buildUrl, setup } from '@/test/e2e/setup'
import { setupFork } from '@/test/e2e/setupFork'
import { screenshot } from '@/test/e2e/utils'

import { BorrowPageObject } from './Borrow.PageObject'
import { MarketDetailsPageObject } from './MarketDetails.PageObject'

const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const WEETH = '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee'

test.describe('Market details', () => {
  const fork = setupFork({ blockNumber: DEFAULT_BLOCK_NUMBER, chainId: mainnet.id })

  test.describe('Market overview', () => {
    test('DAI', async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'marketDetails',
        initialPageParams: { asset: DAI, chainId: fork.chainId.toString() },
        account: {
          type: 'not-connected',
        },
      })

      const marketDetailsPage = new MarketDetailsPageObject(page)
      await marketDetailsPage.expectMarketOverviewValue('Borrowed', '$779.6M')
      await marketDetailsPage.expectMarketOverviewValue('Market size', '$1.216B')
      await marketDetailsPage.expectMarketOverviewValue('Total available', '$436.6M')
      await marketDetailsPage.expectMarketOverviewValue('Utilization rate', '64.10%')
      await marketDetailsPage.expectMarketOverviewValue('Instantly available', '$55.54M')
      await marketDetailsPage.expectMarketOverviewValue('MakerDAO capacity', '$381.1M')

      await screenshot(page, 'market-details-dai')
    })

    test('WETH', async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'marketDetails',
        initialPageParams: { asset: WETH, chainId: fork.chainId.toString() },
        account: {
          type: 'not-connected',
        },
      })

      const marketDetailsPage = new MarketDetailsPageObject(page)
      await marketDetailsPage.expectMarketOverviewValue('Market size', '$557.4M')
      await marketDetailsPage.expectMarketOverviewValue('Utilization rate', '62.48%')
      await marketDetailsPage.expectMarketOverviewValue('Borrowed', '$348.2M')
      await marketDetailsPage.expectMarketOverviewValue('Available', '$209.1M')

      await screenshot(page, 'market-details-weth')
    })
  })

  test.describe('Dialogs', () => {
    const initialDeposits = {
      wstETH: 10,
    }

    test('guest state', async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'marketDetails',
        initialPageParams: { asset: DAI, chainId: fork.chainId.toString() },
        account: {
          type: 'not-connected',
        },
      })

      const marketDetailsPage = new MarketDetailsPageObject(page)

      await marketDetailsPage.expectToBeLoaded()

      await marketDetailsPage.expectConnectWalletButton()
      await marketDetailsPage.expectDialogButtonToBeInvisible('Lend')
      await marketDetailsPage.expectDialogButtonToBeInvisible('Deposit')
      await marketDetailsPage.expectDialogButtonToBeInvisible('Borrow')
    })

    test("can't deposit if not enough balance", async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'marketDetails',
        initialPageParams: { asset: WETH, chainId: fork.chainId.toString() },
        account: {
          type: 'connected-random',
        },
      })

      const marketDetailsPage = new MarketDetailsPageObject(page)

      await marketDetailsPage.expectToBeLoaded()

      await marketDetailsPage.expectDialogButtonToBeInactive('Deposit')
    })

    test("can't lend if not enough balance", async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'marketDetails',
        initialPageParams: { asset: DAI, chainId: fork.chainId.toString() },
        account: {
          type: 'connected-random',
        },
      })

      const marketDetailsPage = new MarketDetailsPageObject(page)

      await marketDetailsPage.expectToBeLoaded()

      await marketDetailsPage.expectDialogButtonToBeInactive('Lend')
    })

    test("can't borrow if not enough balance", async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'marketDetails',
        initialPageParams: { asset: DAI, chainId: fork.chainId.toString() },
        account: {
          type: 'connected-random',
        },
      })

      const marketDetailsPage = new MarketDetailsPageObject(page)

      await marketDetailsPage.expectToBeLoaded()

      await marketDetailsPage.expectBorrowNotAvailableDisclaimer()
      await marketDetailsPage.expectDialogButtonToBeInvisible('Borrow')
    })

    test('opens dialogs for DAI', async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'easyBorrow',
        account: {
          type: 'connected-random',
          assetBalances: {
            ...initialDeposits,
            DAI: 1000,
            sDAI: 1000,
          },
        },
      })

      const borrowPage = new BorrowPageObject(page)
      await borrowPage.depositWithoutBorrowActions({ ...initialDeposits })

      await page.goto(buildUrl('marketDetails', { asset: DAI, chainId: fork.chainId.toString() }))

      const marketDetailsPage = new MarketDetailsPageObject(page)

      await marketDetailsPage.openDialogAction('Lend')
      const lendDialog = new DialogPageObject(page, /Deposit/i)
      await lendDialog.expectDialogHeader('Deposit DAI')
      await lendDialog.closeDialog()

      await marketDetailsPage.openDialogAction('Deposit')
      const depositDialog = new DialogPageObject(page, /Deposit/i)
      await depositDialog.expectDialogHeader('Deposit sDAI')
      await depositDialog.closeDialog()

      await marketDetailsPage.openDialogAction('Borrow')
      const borrowDialog = new DialogPageObject(page, /Borrow/i)
      await borrowDialog.expectDialogHeader('Borrow DAI')
      await borrowDialog.closeDialog()
    })

    test('opens dialogs for WETH', async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'easyBorrow',
        account: {
          type: 'connected-random',
          assetBalances: {
            ...initialDeposits,
            WETH: 10,
          },
        },
      })

      const borrowPage = new BorrowPageObject(page)
      await borrowPage.depositWithoutBorrowActions({ ...initialDeposits })

      await page.goto(buildUrl('marketDetails', { asset: WETH, chainId: fork.chainId.toString() }))

      const marketDetailsPage = new MarketDetailsPageObject(page)

      await marketDetailsPage.openDialogAction('Deposit')
      const lendDialog = new DialogPageObject(page, /Deposit/i)
      await lendDialog.expectDialogHeader('Deposit WETH')
      await lendDialog.closeDialog()

      await marketDetailsPage.openDialogAction('Borrow')
      const borrowDialog = new DialogPageObject(page, /Borrow/i)
      await borrowDialog.expectDialogHeader('Borrow WETH')
      await borrowDialog.closeDialog()
    })
  })

  test.describe('Isolated assets', () => {
    const BLOCK_NUMBER_WITH_WEETH = 20118125n
    const fork = setupFork({ blockNumber: BLOCK_NUMBER_WITH_WEETH, chainId: mainnet.id })

    test('Correctly displays debt ceiling', async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'marketDetails',
        initialPageParams: { asset: WEETH, chainId: fork.chainId.toString() },
        account: {
          type: 'not-connected',
        },
      })

      const marketDetailsPage = new MarketDetailsPageObject(page)
      await marketDetailsPage.expectDebt('$3.17M')
      await marketDetailsPage.expectDebtCeiling('$50M')
    })
  })

  test.describe('Errors', () => {
    const NOT_A_RESERVE = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

    test('displays 404 page for unknown chain', async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'marketDetails',
        initialPageParams: { asset: DAI, chainId: '12345' },
        account: {
          type: 'not-connected',
        },
      })

      const marketDetailsPage = new MarketDetailsPageObject(page)
      await marketDetailsPage.expect404()
    })

    test('displays 404 page for unknown asset', async ({ page }) => {
      await setup(page, fork, {
        initialPage: 'marketDetails',
        initialPageParams: { asset: NOT_A_RESERVE, chainId: fork.chainId.toString() },
        account: {
          type: 'not-connected',
        },
      })

      const marketDetailsPage = new MarketDetailsPageObject(page)
      await marketDetailsPage.expect404()
    })
  })
})
