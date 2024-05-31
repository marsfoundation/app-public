import { TokenSymbol } from '@/domain/types/TokenSymbol'
import { assets } from '@/ui/assets'
import { DocsLink } from '@/ui/atoms/docs-link/DocsLink'
import { Typography } from '@/ui/atoms/typography/Typography'
import { links } from '@/ui/constants/links'

interface SparkAirdropInfoProps {
  variant: 'deposit' | 'borrow'
  eligibleToken: TokenSymbol
}

export function SparkAirdropInfoPanel({ variant, eligibleToken }: SparkAirdropInfoProps) {
  const participants = variant === 'deposit' ? 'depositors' : 'borrowers'
  return (
    <div className="col-span-3 mt-3 flex flex-row items-center gap-3.5 rounded-lg bg-spark/10 p-[15px] sm:mt-10">
      <img src={assets.sparkIcon} alt="Spark logo" className="h-[2.75rem]" />
      <div className="flex flex-col gap-1">
        <Typography variant="h4">Eligible for Spark Airdrop</Typography>
        <p className="max-w-[62ch] text-prompt-foreground text-xs">
          {eligibleToken} {participants} will be eligible for a future ⚡&nbsp;SPK airdrop. Please read the details on
          the <DocsLink to={links.docs.sparkAirdrop}>Spark Docs</DocsLink>.
        </p>
      </div>
    </div>
  )
}
