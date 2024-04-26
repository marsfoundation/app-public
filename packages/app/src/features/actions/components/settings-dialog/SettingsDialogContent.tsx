import { Percentage } from '@/domain/types/NumericValues'
import { DialogPanel } from '@/features/dialogs/common/components/DialogPanel'
import { DialogTitle } from '@/ui/atoms/dialog/Dialog'
import { Switch } from '@/ui/atoms/switch/Switch'

import { SlippageForm } from './slippage-form/SlippageForm'

export interface SettingsDialogContentProps {}

export function SettingsDialogContent({}: SettingsDialogContentProps) {
  return (
    <div className="grid max-w-xl grid-cols-[_minmax(0,1fr)_auto] items-center gap-x-12 gap-y-5 sm:gap-x-48">
      <DialogTitle className="col-span-full">Settings</DialogTitle>
      <DialogPanel className="col-span-full grid grid-cols-subgrid items-center">
        <div className="flex flex-col gap-2">
          <h3 className="text-basics-black">Use permits when available</h3>
          <p className="text-basics-dark-grey text-xs">
            Permits are a way to save gas by allowing a contract to execute multiple actions in a single transaction.
          </p>
        </div>
        <Switch className="ml-auto" checked={true} onClick={() => {}} />
      </DialogPanel>
      <DialogPanel className="col-span-full grid grid-cols-subgrid gap-y-3.5">
        <div className="flex flex-col gap-2">
          <h3 className="text-basics-black">Slippage</h3>
          <p className="text-basics-dark-grey text-xs">
            Your swap transaction will revert if the price changes unfavourably by more than this percentage.
          </p>
        </div>
        {/* @todo: pass real values when logic is implemented */}
        <SlippageForm fieldType="button" fieldValue={Percentage(0.005)} />
      </DialogPanel>
    </div>
  )
}
