import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Alert } from 'react-native';
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
  const palette = useThemeColors();

  const available = useFormationStore((s) => s.available);
  const locked = useFormationStore((s) => s.locked);
  const status = useFormationStore((s) => s.status);
  const error = useFormationStore((s) => s.error);
  const loadMine = useFormationStore((s) => s.loadMine);

  const [accessRequest, setAccessRequest] = useState<Formation | null>(null);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  const requestAccess = (formation: Formation) => {
    setAccessRequest(null);
    Alert.alert(
      'Demande envoyée',
      `Votre demande d'accès à « ${formation.name} » a été transmise à votre établissement.`,
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-4 py-8">
          <Text className="mb-3 font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
            Catalogue
          </Text>
          <Text className="font-headline text-3xl font-extrabold leading-tight tracking-tight text-on-surface">
            Votre trajectoire
          </Text>
          <Text className="font-headline text-3xl font-extrabold leading-tight tracking-tight text-primary">
            d&apos;apprentissage
          </Text>

          <View className="mt-8">
            {status === 'loading' && items.length === 0 ? (
              <LoadingView />
            ) : error ? (
              <ErrorCard message={error} />
            ) : available.length === 0 && locked.length === 0 ? (
              <EmptyState
                icon="archive-outline"
                title="Aucune matière disponible"
                description="Revenez plus tard, le catalogue sera bientôt en ligne."
              />
            ) : (
              <View className="gap-8">
                {available.length > 0 ? (
                  <Section title="Disponibles">
                    {available.map((formation) => (
                      <FormationCard
                        key={formation.id}
                        formation={formation}
                        onPress={() =>
                          router.push({
                            pathname: '/formations/[id]',
                            params: { id: String(formation.id) },
                          })
                        }
                      />
                    ))}
                  </Section>
                ) : null}
                {locked.length > 0 ? (
                  <Section title="Hors de votre parcours">
                    {locked.map((formation) => (
                      <FormationCard
                        key={formation.id}
                        formation={formation}
                        locked
                        onPress={() => setAccessRequest(formation)}
                      />
                    ))}
                  </Section>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <RequestAccessModal
        formation={accessRequest}
        onCancel={() => setAccessRequest(null)}
        onConfirm={requestAccess}
      />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="mb-4 font-headline text-xs font-bold uppercase tracking-[3px] text-on-surface-variant">
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}

type CardProps = {
  formation: Formation;
  locked?: boolean;
  onPress: () => void;
};

function FormationCard({ formation, locked, onPress }: CardProps) {
  const variant = variantFor(formation.id);
  const color = locked ? '#6b7280' : variant.color;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: color,
        opacity: locked ? 0.6 : 1,
      }}
    >
      <View
        className="size-12 items-center justify-center squircle-lg"
        style={{ backgroundColor: `${color}26` }}
      >
        <Icon name={locked ? 'lock-closed-outline' : variant.icon} size={22} color={color} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="flex-1 font-headline text-base font-bold text-on-surface"
            numberOfLines={1}
          >
            {formation.name}
          </Text>
          <Chip label={locked ? 'Verrouillé' : variant.label} color={color} />
        </View>
        {formation.description ? (
          <Text className="mt-1 text-xs text-on-surface-variant" numberOfLines={1}>
            {formation.description}
          </Text>
        ) : null}
      </View>
      <Icon
        name={locked ? 'lock-closed-outline' : 'chevron-forward'}
        size={16}
        color={color}
      />
    </Pressable>
  );
}

function RequestAccessModal({
  formation,
  onCancel,
  onConfirm,
}: {
  formation: Formation | null;
  onCancel: () => void;
  onConfirm: (f: Formation) => void;
}) {
  const palette = useThemeColors();
  const visible = formation != null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="w-full squircle-2xl p-6 ghost-border"
          style={{ backgroundColor: palette.surfaceContainer }}
        >
          <View className="mb-4 size-12 items-center justify-center squircle-lg bg-primary/10">
            <Icon name="lock-closed-outline" size={24} color="#7bd0ff" />
          </View>
          <Text className="mb-2 font-headline text-xl font-extrabold text-on-surface">
            Cours hors de votre parcours
          </Text>
          <Text className="mb-6 text-sm leading-relaxed text-on-surface-variant">
            « {formation?.name} » n&apos;est pas accessible à votre classe.
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 items-center squircle-lg bg-surface-container-low px-4 py-3 ghost-border"
            >
              <Text className="font-headline text-sm font-bold text-on-surface">Annuler</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
