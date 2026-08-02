declare module '*.css';

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

