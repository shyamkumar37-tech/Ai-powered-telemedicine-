import React from "react";
import ErrorStateCard from "./ui/ErrorStateCard";
import { trackRuntimeException, tryRecoverChunkLoad } from "../services/telemetry";

interface RouteErrorBoundaryProps {
  routePath?: string;
  children: React.ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class RouteErrorBoundary extends React.Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      message: ""
    };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      message: error?.message || "Unable to load this route."
    };
  }

  componentDidCatch(error: any) {
    trackRuntimeException({
      kind: "route-boundary",
      route: this.props.routePath,
      message: String(error?.message || "Unable to load this route.")
    });
    tryRecoverChunkLoad(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <ErrorStateCard
            title="Unable to load this page"
            message="A critical routing error prevented this screen from loading."
            errorDetails={this.state.message}
            onRetry={() => window.location.reload()}
            className="w-full max-w-2xl"
          />
        </div>
      );
    }

    return this.props.children;
  }
}
