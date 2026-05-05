import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@src/stores/auth.store';
import { useThemeColors } from '@src/ui/useThemeColors';

export function TeacherDashboard() {
  const palette = useThemeColors();
  const name = useAuthStore((s) => s.user?.name ?? '');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ backgroundColor: palette.background }}
      >
        <View className="px-6 py-8">
          <Text className="mb-3 font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
            Tableau · Professeur
          </Text>
          <Text className="font-headline text-3xl font-extrabold text-on-surface">
            Bonjour {name}
          </Text>
          <Text className="mt-3 text-base text-on-surface-variant">
            Vos classes et la recherche d&apos;élèves arriveront bientôt ici.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
