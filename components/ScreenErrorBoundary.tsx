import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  screenName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error(`[ScreenErrorBoundary${this.props.screenName ? `: ${this.props.screenName}` : ''}]`, error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😵</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

/** HOC that wraps a component with ScreenErrorBoundary. */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  screenName?: string,
): ComponentType<P> {
  return function Wrapped(props: P) {
    return (
      <ScreenErrorBoundary screenName={screenName}>
        <Component {...props} />
      </ScreenErrorBoundary>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
