import { UseFormReturn } from 'react-hook-form'

import { TokenWithBalance } from '@/domain/common/types'
import { Objective } from '@/features/actions/logic/types'
import { DialogActionsPanel } from '@/features/dialogs/common/components/DialogActionsPanel'
import { FormAndOverviewWrapper } from '@/features/dialogs/common/components/FormAndOverviewWrapper'
import { MultiPanelDialog } from '@/features/dialogs/common/components/MultiPanelDialog'
import { DialogForm } from '@/features/dialogs/common/components/form/DialogForm'
import { RiskAcknowledgement } from '@/features/dialogs/common/components/risk-acknowledgement/RiskAcknowledgement'
import { AssetInputSchema } from '@/features/dialogs/common/logic/form'
import { FormFieldsForDialog, PageStatus } from '@/features/dialogs/common/types'
import { DialogTitle } from '@/ui/atoms/dialog/Dialog'

import { LiFiTransactionOverview } from '../../common/components/LiFiTransactionOverview'
import { MakerTransactionOverview } from '../../common/components/MakerTransactionOverview'
import { SavingsDialogTxOverview } from '../logic/createTxOverview'
import { RiskAcknowledgementInfo } from '../logic/useSavingsDepositDialog'

export interface SavingsDepositViewProps {
  selectableAssets: TokenWithBalance[]
  assetsFields: FormFieldsForDialog
  form: UseFormReturn<AssetInputSchema>
  objectives: Objective[]
  pageStatus: PageStatus
  txOverview: SavingsDialogTxOverview | undefined
  riskAcknowledgement: RiskAcknowledgementInfo
}

export function SavingsDepositView({
  selectableAssets,
  assetsFields,
  form,
  objectives,
  pageStatus,
  txOverview,
  riskAcknowledgement,
}: SavingsDepositViewProps) {
  return (
    <MultiPanelDialog>
      <DialogTitle>Deposit to Savings</DialogTitle>

      <FormAndOverviewWrapper>
        <DialogForm form={form} assetsFields={assetsFields} selectorAssets={selectableAssets} />
        {txOverview &&
          (txOverview.type === 'lifi' ? (
            <LiFiTransactionOverview
              txOverview={txOverview}
              showExchangeRate={txOverview.exchangeRatioFromToken.symbol !== 'DAI'}
            />
          ) : (
            <MakerTransactionOverview {...txOverview} />
          ))}
      </FormAndOverviewWrapper>
      {riskAcknowledgement.warning && (
        <RiskAcknowledgement
          onStatusChange={riskAcknowledgement.onStatusChange}
          warning={riskAcknowledgement.warning}
        />
      )}

      <DialogActionsPanel
        objectives={objectives}
        onFinish={pageStatus.goToSuccessScreen}
        enabled={pageStatus.actionsEnabled}
      />
    </MultiPanelDialog>
  )
}
