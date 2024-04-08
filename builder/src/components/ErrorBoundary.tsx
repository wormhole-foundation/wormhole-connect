import React from "react";

export default class ErrorBoundary extends React.Component<
  { children: React.ReactElement },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return "An unexpected error has occurred. Please refresh the page.";
    }

    return this.props.children;
  }
}
