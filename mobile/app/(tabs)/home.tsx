import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@src/stores/auth.store';
import { Icon, type IoniconName } from '@src/ui/Icon';
import { FORMATION_VARIANTS } from '@src/ui/formation-visual';

type Stat = {
  value: string;
  label: string;
  icon: IoniconName;
};

const STATS: readonly Stat[] = [
  { value: '24+', label: 'Matières actives', icon: 'book' },
  { value: '180h', label: 'Contenu vidéo', icon: 'play-circle' },
  { value: '12', label: 'Mentors experts', icon: 'people' },
  { value: '2.4k', label: 'Apprenants', icon: 'school' },
];

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.token !== null);
  const logout = useAuthStore((s) => s.logout);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const categories = Object.values(FORMATION_VARIANTS);

  const userDisplayName = (() => {
    if (!user) return 'Utilisateur';
    const n = user.name.trim();
    return n.length > 0 ? n : user.email;
  })();

  async function onLogout() {
    setUserMenuOpen(false);
    await logout();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b0c' }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: '#0b0b0c' }}
        contentContainerStyle={{ paddingBottom: 40, backgroundColor: '#0b0b0c' }}
      >
        <View className="px-4 py-6">
          {/* Nav bar */}
          <View className="flex-row items-center justify-between squircle-xl bg-surface-container px-4 py-3 ghost-border">
            <Text className="font-headline text-lg font-extrabold tracking-tight text-on-surface">
              MontoMaster
            </Text>
            {!isAuthenticated ? (
              <Link href="/login" asChild>
                <Pressable
                  accessibilityRole="link"
                  className="flex-row items-center gap-2 squircle-lg bg-primary px-3.5 py-2"
                >
                  <Icon name="log-in-outline" size={16} color="#041c27" />
                  <Text className="font-headline text-sm font-bold text-on-primary">Login</Text>
                </Pressable>
              </Link>
            ) : (
              <View className="relative">
                <Pressable
                  onPress={() => setUserMenuOpen((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel="Menu utilisateur"
                  className="size-10 items-center justify-center rounded-full bg-surface-container-high ghost-border"
                >
                  <Icon name="person-circle-outline" size={24} color="#fafafa" />
                </Pressable>

                {userMenuOpen ? (
                  <View className="absolute right-0 top-12 z-30 w-56 squircle-xl bg-surface-container p-2 ghost-border">
                    <View className="border-b border-outline-variant px-3 py-2">
                      <Text className="font-headline text-sm font-bold text-on-surface">
                        {userDisplayName}
                      </Text>
                      <Text className="mt-0.5 text-xs text-on-surface-variant">
                        {user?.email}
                      </Text>
                    </View>
                    <Link href="/dashboard" asChild>
                      <Pressable
                        onPress={() => setUserMenuOpen(false)}
                        className="mt-2 flex-row items-center gap-2 squircle-lg px-3 py-2"
                      >
                        <Icon name="grid-outline" size={16} color="#fafafa" />
                        <Text className="text-sm font-medium text-on-surface">Dashboard</Text>
                      </Pressable>
                    </Link>
                    <Pressable
                      onPress={onLogout}
                      className="mt-1 flex-row items-center gap-2 squircle-lg px-3 py-2"
                    >
                      <Icon name="log-out-outline" size={16} color="#f87171" />
                      <Text className="text-sm font-medium text-error">Se déconnecter</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* Hero */}
          <View className="mt-8">
            <Text className="font-headline text-4xl font-extrabold leading-[46px] tracking-tight text-on-surface">
              Apprenez à construire
            </Text>
            <Text className="font-headline text-4xl font-extrabold leading-[46px] tracking-tight text-primary">
              des produits qui durent.
            </Text>

            <Text className="mt-5 text-base leading-relaxed text-on-surface-variant">
              Développement, design, gestion de projet, communication — une plateforme
              d'apprentissage intégrée pour construire des compétences complètes.
            </Text>

            <View className="mt-7 flex-row flex-wrap gap-3">
              <Link href="/dashboard" asChild>
                <Pressable className="flex-row items-center gap-2 squircle-lg bg-primary px-5 py-3">
                  <Text className="font-headline text-sm font-bold text-on-primary">
                    Explorer la plateforme
                  </Text>
                  <Icon name="arrow-forward" size={16} color="#041c27" />
                </Pressable>
              </Link>
              {isAuthenticated ? (
                <Link href="/dashboard" asChild>
                  <Pressable className="flex-row items-center gap-2 squircle-lg px-5 py-3 ghost-border">
                    <Icon name="grid-outline" size={16} color="#fafafa" />
                    <Text className="font-headline text-sm font-bold text-on-surface">
                      Mon dashboard
                    </Text>
                  </Pressable>
                </Link>
              ) : (
                <Link href="/login" asChild>
                  <Pressable className="flex-row items-center gap-2 squircle-lg px-5 py-3 ghost-border">
                    <Icon name="log-in-outline" size={16} color="#fafafa" />
                    <Text className="font-headline text-sm font-bold text-on-surface">
                      Se connecter
                    </Text>
                  </Pressable>
                </Link>
              )}
            </View>
          </View>

          {/* Stats strip */}
          <View className="mt-12 flex-row flex-wrap gap-3">
            {STATS.map((stat) => (
              <View
                key={stat.label}
                className="min-w-[47%] flex-1 flex-row items-center gap-3 squircle-xl bg-surface-container p-4 ghost-border"
              >
                <View className="size-10 items-center justify-center squircle-lg bg-primary/10">
                  <Icon name={stat.icon} size={20} color="#7bd0ff" />
                </View>
                <View className="flex-1">
                  <Text className="font-headline text-xl font-extrabold text-on-surface">
                    {stat.value}
                  </Text>
                  <Text className="mt-1 font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {stat.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Categories */}
          <View className="mt-14">
            <Text className="mb-2 font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
              Ce que vous apprendrez
            </Text>
            <View className="mb-6 flex-row items-end justify-between">
              <Text className="flex-1 font-headline text-2xl font-bold text-on-surface">
                Six catégories, une trajectoire
              </Text>
              <Link href="/formations" asChild>
                <Pressable className="flex-row items-center gap-1">
                  <Text className="font-headline text-sm font-medium text-primary">
                    Voir tout
                  </Text>
                  <Icon name="arrow-forward" size={14} color="#7bd0ff" />
                </Pressable>
              </Link>
            </View>

            <View className="gap-4">
              {categories.map((cat) => (
                <Link key={cat.id} href="/formations" asChild>
                  <Pressable
                    className="flex-row items-start gap-4 squircle-xl bg-surface-container p-5 ghost-border"
                    style={{ borderLeftWidth: 4, borderLeftColor: cat.color }}
                  >
                    <View
                      className="size-11 items-center justify-center squircle-lg"
                      style={{ backgroundColor: `${cat.color}1a` }}
                    >
                      <Icon name={cat.icon} size={22} color={cat.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-headline text-base font-bold text-on-surface">
                        {cat.label}
                      </Text>
                      <Text className="mt-1 text-sm text-on-surface-variant">
                        Parcourez les matières liées au pôle {cat.label.toLowerCase()}.
                      </Text>
                    </View>
                    <Icon name="arrow-forward" size={20} color="#a1a1aa" />
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>

          {/* Final CTA */}
          <View className="relative mt-14 overflow-hidden squircle-xl bg-surface-container p-6 ghost-border">
            <LinearGradient
              colors={['rgba(123,208,255,0.18)', 'transparent']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: '50%' }}
            />
            <Text className="font-headline text-2xl font-extrabold text-on-surface">
              Prêt à commencer votre parcours ?
            </Text>
            <Text className="mt-3 text-on-surface-variant">
              Accédez immédiatement au tableau de bord et reprenez votre apprentissage là où
              il vous attend.
            </Text>
            <Link href="/dashboard" asChild>
              <Pressable className="mt-6 flex-row items-center justify-center gap-2 self-start squircle-lg bg-primary px-6 py-3">
                <Text className="font-headline text-sm font-bold text-on-primary">
                  Ouvrir le tableau de bord
                </Text>
                <Icon name="arrow-forward" size={16} color="#041c27" />
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
