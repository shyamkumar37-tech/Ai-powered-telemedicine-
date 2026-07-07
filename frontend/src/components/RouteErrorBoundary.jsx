import React from "react";
import ErrorStateCard from "./ui/ErrorStateCard";
import { trackRuntimeException, tryRecoverChunkLoad } from "../services/telemetry";

export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      message: ""
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unable to load this route."
    };
  }

  componentDidCatch(error) {
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
        <ErrorStateCard
          title="Unable to load this page"
          body={this.state.message || "A route error blocked this screen."}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}
