import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@src/stores/auth.store';
import { useThemeStore, type ThemePreference } from '@src/stores/theme.store';
import type { UserRole } from '@src/schemas/user.schema';
import { HapticPressable } from '@src/ui/HapticPressable';
import { Icon } from '@src/ui/Icon';
import { SectionHeader } from '@src/ui/SectionHeader';
import { ThemedSurface } from '@src/ui/ThemedSurface';
import { useThemeColors } from '@src/ui/useThemeColors';

function roleLabel(role: UserRole | undefined): string {
  if (role === 'admin') return 'Administrateur';
  if (role === 'teacher') return 'Enseignant';
  if (role === 'student') return 'Étudiant';
  return '—';
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Clair', icon: 'sunny-outline' },
  { value: 'system', label: 'Système', icon: 'phone-portrait-outline' },
  { value: 'dark', label: 'Sombre', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const palette = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  async function onLogout() {
    await logout();
    router.replace('/home');
  }

  const displayName = user?.name?.trim() || user?.email || 'Utilisateur';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 py-8">
          <SectionHeader
            eyebrow="Paramètres"
            title="Mon compte"
            subtitle="Gère ton profil, ton apparence et ta session."
          />

          <ThemedSurface variant="card" radius="xl" className="mt-2 p-5">
            <View className="flex-row items-center gap-4">
              <View
                className="size-14 items-center justify-center rounded-full"
                style={{ backgroundColor: palette.primaryTintMid }}
              >
                <Icon name="person-circle-outline" size={36} color={palette.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-headline text-lg font-bold text-on-surface">
                  {displayName}
                </Text>
                <Text className="text-sm text-on-surface-variant">{user?.email}</Text>
              </View>
              <ThemedSurface
                variant="flat"
                radius="lg"
                className="px-3 py-1.5"
                style={{ backgroundColor: palette.primaryTint }}
              >
                <Text className="font-headline text-xs font-bold uppercase tracking-widest text-primary">
                  {roleLabel(user?.role)}
                </Text>
              </ThemedSurface>
            </View>
          </ThemedSurface>

          <View className="mt-10">
            <SectionHeader
              eyebrow="Apparence"
              title="Thème"
              subtitle="Choisis un mode clair, sombre, ou suis le réglage du système."
            />
            <ThemedSurface variant="card" radius="xl" className="flex-row gap-1 p-1">
              {THEME_OPTIONS.map((opt) => {
                const active = preference === opt.value;
                return (
                  <HapticPressable
                    key={opt.value}
                    haptic="selection"
                    onPress={() => void setPreference(opt.value)}
                    className="flex-1 items-center justify-center gap-1.5 squircle-lg py-3"
                    style={{
                      backgroundColor: active ? palette.primary : 'transparent',
                    }}
                  >
                    <Icon
                      name={opt.icon as never}
                      size={20}
                      color={active ? palette.onPrimary : palette.onSurfaceVariant}
                    />
                    <Text
                      className="font-headline text-xs font-bold uppercase tracking-wider"
                      style={{ color: active ? palette.onPrimary : palette.onSurfaceVariant }}
                    >
                      {opt.label}
                    </Text>
                  </HapticPressable>
                );
              })}
            </ThemedSurface>
          </View>

          <View className="mt-10">
            <SectionHeader eyebrow="Session" title="Déconnexion" />
            <HapticPressable haptic="medium" onPress={onLogout}>
              <ThemedSurface
                variant="card"
                radius="xl"
                className="flex-row items-center gap-3 p-4"
              >
                <View
                  className="size-10 items-center justify-center squircle-lg"
                  style={{ backgroundColor: palette.errorContainer }}
                >
                  <Icon name="log-out-outline" size={20} color={palette.error} />
                </View>
                <Text className="flex-1 font-headline text-base font-bold text-error">
                  Se déconnecter
                </Text>
                <Icon name="chevron-forward" size={20} color={palette.onSurfaceVariant} />
              </ThemedSurface>
            </HapticPressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
