import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

import { Icon } from '@src/ui/Icon';
import { useThemeColors } from '@src/ui/useThemeColors';
import { useAuthStore } from '@src/stores/auth.store';

export function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const palette = useThemeColors();
  const welcomeName = user?.name ?? '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 py-8">
          <Text className="mb-3 font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
            Tableau de bord
          </Text>
          <Text className="font-headline text-4xl font-extrabold leading-tight tracking-tight text-on-surface">
            Bonjour {welcomeName},
          </Text>
          <Text className="font-headline text-4xl font-extrabold leading-tight tracking-tight text-primary">
            prêt à apprendre ?
          </Text>
          <Text className="mt-5 text-base leading-relaxed text-on-surface-variant">
            Bienvenue sur MontoMaster. Reprenez votre parcours là où vous l&apos;aviez laissé ou
            explorez les ressources disponibles.
          </Text>

          <Text className="mb-5 mt-10 font-headline text-2xl font-bold text-on-surface">
            Accès rapide
          </Text>
          <Link href="/subjects" asChild>
            <Pressable className="squircle-xl bg-surface-container p-6 ghost-border">
              <View className="mb-4 size-11 items-center justify-center squircle-lg bg-primary/10">
                <Icon name="book-outline" size={22} color="#7bd0ff" />
              </View>
              <Text className="mb-2 font-headline text-lg font-bold text-on-surface">
                Parcourir les matières
              </Text>
              <Text className="text-sm text-on-surface-variant">
                Explorez les modules disponibles dans votre parcours.
              </Text>
              <View className="mt-4 flex-row items-center gap-1">
                <Text className="font-headline text-xs font-bold uppercase tracking-widest text-primary">
                  Explorer
                </Text>
                <Icon name="arrow-forward" size={12} color="#7bd0ff" />
              </View>
            </Pressable>
          </Link>

          <View className="mt-3 flex-row gap-3">
            <Link href="/classes" asChild>
              <Pressable className="flex-1 squircle-xl bg-surface-container p-5 ghost-border">
                <View className="mb-3 size-10 items-center justify-center squircle-lg bg-primary/10">
                  <Icon name="school-outline" size={20} color="#7bd0ff" />
                </View>
                <Text className="font-headline text-base font-bold text-on-surface">
                  Ma classe
                </Text>
                <Text className="mt-1 text-xs text-on-surface-variant">
                  Vos matières rattachées.
                </Text>
              </Pressable>
            </Link>
            <Link href="/progress" asChild>
              <Pressable className="flex-1 squircle-xl bg-surface-container p-5 ghost-border">
                <View className="mb-3 size-10 items-center justify-center squircle-lg bg-primary/10">
                  <Icon name="bar-chart-outline" size={20} color="#7bd0ff" />
                </View>
                <Text className="font-headline text-base font-bold text-on-surface">
                  Ma progression
                </Text>
                <Text className="mt-1 text-xs text-on-surface-variant">
                  Temps, % et statut.
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
