import '../src/global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';

import { useAuthStore } from '@src/stores/auth.store';

void SystemUI.setBackgroundColorAsync('#0b0b0c');

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0b0b0c' },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="formations/[id]/index" />
        <Stack.Screen name="formations/[id]/[articleId]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
