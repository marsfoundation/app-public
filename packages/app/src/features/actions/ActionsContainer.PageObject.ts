import { Locator, Page, expect } from '@playwright/test'

import { formatPercentage } from '@/domain/common/format'
import { Percentage } from '@/domain/types/NumericValues'
import { BasePageObject } from '@/test/e2e/BasePageObject'
import { isPage } from '@/test/e2e/utils'
import { testIds } from '@/ui/utils/testIds'

import { tenderlyRpcActions } from '@/domain/tenderly/TenderlyRpcActions'
import { sleep } from '@/utils/promises'
import { ActionType } from './logic/types'

export class ActionsPageObject extends BasePageObject {
  constructor(pageOrLocator: Page | Locator) {
    if (isPage(pageOrLocator)) {
      super(pageOrLocator)
      this.region = this.locatePanelByHeader('Actions')
    } else {
      super(pageOrLocator)
    }
  }

  locateSettingsDialog(): Locator {
    return this.locateDialogByHeader('Settings')
  }

  locateActionAtIndex(index: number): Locator {
    return this.region.getByTestId(testIds.actions.row(index))
  }

  // #region actions
  async acceptAllActionsAction(expectedNumberOfActions: number, forkContext?: any): Promise<void> {
    for (let index = 0; index < expectedNumberOfActions; index++) {
      const row = this.region.getByTestId(testIds.actions.row(index))

      await row.getByRole('button', { name: actionButtonRegex }).click()

      await tenderlyRpcActions.evmSetNextBlockTimestamp(
        forkContext.forkUrl,
        forkContext.simulationDate.getTime() / 1000,
      )
      await sleep(400)
    }
  }

  async acceptActionAtIndex(index: number): Promise<void> {
    const row = this.region.getByTestId(testIds.actions.row(index))
    await row.getByRole('button', { name: actionButtonRegex }).click()
  }

  async switchPreferPermitsAction(): Promise<void> {
    await this.region.getByTestId(testIds.actions.settings.dialog).click()
    const settingsDialog = this.locateSettingsDialog()
    await settingsDialog.getByRole('switch', { disabled: false }).click()
    await settingsDialog.getByRole('button').filter({ hasText: 'Close' }).click()
  }

  async setSlippageAction(slippage: number, type: 'button' | 'input'): Promise<void> {
    await this.region.getByTestId(testIds.actions.settings.dialog).click()
    const settingsDialog = this.locateSettingsDialog()
    if (type === 'button') {
      await settingsDialog
        .getByRole('button', { name: formatPercentage(Percentage(slippage), { minimumFractionDigits: 0 }) })
        .click()
    } else {
      await settingsDialog.getByRole('textbox').fill(formatPercentage(Percentage(slippage), { skipSign: true }))
    }
    await settingsDialog.getByRole('button').filter({ hasText: 'Close' }).click()
  }

  async openSettingsDialogAction(): Promise<void> {
    await this.region.getByTestId(testIds.actions.settings.dialog).click()
  }

  async closeSettingsDialogAction(): Promise<void> {
    await this.locateSettingsDialog().getByRole('button').filter({ hasText: 'Close' }).click()
  }

  async fillSlippageAction(slippage: string | number): Promise<void> {
    if (typeof slippage === 'number') {
      slippage = formatPercentage(Percentage(slippage), { skipSign: true })
    }
    await this.locateSettingsDialog().getByRole('textbox').fill(slippage)
  }
  // #endregion actions

  // #region assertions
  async expectActions(actions: SimplifiedAction[]): Promise<void> {
    for (const [index, expectedAction] of actions.entries()) {
      await this.expectActionAtIndex(index, expectedAction)
    }

    await expect(this.region.getByTestId(testIds.actions.row(actions.length))).toBeHidden() // this ensures that there are no more rows
  }

  async expectActionAtIndex(index: number, expectedAction: SimplifiedAction): Promise<void> {
    const row = this.locateActionAtIndex(index)
    await expect(row).toContainText(actionToTitle(expectedAction))

    if (expectedAction.type === 'exchange') {
      await expectExchangeActionRow(row, expectedAction)
    }
  }

  async expectEnabledActionAtIndex(index: number, expectedAction?: SimplifiedAction): Promise<void> {
    if (expectedAction) {
      await this.expectActionAtIndex(index, expectedAction)
    }

    const row = this.locateActionAtIndex(index)
    await expect(row.getByRole('button', { name: actionButtonRegex, disabled: false })).toBeVisible()
  }

  async expectDisabledActionAtIndex(index: number): Promise<void> {
    const row = this.locateActionAtIndex(index)
    await expect(row.getByRole('button', { name: actionButtonRegex, disabled: true })).toBeVisible()
  }

  async expectSlippage(slippage: number): Promise<void> {
    await expect(this.region.getByTestId(testIds.actions.flavours.exchangeActionRow.slippage)).toHaveText(
      formatPercentage(Percentage(slippage), { minimumFractionDigits: 1 }),
    )
  }

  async expectSlippageValidationError(error: string): Promise<void> {
    await expect(this.locateSettingsDialog().getByTestId(testIds.actions.settings.slippage.error)).toHaveText(error)
  }

  async expectExtendedActions(actions: SimplifiedExtendedAction[]): Promise<void> {
    for (const [index, expectedAction] of actions.entries()) {
      await this.expectExtendedActionAtIndex(index, expectedAction)
    }

    await expect(this.locateActionAtIndex(actions.length)).toBeHidden() // this ensures that there are no more rows
  }

  async expectExtendedActionAtIndex(index: number, expectedAction: SimplifiedExtendedAction): Promise<void> {
    const row = this.locateActionAtIndex(index)
    await expect(row).toContainText(extendedActionToTitle(expectedAction))
  }
  // #endregion assertions
}

type SimplifiedExchangeAction = {
  type: 'exchange'
  inputAsset: string
  outputAsset: string
  fee?: string
  slippage?: string
  finalToTokenAmount?: string
  finalDAIAmount?: string
}

type SimplifiedAction =
  | {
      type: Exclude<ActionType, 'exchange'>
      asset: string
    }
  | SimplifiedExchangeAction

function actionToTitle(action: SimplifiedAction): string {
  switch (action.type) {
    case 'approve':
      return `Approve ${action.asset}`
    case 'deposit':
      return `Deposit ${action.asset}`
    case 'withdraw':
      return `Withdraw ${action.asset}`
    case 'approveDelegation':
      return `Approve delegation ${action.asset}`
    case 'borrow':
      return `Borrow ${action.asset}`
    case 'permit':
      return `Permit ${action.asset}`
    case 'repay':
      return `Repay with ${action.asset}`
    case 'setUseAsCollateral':
      return '' // not used in collateral dialog tests
    case 'setUserEMode':
      return '' // not used in e-mode dialog tests
    case 'approveExchange':
      return `Approve exchange ${action.asset}`
    case 'exchange':
      return `Convert ${action.inputAsset} to ${action.outputAsset}`
    case 'daiToSDaiDeposit':
    case 'usdcToSDaiDeposit':
    case 'xDaiToSDaiDeposit':
      return `Wrap ${action.asset} into sDAI`
    case 'daiFromSDaiWithdraw':
    case 'usdcFromSDaiWithdraw':
    case 'xDaiFromSDaiWithdraw':
      return `Unwrap sDAI into ${action.asset}`
  }
}

const actionVerbs = [
  'Approve',
  'Deposit',
  'Withdraw',
  'Borrow',
  'Permit',
  'Repay',
  'Enable',
  'Disable',
  'Convert',
  'Wrap',
  'Unwrap',
]
const actionButtonRegex = new RegExp(`^(${actionVerbs.join('|')})$`)

// exchange action deserves a special treatment as it's the only one with extra fields on UI
async function expectExchangeActionRow(exchangeRow: Locator, action: SimplifiedExchangeAction): Promise<void> {
  await expect(exchangeRow.getByTestId(testIds.actions.flavours.exchangeActionRow.lifiBadge)).toBeVisible()
  if (action.fee) {
    await expect(exchangeRow.getByTestId(testIds.actions.flavours.exchangeActionRow.fee)).toHaveText(action.fee)
  }
  if (action.slippage) {
    await expect(exchangeRow.getByTestId(testIds.actions.flavours.exchangeActionRow.slippage)).toHaveText(
      action.slippage,
    )
  }
  if (action.finalDAIAmount) {
    await expect(exchangeRow.getByTestId(testIds.actions.flavours.exchangeActionRow.finalDAIAmount)).toContainText(
      action.finalDAIAmount,
    )
  }
  if (action.finalToTokenAmount) {
    await expect(exchangeRow.getByTestId(testIds.actions.flavours.exchangeActionRow.finalToTokenAmount)).toHaveText(
      action.finalToTokenAmount,
    )
  }
}

type SimplifiedExtendedAction =
  | { type: 'approve'; asset: string; amount: number }
  | { type: 'permit'; asset: string; amount: number }
  | { type: 'deposit'; asset: string; amount: number }
  | { type: 'borrow'; asset: string; amount: number }

function extendedActionToTitle(action: SimplifiedExtendedAction): string {
  const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const amountFormatted = formatter.format(action.amount)

  switch (action.type) {
    case 'approve':
      return `Approve ${amountFormatted} ${action.asset}`
    case 'deposit':
      return `Deposit ${amountFormatted} ${action.asset}`
    case 'borrow':
      return `Borrow ${amountFormatted} ${action.asset}`
    case 'permit':
      return `Permit ${amountFormatted} ${action.asset}`
  }
}
