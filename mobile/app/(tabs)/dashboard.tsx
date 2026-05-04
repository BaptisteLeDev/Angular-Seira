import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon, type IoniconName } from '@src/ui/Icon';
import { useAuthStore } from '@src/stores/auth.store';

type QuickAction = {
  label: string;
  description: string;
  icon: IoniconName;
  href: '/formations' | '/dashboard';
};

const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    label: 'Parcourir les matières',
    description: '3 modules actifs dans votre parcours.',
    icon: 'book-outline',
    href: '/formations',
  },
  {
    label: 'Mes objectifs',
    description: 'Suivez votre progression hebdomadaire.',
    icon: 'flag-outline',
    href: '/formations',
  },
  {
    label: 'Session mentor',
    description: 'Réservez un créneau avec un formateur.',
    icon: 'chatbubbles-outline',
    href: '/dashboard',
  },
];

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const welcomeName = user?.name ?? '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b0c' }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: '#0b0b0c' }}
        contentContainerStyle={{ paddingBottom: 40, backgroundColor: '#0b0b0c' }}
      >
        <View className="px-6 py-8">
          {/* Hero */}
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
            Bienvenue sur MontoMaster, votre plateforme e-learning. Reprenez votre parcours là
            où vous l'aviez laissé ou explorez une nouvelle matière.
          </Text>

          {/* Featured hero banner */}
          <View className="relative mt-10 overflow-hidden squircle-xl bg-surface-container p-6 ghost-border">
            <LinearGradient
              colors={['rgba(123,208,255,0.25)', 'rgba(14,58,77,0.15)', 'transparent']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: '35%' }}
            />
            <Text className="mb-3 font-headline text-xs font-bold uppercase tracking-widest text-primary">
              Recommandé pour vous
            </Text>
            <Text className="mb-4 font-headline text-2xl font-extrabold leading-tight text-on-surface">
              Maîtriser les architectures Angular modernes
            </Text>
            <Text className="mb-5 text-on-surface-variant">
              Composants standalone, signals, change detection fine — le nouveau socle pour
              construire des applications performantes.
            </Text>
            <Link href="/formations" asChild>
              <Pressable className="flex-row items-center gap-2 self-start squircle-lg bg-primary px-5 py-2.5">
                <Text className="font-headline text-sm font-bold text-on-primary">
                  Commencer le parcours
                </Text>
                <Icon name="arrow-forward" size={16} color="#041c27" />
              </Pressable>
            </Link>
          </View>

          {/* Quick actions */}
          <Text className="mb-5 mt-10 font-headline text-2xl font-bold text-on-surface">
            Accès rapide
          </Text>
          <View className="gap-5">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.label} href={action.href} asChild>
                <Pressable className="squircle-xl bg-surface-container p-6 ghost-border">
                  <View className="mb-4 size-11 items-center justify-center squircle-lg bg-primary/10">
                    <Icon name={action.icon} size={22} color="#7bd0ff" />
                  </View>
                  <Text className="mb-2 font-headline text-lg font-bold text-on-surface">
                    {action.label}
                  </Text>
                  <Text className="text-sm text-on-surface-variant">{action.description}</Text>
                  <View className="mt-4 flex-row items-center gap-1">
                    <Text className="font-headline text-xs font-bold uppercase tracking-widest text-primary">
                      Explorer
                    </Text>
                    <Icon name="arrow-forward" size={12} color="#7bd0ff" />
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
