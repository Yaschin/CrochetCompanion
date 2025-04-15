
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
          <h3 className="text-lg font-medium text-red-700">Something went wrong</h3>
          <p className="text-sm text-red-600 mb-4">Something went wrong with this component</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
