import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@src/stores/auth.store';
import type { UserRole } from '@src/schemas/user.schema';
import { Icon } from '@src/ui/Icon';

function roleLabel(role: UserRole | undefined): string {
  if (role === 'admin') return 'Administrateur';
  if (role === 'teacher') return 'Enseignant';
  if (role === 'student') return 'Étudiant';
  return '—';
}

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function onLogout() {
    await logout();
    router.replace('/home');
  }

  const displayName = user?.name?.trim() || user?.email || 'Utilisateur';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b0c' }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: '#0b0b0c' }}
        contentContainerStyle={{ paddingBottom: 40, backgroundColor: '#0b0b0c' }}
      >
        <View className="px-6 py-8">
          <Text className="mb-3 font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
            Paramètres
          </Text>
          <Text className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Mon compte
          </Text>

          <View className="mt-6 squircle-xl bg-surface-container p-5 ghost-border">
            <View className="flex-row items-center gap-4">
              <View className="size-14 items-center justify-center rounded-full bg-primary/15">
                <Icon name="person-circle-outline" size={36} color="#7bd0ff" />
              </View>
              <View className="flex-1">
                <Text className="font-headline text-lg font-bold text-on-surface">
                  {displayName}
                </Text>
                <Text className="text-sm text-on-surface-variant">{user?.email}</Text>
              </View>
              <View className="squircle-lg bg-primary/10 px-3 py-1.5">
                <Text className="font-headline text-xs font-bold uppercase tracking-widest text-primary">
                  {roleLabel(user?.role)}
                </Text>
              </View>
            </View>
          </View>

          <Text className="mb-3 mt-10 font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
            Session
          </Text>
          <Pressable
            onPress={onLogout}
            className="flex-row items-center gap-3 squircle-xl bg-surface-container p-4 ghost-border"
          >
            <View className="size-10 items-center justify-center squircle-lg bg-error/10">
              <Icon name="log-out-outline" size={20} color="#f87171" />
            </View>
            <Text className="flex-1 font-headline text-base font-bold text-error">
              Se déconnecter
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
