import { Locator, expect } from '@playwright/test'

import { BasePageObject } from '@/test/e2e/BasePageObject'
import { testIds } from '@/ui/utils/testIds'

export type DialogType = 'Lend' | 'Deposit' | 'Borrow'

export class MarketDetailsPageObject extends BasePageObject {
  // #region locators
  locateMarketOverview(): Locator {
    return this.locatePanelByHeader('Market overview')
  }

  locateMyWallet(): Locator {
    return this.locatePanelByHeader('My wallet')
  }
  // #endregion

  // #region actions
  async openDialogAction(type: DialogType): Promise<void> {
    await this.page.getByRole('button', { name: type }).click()
  }
  // #endregion

  // #region assertions
  async expectMarketOverviewValue(key: string, value: string): Promise<void> {
    await expect(
      this.locateMarketOverview()
        .getByRole('listitem')
        .filter({ has: this.page.getByText(key) })
        .getByRole('paragraph')
        .last(),
    ).toHaveText(value)
  }

  async expectConnectWalletButton(): Promise<void> {
    await expect(this.locateMyWallet().getByRole('button', { name: 'Connect wallet' })).toBeEnabled()
  }

  async expectDialogButtonToBeActive(type: DialogType): Promise<void> {
    await expect(this.locateMyWallet().getByRole('button', { name: type })).toBeEnabled()
  }

  async expectDialogButtonToBeInactive(type: DialogType): Promise<void> {
    await expect(this.locateMyWallet().getByRole('button', { name: type })).toBeDisabled()
  }

  async expectDialogButtonToBeInvisible(type: DialogType): Promise<void> {
    await expect(this.locateMyWallet().getByRole('button', { name: type })).not.toBeVisible()
  }

  async expectBorrowNotAvailableDisclaimer(): Promise<void> {
    await expect(this.locateMyWallet().getByText('To borrow you need to deposit any other asset first.')).toBeVisible()
  }

  async expectToBeLoaded(): Promise<void> {
    await expect(this.locateMarketOverview()).toBeVisible()
    await expect(this.locateMyWallet()).toBeVisible()
  }

  async expectDebtCeiling(value: string): Promise<void> {
    await expect(this.page.getByTestId(testIds.marketDetails.collateralStatusPanel.debtCeiling)).toHaveText(value)
  }

  async expectDebt(value: string): Promise<void> {
    await expect(this.page.getByTestId(testIds.marketDetails.collateralStatusPanel.debt)).toHaveText(value)
  }

  async expect404(): Promise<void> {
    await expect(this.page.getByText('404')).toBeVisible()
    await expect(this.page.getByText('The requested page could not be found.')).toBeVisible()
  }
  // #endregion
}
