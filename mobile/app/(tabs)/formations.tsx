import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@src/ui/Icon';
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

  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const formations = items.map((formation) => ({
    formation,
    variant: variantFor(formation.id),
  }));

  const selected = selectedId !== null
    ? formations.find((v) => v.formation.id === selectedId) ?? null
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b0c' }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: '#0b0b0c' }}
        contentContainerStyle={{ paddingBottom: 40, backgroundColor: '#0b0b0c' }}
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
                {formations.map(({ formation, variant }) => {
                  const isSelected = selectedId === formation.id;
                  return (
                    <FormationCard
                      key={formation.id}
                      formation={formation}
                      color={variant.color}
                      label={variant.label}
                      iconName={variant.icon}
                      isSelected={isSelected}
                      onToggle={() =>
                        setSelectedId((curr) => (curr === formation.id ? null : formation.id))
                      }
                      onOpen={() =>
                        router.push({
                          pathname: '/formations/[id]',
                          params: { id: String(formation.id) },
                        })
                      }
                    />
                  );
                })}
              </View>
            )}

            {selected ? (
              <View
                accessibilityLiveRegion="polite"
                className="mt-6 flex-row items-center gap-3 squircle-xl bg-surface-container-low px-5 py-4 ghost-border"
              >
                <Icon name="checkmark-circle" size={22} color={selected.variant.color} />
                <Text className="flex-1 text-sm text-on-surface">
                  <Text className="font-headline font-bold">{selected.formation.name}</Text>
                  <Text className="text-on-surface-variant">
                    {' '}sélectionné — tapez à nouveau pour désélectionner.
                  </Text>
                </Text>
              </View>
            ) : null}
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
  isSelected: boolean;
  onToggle: () => void;
  onOpen: () => void;
};

function FormationCard({
  formation,
  color,
  label,
  iconName,
  isSelected,
  onToggle,
  onOpen,
}: CardProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className="overflow-hidden squircle-xl bg-surface-container ghost-border"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: color,
        ...(isSelected && { borderWidth: 2, borderColor: color }),
      }}
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

        <Pressable
          onPress={onOpen}
          className="flex-row items-center gap-1 self-start"
          accessibilityRole="link"
        >
          <Text
            className="font-headline text-xs font-bold uppercase tracking-widest"
            style={{ color }}
          >
            Voir le détail
          </Text>
          <Icon name="arrow-forward" size={12} color={color} />
        </Pressable>
      </View>
    </Pressable>
  );
}
