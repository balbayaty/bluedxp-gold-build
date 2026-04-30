/**
 * Error Boundary for Intelligence & Analytics
 * Catches errors and shows user-friendly messages
 */

"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class IntelligenceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Intelligence & Analytics Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <i className="ri-error-warning-line text-4xl text-red-400 mb-4"></i>
            <h3 className="text-lg font-semibold text-white mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-[#9ca3af] mb-4">
              {this.state.error?.message ||
                "An error occurred in the Intelligence & Analytics module"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <i className="ri-refresh-line mr-2"></i>
              Reload
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default IntelligenceErrorBoundary;
export { IntelligenceErrorBoundary };
