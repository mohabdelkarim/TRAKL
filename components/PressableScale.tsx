import { type ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { haptics } from '@/src/shared/haptics';

/**
 * Distinct-but-coherent press feedback treatments. Each surface type gets the
 * feedback that fits it: chunky buttons dip firmly, cards settle softly, chips
 * pop quickly, tab/icon taps give a light bounce.
 */
export type PressFeedback = 'button' | 'card' | 'chip' | 'tab' | 'icon';

type FeedbackSpec = {
  /** Scale while pressed. */
  scale: number;
  /** Opacity while pressed. */
  opacity: number;
};

const SPECS: Record<PressFeedback, FeedbackSpec> = {
  // Solid CTA: a firm, confident dip.
  button: { scale: 0.96, opacity: 0.96 },
  // Large surface: gentle, slow settle so big areas don't feel jumpy.
  card: { scale: 0.975, opacity: 0.94 },
  // Pill filter: quick, snappy pop.
  chip: { scale: 0.92, opacity: 0.9 },
  // Bottom-nav item: subtle, restrained.
  tab: { scale: 0.9, opacity: 1 },
  // Standalone icon / FAB: lively bounce.
  icon: { scale: 0.88, opacity: 1 },
};

/** The haptic each feedback variant fires on press-in (web/Expo-safe no-op). */
const HAPTIC: Record<PressFeedback, () => void> = {
  button: haptics.tapMedium,
  card: haptics.selection,
  chip: haptics.tapLight,
  tab: haptics.selection,
  icon: haptics.tapLight,
};

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  children?: ReactNode;
  feedback?: PressFeedback;
  /** Set false to suppress the haptic for this element (motion only). */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Cross-platform Pressable with reliable native touch handling and a small
 * pressed-state scale/opacity treatment. Pick the `feedback` variant that
 * matches the element.
 */
export function PressableScale({
  children,
  feedback = 'button',
  haptic = true,
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const spec = SPECS[feedback];

  const handlePressIn: NonNullable<PressableProps['onPressIn']> = (event) => {
    if (!disabled && haptic) HAPTIC[feedback]();
    onPressIn?.(event);
  };

  const handlePressOut: NonNullable<PressableProps['onPressOut']> = (event) => {
    onPressOut?.(event);
  };

  const pressStyle = (state: PressableStateCallbackType): StyleProp<ViewStyle> => [
    style,
    state.pressed && {
      transform: [{ scale: spec.scale }],
      opacity: spec.opacity,
    },
  ];

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={pressStyle}
    >
      {children}
    </Pressable>
  );
}
