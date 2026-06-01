import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@src/constants/theme';
import type { Article } from '@src/schemas/article.schema';
import type { Chapitre } from '@src/schemas/chapitre.schema';
import { Icon } from './Icon';
import {
  articleDurationMin,
  contentTypeIcon,
  contentTypeLabel,
} from '@src/utils/article-meta';

export type SommaireEntry = {
  article: Article;
  chapitre: Chapitre;
  index: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  chapitres: readonly Chapitre[];
  entries: readonly SommaireEntry[];
  activeArticleId: number | null;
  onSelect: (entry: SommaireEntry) => void;
};

export function SommaireSheet({
  visible,
  onClose,
  chapitres,
  entries,
  activeArticleId,
  onSelect,
}: Props) {
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
      >
        <View style={{ flex: 1 }} />
      </Pressable>

      <SafeAreaView
        edges={['bottom']}
        style={{
          backgroundColor: colors.surfaceContainer,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          maxHeight: '80%',
          borderWidth: 1,
          borderColor: colors.outlineVariant,
          borderBottomWidth: 0,
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: 10 }}>
          <View
            style={{
              width: 44,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.outlineVariant,
            }}
          />
        </View>

        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <View className="flex-row items-center gap-2">
            <Icon name="list" size={14} color={colors.onSurfaceVariant} />
            <Text className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Sommaire
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer le sommaire"
            hitSlop={10}
          >
            <Icon name="close" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <View className="gap-4">
            {chapitres.map((chapitre) => {
              const chapitreEntries = entries.filter((e) => e.chapitre.id === chapitre.id);
              return (
                <View key={chapitre.id}>
                  <View className="mb-2 flex-row items-center gap-2">
                    <Text className="font-headline text-xs font-bold uppercase tracking-widest text-primary">
                      {chapitre.sortOrder}.
                    </Text>
                    <Text className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">
                      {chapitre.title}
                    </Text>
                  </View>
                  {chapitreEntries.length === 0 ? (
                    <Text className="pl-4 text-xs italic text-on-surface-variant">
                      Contenus à venir.
                    </Text>
                  ) : (
                    <View className="gap-1">
                      {chapitreEntries.map((entry) => (
                        <SommaireRow
                          key={entry.article.id}
                          entry={entry}
                          active={entry.article.id === activeArticleId}
                          onPress={() => onSelect(entry)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SommaireRow({
  entry,
  active,
  onPress,
}: {
  entry: SommaireEntry;
  active: boolean;
  onPress: () => void;
}) {
  const mins = articleDurationMin(entry.article);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      className={`flex-row items-start gap-3 squircle-lg px-3 py-2 ${
        active ? 'bg-surface-container-high' : ''
      }`}
      style={{
        borderLeftWidth: 2,
        borderLeftColor: active ? colors.primary : 'transparent',
      }}
    >
      <View
        className={`size-6 items-center justify-center squircle-md ${
          active ? 'bg-primary' : 'bg-surface-container-highest'
        }`}
      >
        <Icon
          name={contentTypeIcon(entry.article.type)}
          size={12}
          color={active ? colors.onPrimary : colors.onSurfaceVariant}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm text-on-surface ${active ? 'font-bold' : 'font-medium'}`}
          numberOfLines={2}
        >
          {entry.article.title}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Text className="font-mono text-[10px] text-on-surface-variant">
            {contentTypeLabel(entry.article.type)}
          </Text>
          {mins ? (
            <View className="flex-row items-center gap-0.5">
              <Icon name="time-outline" size={10} color={colors.onSurfaceVariant} />
              <Text className="font-mono text-[10px] text-on-surface-variant">{mins} min</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
