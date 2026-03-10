// src/components/ui/ErrorBoundary.tsx
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  name?: string;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(`[ErrorBoundary:${this.props.name}]`, error);
    console.error(info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            background: "#1A0000",
            border: "1px solid #EF4444",
            borderRadius: 12,
            color: "#EF4444",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>
            💥 Crash in: {this.props.name ?? "unknown"}
          </div>
          <div style={{ whiteSpace: "pre-wrap", color: "#FCA5A5" }}>
            {this.state.error.message}
          </div>
          <div style={{ marginTop: 12, color: "#8B90A8", fontSize: 11 }}>
            {this.state.error.stack}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
