import { useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { InfoSheet } from '@/components/InfoSheet';
import { SoftRatePromptSheet } from '@/components/SoftRatePromptSheet';
import { TabBar } from '@/components/TabBar';
import { useColors, useResolvedScheme } from '@/src/shared/theme';
import { useTrakl } from '@/src/application/store';
import { useAndroidExitConfirm } from '@/src/shared/useAndroidExitConfirm';

export default function TabLayout() {
  const router = useRouter();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const { t } = useTranslation();
  const hydrated = useTrakl((s) => s.hydrated);
  const onboarded = useTrakl((s) => s.onboarded);
  const rehydrateFailed = useTrakl((s) => s.rehydrateFailed);
  const { exitOpen, closeExit, confirmExit } = useAndroidExitConfirm();

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => (
      <View style={{ backgroundColor: colors.bg }}>
        <TabBar {...props} />
      </View>
    ),
    [colors.bg],
  );

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      sceneStyle: { backgroundColor: colors.bg },
    }),
    [colors.bg],
  );

  // First-launch gate: send users to onboarding until completed. Skip the
  // redirect when rehydration failed; the in-memory state is empty defaults
  // and bouncing into onboarding would overwrite the user's real saved data.
  useEffect(() => {
    if (hydrated && !onboarded && !rehydrateFailed) {
      router.replace('/onboarding');
    }
  }, [hydrated, onboarded, rehydrateFailed, router]);

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <>
      {/* expo-status-bar StatusBar takes a string for `style`, not an object — linter false positive */}
      {/* oxlint-disable-next-line react/style-prop-object */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        <Tabs tabBar={renderTabBar} screenOptions={screenOptions}>
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="trackers" options={{ title: 'Trackers' }} />
          <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
      </View>
      <InfoSheet
        visible={exitOpen}
        title={t('exit.title')}
        body={t('exit.body')}
        onClose={closeExit}
        actions={[
          { label: t('exit.stay'), variant: 'primary', onPress: closeExit },
          { label: t('exit.leave'), variant: 'plain', onPress: confirmExit },
        ]}
      />
      <SoftRatePromptSheet />
    </>
  );
}
