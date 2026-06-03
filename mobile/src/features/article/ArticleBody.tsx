import { Linking, Pressable, Text, View } from 'react-native';

import { Icon, type IoniconName } from '@src/ui/Icon';
import { EmptyState } from '@src/ui/EmptyState';
import { VideoPlayer } from '@src/ui/VideoPlayer';
import { PdfViewer } from '@src/ui/PdfViewer';
import { MarkdownView } from '@src/ui/MarkdownView';
import { SpeakButton } from '@src/ui/SpeakButton';
import { useThemeColors } from '@src/ui/useThemeColors';
import type { Article } from '@src/schemas/article.schema';

type Props = {
  article: Article;
};

export function ArticleBody({ article }: Props) {
  const palette = useThemeColors();
  const body = article.content ?? article.description ?? null;

  return (
    <View className="gap-5">
      {article.type === 'video' ? (
        <VideoPlayer url={article.sourceUrl} videoId={article.videoId ?? null} />
      ) : null}

      {article.type === 'link' && article.sourceUrl ? (
        <LinkCard
          onPress={() => {
            void Linking.openURL(article.sourceUrl!);
          }}
          icon="link"
          iconBg="rgba(123,208,255,0.15)"
          iconColor={palette.primary}
          title="Ouvrir le lien"
          subtitle={article.sourceUrl}
        />
      ) : null}

      {article.type === 'pdf' ? (
        <PdfViewer url={article.filePath ?? article.sourceUrl} fileName={article.title} />
      ) : null}

      {article.type === 'file' && article.filePath ? (
        <LinkCard
          onPress={() => {
            void Linking.openURL(article.filePath!);
          }}
          icon="attach-outline"
          iconBg="rgba(123,208,255,0.1)"
          iconColor={palette.primary}
          title="Fichier joint"
          subtitle={article.filePath}
        />
      ) : null}

      {article.type === 'markdown' ? (
        body ? (
          <View className="gap-4">
            <View className="flex-row">
              <SpeakButton text={body} isMarkdown compact />
            </View>
            <MarkdownView>{body}</MarkdownView>
          </View>
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="Contenu en préparation"
            description="Cet article sera enrichi prochainement."
          />
        )
      ) : body ? (
        <Text className="text-base leading-relaxed text-on-surface">{body}</Text>
      ) : null}
    </View>
  );
}

function LinkCard({
  onPress,
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
}: {
  onPress: () => void;
  icon: IoniconName;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string | null;
}) {
  const palette = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border"
    >
      <View
        className="size-10 items-center justify-center squircle-lg"
        style={{ backgroundColor: iconBg }}
      >
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="font-headline text-base font-bold text-on-surface">{title}</Text>
        {subtitle ? (
          <Text
            className="font-mono text-[11px] text-on-surface-variant"
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Icon name="open-outline" size={16} color={palette.onSurfaceVariant} />
    </Pressable>
  );
}
