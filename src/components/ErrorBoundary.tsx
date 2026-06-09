import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep this — surfaces uncaught errors during development.
    // In production, drop() in vite.config strips console calls.
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center"
        >
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold mb-2">დაფიქსირდა შეცდომა</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            ბოდიში, რაღაც არასწორად წავიდა. სცადეთ გვერდის გადატვირთვა ან დაბრუნდით მთავარ გვერდზე.
          </p>
          <div className="flex gap-3">
            <Button onClick={this.handleReload}>გვერდის გადატვირთვა</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              მთავარ გვერდზე
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
