import { Component, ReactNode } from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback: (({ error }: { error: any }) => ReactNode) | ReactNode
}

export type ErrorBoundaryState =
  | {
      error: any
      hasError: true
    }
  | {
      hasError: false
    }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return {
      error,
      hasError: true,
    }
  }

  render() {
    if (this.state.hasError) {
      if (!this.props.fallback) {
        throw this.state.error
      }

      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({ error: this.state.error })
      }

      return this.props.fallback
    }

    return this.props.children
  }
}
