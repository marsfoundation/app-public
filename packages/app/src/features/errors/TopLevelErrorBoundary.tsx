import { ErrorBoundary } from '@sentry/react'
import { ReactNode } from 'react'

import { ErrorView } from './ErrorView'

interface TopLevelErrorBoundary {
  children: ReactNode
}

export function TopLevelErrorBoundary({ children }: TopLevelErrorBoundary) {
  return (
    <ErrorBoundary fallback={<ErrorView onReload={() => window.location.reload()} fullScreen />}>
      {children}
    </ErrorBoundary>
  )
}
