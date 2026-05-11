import '../src/global.css';

import { useEffect } from 'react';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useAuthStore } from '@src/stores/auth.store';
import { useThemeStore } from '@src/stores/theme.store';
import { LoadingView } from '@src/ui/LoadingView';
import { ThemeFadeOverlay } from '@src/ui/ThemeFadeOverlay';
import { ThemeProvider } from '@src/ui/ThemeProvider';
import { useThemeColors } from '@src/ui/useThemeColors';

function RootStack() {
  const palette = useThemeColors();
  const effective = useThemeStore((s) => s.effective);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="formations/[id]/index" />
        <Stack.Screen name="formations/[id]/[articleId]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={effective === 'light' ? 'dark' : 'light'} />
    </>
  );
}

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydratedAuth = useAuthStore((s) => s.hydrated);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydratedTheme = useThemeStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const segments = useSegments();

  useEffect(() => {
    void hydrateAuth();
    void hydrateTheme();
  }, [hydrateAuth, hydrateTheme]);

  if (!hydratedAuth || !hydratedTheme) {
    return (
      <SafeAreaProvider>
        <ThemeProvider>
          <LoadingView />
        </ThemeProvider>
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
      <ThemeProvider>
        <RootStack />
        <ThemeFadeOverlay />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
