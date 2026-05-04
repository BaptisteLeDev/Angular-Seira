import '../src/global.css';

import { useEffect } from 'react';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';

import { useAuthStore } from '@src/stores/auth.store';
import { LoadingView } from '@src/ui/LoadingView';

void SystemUI.setBackgroundColorAsync('#0b0b0c');

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const segments = useSegments();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <SafeAreaProvider>
        <LoadingView />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  const root = segments[0];
  const inAppGroup = root === '(app)';
  const inPublicGroup = root === '(public)';

  if (!token && inAppGroup) {
    return <Redirect href="/home" />;
  }
  if (token && inPublicGroup) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0b0b0c' },
        }}
      >
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="formations/[id]/index" />
        <Stack.Screen name="formations/[id]/[articleId]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
