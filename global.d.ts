declare module '*.css';

// @sentry/react-native is an optional dependency for native crash reporting.
// This ambient declaration allows typecheck to pass before the package is installed.
declare module '@sentry/react-native' {
  export interface SentryInitOptions {
    dsn: string;
    enableInExpoDevelopment?: boolean;
    debug?: boolean;
    tracesSampleRate?: number;
  }
  export function init(options: SentryInitOptions): void;
  export function captureException(error: unknown): void;
  export function captureMessage(message: string): void;
}

// heroui-native ships without TypeScript declarations; the Switch component is used as a
// controlled toggle across the app. This ambient declaration keeps the type checker happy.
declare module 'heroui-native' {
  import type { ComponentType, ReactNode } from 'react';
  type HeroSwitchProps = {
    isSelected?: boolean;
    onSelectedChange?: (value: boolean) => void;
  };
  type HeroUINativeConfig = {
    devInfo?: { stylingPrinciples?: boolean };
  };
  export const Switch: ComponentType<HeroSwitchProps>;
  export const HeroUINativeProvider: ComponentType<{
    children: ReactNode;
    config?: HeroUINativeConfig;
  }>;
}

