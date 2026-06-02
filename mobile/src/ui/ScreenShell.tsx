import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { BackHeader } from './BackHeader';
import { useThemeColors } from './useThemeColors';

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  back?: boolean;
  children: ReactNode;
};

export function ScreenShell({ eyebrow, title, subtitle, back = false, children }: Props) {
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
      {back ? <BackHeader /> : null}
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        <View className="px-4 py-6">
          <Text className="mb-3 font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
            {eyebrow}
          </Text>
          <Text className="font-headline text-3xl font-extrabold leading-tight tracking-tight text-on-surface">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-3 text-base leading-relaxed text-on-surface-variant">
              {subtitle}
            </Text>
          ) : null}
          <View className="mt-8">{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
