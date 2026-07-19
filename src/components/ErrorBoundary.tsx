import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
  info: string;
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, info: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
    this.setState({ info: info.componentStack || '' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0f0f1a',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'monospace'
        }}>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #e74c3c',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%'
          }}>
            <h1 style={{ color: '#e74c3c', marginBottom: '1rem', fontSize: '1.5rem' }}>
              ⚠ React Render Error
            </h1>
            <p style={{ color: '#ff7675', marginBottom: '1rem', fontWeight: 'bold' }}>
              {this.state.error?.message}
            </p>
            <pre style={{
              background: '#0d0d1a',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.75rem',
              color: '#a29bfe',
              maxHeight: '400px'
            }}>
              {this.state.error?.stack}
            </pre>
            {this.state.info && (
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', color: '#74b9ff' }}>Component Stack</summary>
                <pre style={{
                  background: '#0d0d1a',
                  padding: '1rem',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '0.7rem',
                  color: '#55efc4',
                  marginTop: '0.5rem'
                }}>
                  {this.state.info}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 2rem',
                background: '#6c5ce7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
