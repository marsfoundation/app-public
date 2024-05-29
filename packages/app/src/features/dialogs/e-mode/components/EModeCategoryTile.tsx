import { cva } from 'class-variance-authority'

import { getTokenImage } from '@/ui/assets'
import { IconStack } from '@/ui/molecules/icon-stack/IconStack'
import { cn } from '@/ui/utils/style'

import { EModeCategory } from '../types'

interface EModeCategoryTileProps {
  eModeCategory: EModeCategory
}

export function EModeCategoryTile({ eModeCategory }: EModeCategoryTileProps) {
  if (eModeCategory.tokens.length === 0) {
    return null
  }

  const iconPaths = eModeCategory.tokens.map(({ symbol }) => getTokenImage(symbol))
  const variant = eModeCategory.isActive ? 'active' : 'inactive'

  return (
    <button
      onClick={eModeCategory.onSelect}
      className={cn(
        'flex w-full flex-col items-start border-basics-border text-start',
        'h-28 justify-between rounded-xl border bg-basics-white p-2 sm:h-32 sm:p-4',
        'transition-colors duration-200 hover:bg-basics-light-grey hover:shadow-sm',
        eModeCategory.isSelected && 'border-main-blue',
      )}
    >
      <h4 className={headerVariants({ variant })}>{eModeCategory.name}</h4>
      <IconStack paths={iconPaths} maxIcons={4} />
      <ActivityBadge variant={variant} />
    </button>
  )
}

function ActivityBadge({ variant }: { variant: 'active' | 'inactive' }) {
  return <div className={activityBadgeVariants({ variant })}>{variant === 'active' ? 'Active' : 'Inactive'}</div>
}

const activityBadgeVariants = cva('rounded-lg px-2.5 py-1.5 font-semibold text-xs leading-none tracking-wide', {
  variants: {
    variant: {
      inactive: 'bg-basics-dark-grey/10 text-basics-dark-grey',
      active: 'bg-basics-green/10 text-basics-green',
    },
  },
})

const headerVariants = cva('font-semibold text-xs sm:text-base', {
  variants: {
    variant: {
      active: 'text-basics-black',
      inactive: 'text-basics-dark-grey',
    },
  },
})
