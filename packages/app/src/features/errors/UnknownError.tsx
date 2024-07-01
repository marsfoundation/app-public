import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { captureError } from '@/utils/sentry'

import { ErrorView } from './ErrorView'

interface UnknownErrorProps {
  error: any
  fullScreen?: boolean
}

export function UnknownError({ error, fullScreen }: UnknownErrorProps) {
  const navigate = useNavigate()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    captureError(error)
  }, [])

  return <ErrorView onReload={() => navigate(0)} fullScreen={fullScreen} />
}
