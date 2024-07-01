import { Button } from '@/ui/atoms/button/Button'
import { Typography } from '@/ui/atoms/typography/Typography'
import { ErrorLayout } from '@/ui/layouts/ErrorLayout'

export interface ErrorViewProps {
  onReload: () => void
  fullScreen?: boolean
}

export function ErrorView({ onReload, fullScreen }: ErrorViewProps) {
  return (
    <ErrorLayout fullScreen={fullScreen}>
      <Typography variant="h1">Oops</Typography>
      <Typography variant="h3">Something went wrong</Typography>
      <Button onClick={onReload}>Reload</Button>
    </ErrorLayout>
  )
}
