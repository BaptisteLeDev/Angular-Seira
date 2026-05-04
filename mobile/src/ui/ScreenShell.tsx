import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { BackHeader } from './BackHeader';

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  back?: boolean;
  backFallback?: string;
  children: ReactNode;
};

export function ScreenShell({
  eyebrow,
  title,
  subtitle,
  back = false,
  backFallback,
  children,
}: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b0c' }} edges={['top']}>
      {back ? <BackHeader fallbackHref={backFallback} /> : null}
      <ScrollView
        style={{ backgroundColor: '#0b0b0c' }}
        contentContainerStyle={{ paddingBottom: 40, backgroundColor: '#0b0b0c' }}
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
