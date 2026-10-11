import React from "react";
export default class ErrorBoundary extends React.Component {
  state = {
    failed: false,
  };
  static getDerivedStateFromError() {
    return {
      failed: true,
    };
  }
  render() {
    return this.state.failed ? (
      <main className="section">
        <h1>Unable to display this page</h1>
        <p>Please reload and try again.</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
