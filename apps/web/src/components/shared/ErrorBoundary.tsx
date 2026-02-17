import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@flashcard/ui";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertTriangle className="h-12 w-12 text-error-500" />
          <h1 className="text-lg font-semibold text-neutral-900">
            Something went wrong
          </h1>
          <p className="text-sm text-neutral-500">
            An unexpected error occurred. Please try again.
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            Reload App
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
