import { Stack } from 'expo-router';
import { ScreenErrorBoundary } from '@/components/ScreenErrorBoundary';
import { useColors } from '@/src/shared/theme';

export default function TrackerLayout() {
  const colors = useColors();
  return (
    <ScreenErrorBoundary screenName="tracker">
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="finance" />
        <Stack.Screen name="habits" />
        <Stack.Screen name="tasks" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="planner" />
        <Stack.Screen name="sleep" />
        <Stack.Screen name="fitness" />
        <Stack.Screen name="mood" />
        <Stack.Screen name="water" />
        <Stack.Screen name="weight" />
        <Stack.Screen name="meditation" />
        <Stack.Screen name="custom" />
        <Stack.Screen name="custom/[id]" />
      </Stack>
    </ScreenErrorBoundary>
  );
}
