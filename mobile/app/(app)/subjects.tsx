import { useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@src/ui/Icon';
import { useThemeColors } from '@src/ui/useThemeColors';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { Chip } from '@src/ui/Chip';
import { useFormationStore } from '@src/stores/formation.store';
import { variantFor } from '@src/ui/formation-visual';
import type { Formation } from '@src/schemas/formation.schema';

export default function FormationsScreen() {
  const router = useRouter();
  const items = useFormationStore((s) => s.items);
  const status = useFormationStore((s) => s.status);
  const error = useFormationStore((s) => s.error);
  const load = useFormationStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  const formations = items.map((formation) => ({
    formation,
    variant: variantFor(formation.id),
  }));

  const palette = useThemeColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-4 py-8">
          {/* Header */}
          <Text className="mb-3 font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
            Catalogue
          </Text>
          <Text className="font-headline text-3xl font-extrabold leading-tight tracking-tight text-on-surface">
            Votre trajectoire
          </Text>
          <Text className="font-headline text-3xl font-extrabold leading-tight tracking-tight text-primary">
            d'apprentissage
          </Text>
          <Text className="mt-4 text-base leading-relaxed text-on-surface-variant">
            Parcours complet à travers le développement, le design, la gestion de projet et la
            communication.
          </Text>

          <View className="mt-8">
            {status === 'loading' ? (
              <LoadingView />
            ) : error ? (
              <ErrorCard message={error} />
            ) : formations.length === 0 ? (
              <EmptyState
                icon="archive-outline"
                title="Aucune matière disponible"
                description="Revenez plus tard, le catalogue sera bientôt en ligne."
              />
            ) : (
              <View className="gap-5">
                {formations.map(({ formation, variant }) => (
                  <FormationCard
                    key={formation.id}
                    formation={formation}
                    color={variant.color}
                    label={variant.label}
                    iconName={variant.icon}
                    onOpen={() =>
                      router.push({
                        pathname: '/formations/[id]',
                        params: { id: String(formation.id) },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type CardProps = {
  formation: Formation;
  color: string;
  label: string;
  iconName: Parameters<typeof Icon>[0]['name'];
  onOpen: () => void;
};

function FormationCard({ formation, color, label, iconName, onOpen }: CardProps) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      className="overflow-hidden squircle-xl bg-surface-container ghost-border"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      {/* Visual tile */}
      <View
        className="h-36 items-center justify-center bg-surface-container-high"
        style={{ backgroundColor: `${color}26` }}
      >
        <Icon name={iconName} size={56} color={color} />
      </View>

      {/* Body */}
      <View className="flex-1 gap-4 p-5">
        <View className="flex-row items-start justify-between gap-3">
          <Text className="flex-1 font-headline text-lg font-bold text-on-surface">
            {formation.name}
          </Text>
          <Chip label={label} color={color} />
        </View>

        <Text className="text-sm text-on-surface-variant" numberOfLines={2}>
          {formation.description || 'Sans description.'}
        </Text>

        {formation.expectedHours ? (
          <View className="flex-row items-center gap-1.5">
            <Icon name="time-outline" size={14} color="#a1a1aa" />
            <Text className="text-xs text-on-surface-variant">
              {formation.expectedHours}h de cours
            </Text>
          </View>
        ) : null}

        <View className="flex-row items-center gap-1 self-start">
          <Text
            className="font-headline text-xs font-bold uppercase tracking-widest"
            style={{ color }}
          >
            Voir le détail
          </Text>
          <Icon name="arrow-forward" size={12} color={color} />
        </View>
      </View>
    </Pressable>
  );
}
