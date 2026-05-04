import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

import { Icon } from '@src/ui/Icon';

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b0c' }}>
      <View
        accessibilityRole="alert"
        className="flex-1 items-center justify-center px-6 py-12"
      >
        <View className="mb-8 size-24 items-center justify-center rounded-full bg-surface-container ghost-border">
          <Icon name="rocket-outline" size={40} color="#7bd0ff" />
        </View>

        <Text className="mb-3 font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
          Erreur 404
        </Text>
        <Text className="font-headline text-5xl font-extrabold tracking-tight text-on-surface text-center">
          Page introuvable
        </Text>
        <Text className="mt-5 max-w-md text-lg text-on-surface-variant text-center">
          Cette page est en dehors de la trajectoire. Revenez au tableau de bord pour reprendre
          votre apprentissage.
        </Text>

        <View className="mt-8 flex-row flex-wrap justify-center gap-3">
          <Link href="/dashboard" asChild>
            <Pressable className="flex-row items-center gap-2 squircle-lg bg-primary px-5 py-2.5">
              <Icon name="home" size={16} color="#041c27" />
              <Text className="font-headline text-sm font-bold text-on-primary">
                Tableau de bord
              </Text>
            </Pressable>
          </Link>
          <Link href="/subjects" asChild>
            <Pressable className="flex-row items-center gap-2 squircle-lg px-5 py-2.5 ghost-border">
              <Text className="font-headline text-sm font-bold text-on-surface">
                Explorer les matières
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
