
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
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span>Something went wrong</span>
              </AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-muted-foreground">
              We encountered an error while rendering this component. 
              Would you like to try again?
            </p>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => this.setState({ hasError: false })}>
                Try Again
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
