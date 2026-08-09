import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { useColors, type Palette } from '@/src/shared/theme';

interface Props {
  children: ReactNode;
  screenName?: string;
  colors: Palette;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends Component<Props, State> {
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
      const { colors } = this.props;
      return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          <Text style={styles.emoji}>😵</Text>
          <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
          <Text style={[styles.message, { color: colors.muted }]}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accentText }]}
            onPress={this.handleRetry}
          >
            <Text style={[styles.buttonText, { color: colors.bg }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

/** Wrapper that injects theme colors from useColors() hook. */
export function ScreenErrorBoundary({
  children,
  screenName,
}: {
  children: ReactNode;
  screenName?: string;
}) {
  const colors = useColors();
  return (
    <ErrorBoundaryInner colors={colors} screenName={screenName}>
      {children}
    </ErrorBoundaryInner>
  );
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
  },
  buttonText: {
    fontWeight: '600',
  },
});

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
