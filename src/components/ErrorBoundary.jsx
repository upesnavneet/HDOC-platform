import React from 'react';

/**
 * App-level error boundary — catches any unhandled error in the React tree.
 * Shows a full-page fallback with a reload action.
 */
export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AppErrorBoundary]', error, errorInfo);
    // H8: When Sentry is added, call Sentry.captureException(error, { extra: errorInfo }) here.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '2rem',
          background: '#0a0a0f', color: '#e0e0e8', fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ff6b6b' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#9999aa', maxWidth: '480px' }}>
            An unexpected error occurred. Please try reloading the page.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              background: '#1a1a2e', padding: '1rem', borderRadius: '8px',
              fontSize: '0.85rem', color: '#ff9999', maxWidth: '600px',
              overflow: 'auto', marginBottom: '2rem', textAlign: 'left',
            }}>
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 2rem', fontSize: '1rem', cursor: 'pointer',
              background: '#4f46e5', color: '#fff', border: 'none',
              borderRadius: '8px', fontWeight: 600,
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Route-level error boundary — catches errors within a single route.
 * Shows a contained error card; other routes remain functional.
 */
export class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RouteErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '3rem 2rem',
          textAlign: 'center', color: '#e0e0e8',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
            padding: '2.5rem', maxWidth: '480px', width: '100%',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#ff6b6b' }}>
              This section encountered an error
            </h2>
            <p style={{ color: '#9999aa', marginBottom: '1.5rem' }}>
              You can navigate to another page or try reloading.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre style={{
                background: '#1a1a2e', padding: '0.75rem', borderRadius: '8px',
                fontSize: '0.8rem', color: '#ff9999', overflow: 'auto',
                marginBottom: '1rem', textAlign: 'left',
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: '0.6rem 1.5rem', fontSize: '0.9rem', cursor: 'pointer',
                background: '#4f46e5', color: '#fff', border: 'none',
                borderRadius: '8px', fontWeight: 600, marginRight: '0.5rem',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              style={{
                padding: '0.6rem 1.5rem', fontSize: '0.9rem', cursor: 'pointer',
                background: 'transparent', color: '#9999cc', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px', fontWeight: 500,
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
