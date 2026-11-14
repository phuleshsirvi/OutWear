import { Component } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Button from './Button.jsx';

/**
 * Top-level Error Boundary
 * Catches JavaScript errors anywhere in the child component tree,
 * logs them, and displays a friendly glassmorphic fallback UI with a Reload action.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans relative z-10">
          <div className="w-full max-w-lg rounded-3xl bg-white/80 dark:bg-[#1E2140]/80 border border-white/80 dark:border-white/10 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(99,102,241,0.14)] text-center space-y-6 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-[#FBE3DC] dark:bg-rose-950/40 text-[#C2492E] dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#1E2140] dark:text-white">
                Something went wrong
              </h1>
              <p className="text-sm sm:text-base text-[#6B7194] dark:text-[#A0A5C2] max-w-sm mx-auto">
                We encountered an unexpected error while loading this page. Please try reloading to continue.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error?.message && (
              <div className="text-left bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl p-3 text-xs text-rose-800 dark:text-rose-300 font-mono break-words max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={this.handleReload}
                className="w-full sm:w-auto shadow-md"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reload
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

