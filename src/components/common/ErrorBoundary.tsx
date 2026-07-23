import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-error-50 to-error-100 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 bg-error-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="material-icons-round text-white text-3xl">error_outline</span>
            </div>
            <h1 className="text-2xl font-bold text-error-700 mb-4">Something went wrong</h1>
            <p className="text-error-600 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <p className="text-neutral-500 text-xs mb-4 font-mono truncate">
              {this.state.error?.message}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
