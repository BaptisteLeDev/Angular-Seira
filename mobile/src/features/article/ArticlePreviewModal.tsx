import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@src/ui/Icon';
import { useThemeColors } from '@src/ui/useThemeColors';
import { contentTypeIcon, contentTypeLabel } from '@src/utils/article-meta';
import type { Article } from '@src/schemas/article.schema';

import { ArticleBody } from './ArticleBody';

type Props = {
  article: Article | null;
  onClose: () => void;
};

export function ArticlePreviewModal({ article, onClose }: Props) {
  const palette = useThemeColors();
  const visible = article != null;

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
        <View className="flex-row items-center justify-between border-b border-outline-variant px-5 py-3">
          <View className="flex-1 flex-row items-center gap-2">
            {article ? (
              <>
                <Icon
                  name={contentTypeIcon(article.type)}
                  size={14}
                  color={palette.onSurfaceVariant}
                />
                <Text className="font-headline text-xs font-bold uppercase tracking-[3px] text-on-surface-variant">
                  {contentTypeLabel(article.type)}
                </Text>
              </>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer la prévisualisation"
            className="size-9 items-center justify-center squircle-md bg-surface-container"
            hitSlop={6}
          >
            <Icon name="close" size={18} color={palette.onSurface} />
          </Pressable>
        </View>

        {article ? (
          <ScrollView
            style={{ backgroundColor: palette.background }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          >
            <Text className="mb-2 font-headline text-2xl font-extrabold text-on-surface">
              {article.title}
            </Text>
            {article.description ? (
              <Text className="mb-6 text-base leading-relaxed text-on-surface-variant">
                {article.description}
              </Text>
            ) : (
              <View className="mb-4" />
            )}
            <ArticleBody article={article} />
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
