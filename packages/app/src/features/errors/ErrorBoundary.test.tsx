import { render, screen } from '@testing-library/react'
import { ReactNode } from 'react'
import { describe, test } from 'vitest'

import { ErrorBoundary } from './ErrorBoundary'

describe(ErrorBoundary.name, () => {
  test('renders fallback when error is thrown', () => {
    render(
      <ErrorBoundary fallback={<Fallback />}>
        <ToThrowOrNotToThrow shouldThrow={true}>Content</ToThrowOrNotToThrow>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Error occurred')).toBeInTheDocument()
  })

  test('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary fallback={<Fallback />}>
        <ToThrowOrNotToThrow shouldThrow={false}>Content</ToThrowOrNotToThrow>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  test('renders fallback with error message when error is thrown', () => {
    render(
      <ErrorBoundary fallback={({ error }) => <FallbackWithErrorMessage error={error} />}>
        <ToThrowOrNotToThrow shouldThrow={true}>Content</ToThrowOrNotToThrow>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Error occurred: Test error')).toBeInTheDocument()
  })
})

function Fallback() {
  return <div>Error occurred</div>
}

function FallbackWithErrorMessage({ error }: { error: any }) {
  return <div>Error occurred: {error.message}</div>
}

function ToThrowOrNotToThrow({ children, shouldThrow }: { children: ReactNode; shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <>{children}</>
}
