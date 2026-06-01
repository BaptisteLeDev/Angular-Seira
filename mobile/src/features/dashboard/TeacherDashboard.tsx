import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, type Href } from 'expo-router';

import { Icon, type IoniconName } from '@src/ui/Icon';
import { useAuthStore } from '@src/stores/auth.store';
import { useThemeColors } from '@src/ui/useThemeColors';

type Quick = { label: string; description: string; icon: IoniconName; href: Href };

const QUICK: readonly Quick[] = [
  {
    label: 'Mes classes',
    description: 'Classes que vous encadrez et matières liées.',
    icon: 'people-circle-outline',
    href: '/teacher/classes',
  },
  {
    label: 'Mes élèves',
    description: 'Liste complète, recherche par nom ou email.',
    icon: 'people-outline',
    href: '/teacher/students',
  },
  {
    label: 'Mes matières',
    description: 'Formations dont vous êtes responsable.',
    icon: 'book-outline',
    href: '/subjects',
  },
];

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

          <Text className="mb-4 mt-10 font-headline text-2xl font-bold text-on-surface">
            Accès rapide
          </Text>
          <View className="gap-4">
            {QUICK.map((q) => (
              <Link key={q.label} href={q.href} asChild>
                <Pressable className="flex-row items-center gap-4 squircle-xl bg-surface-container p-5 ghost-border">
                  <View className="size-11 items-center justify-center squircle-lg bg-primary/10">
                    <Icon name={q.icon} size={22} color="#7bd0ff" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-headline text-base font-bold text-on-surface">
                      {q.label}
                    </Text>
                    <Text className="text-sm text-on-surface-variant">{q.description}</Text>
                  </View>
                  <Icon name="chevron-forward" size={18} color="#a1a1aa" />
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
