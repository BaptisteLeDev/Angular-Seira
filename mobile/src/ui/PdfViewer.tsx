import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StatusBar, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { resolvePdfUri } from '@src/constants/pdf';
import { colors } from '@src/constants/theme';
import { Icon } from './Icon';

type Props = {
  url: string | null | undefined;
  fileName?: string | null;
};

const PDFJS_VIEWER = 'https://mozilla.github.io/pdf.js/web/viewer.html';

export function PdfViewer({ url, fileName }: Props) {
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void resolvePdfUri(url).then((resolved) => {
      if (!cancelled) setUri(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const enterFullscreen = useCallback(() => setFullscreen(true), []);
  const exitFullscreen = useCallback(() => setFullscreen(false), []);

  if (!uri) {
    return (
      <View className="items-center squircle-xl bg-surface-container-low p-6 ghost-border">
        <Icon name="document-outline" size={28} color={colors.onSurfaceVariant} />
        <Text className="mt-2 font-mono text-xs text-on-surface-variant">
          Document indisponible
        </Text>
      </View>
    );
  }

  // pdf.js ne peut afficher que des URLs accessibles via HTTP(S). Pour un
  // file:// (asset local), on tombe dans le fallback message.
  const isRemote = /^https?:/i.test(uri);
  const viewerUrl = isRemote
    ? `${PDFJS_VIEWER}?file=${encodeURIComponent(uri)}`
    : null;

  const renderPdf = () => (
    <View style={{ flex: 1, backgroundColor: colors.surfaceContainerLowest }}>
      {viewerUrl ? (
        <WebView
          source={{ uri: viewerUrl }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setError('Impossible de charger le document.');
            setLoading(false);
          }}
          style={{ flex: 1, backgroundColor: colors.surfaceContainerLowest }}
        />
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Icon name="document-outline" size={32} color={colors.onSurfaceVariant} />
          <Text className="mt-3 text-center text-sm text-on-surface-variant">
            Le document est local et ne peut pas être prévisualisé. Utilise une
            URL publique pour l'affichage inline.
          </Text>
        </View>
      )}
      {loading && viewerUrl ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(5,5,6,0.6)',
          }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </View>
  );

  const header = (insideFullscreen: boolean) => (
    <View className="flex-row items-center justify-between bg-surface-container-low px-4 py-3">
      <View className="flex-1 pr-3">
        <Text className="font-headline text-sm font-bold text-on-surface" numberOfLines={1}>
          {fileName ?? 'Document PDF'}
        </Text>
        <Text className="font-mono text-[11px] text-on-surface-variant" numberOfLines={1}>
          {uri}
        </Text>
      </View>
      <Pressable
        onPress={insideFullscreen ? exitFullscreen : enterFullscreen}
        accessibilityRole="button"
        accessibilityLabel={insideFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
        className="size-9 items-center justify-center squircle-md bg-surface-container-high"
        hitSlop={6}
      >
        <Icon
          name={insideFullscreen ? 'contract-outline' : 'expand-outline'}
          size={16}
          color={colors.onSurface}
        />
      </Pressable>
    </View>
  );

  if (error) {
    return (
      <View className="items-center squircle-xl bg-surface-container-low p-6 ghost-border">
        <Icon name="alert-circle-outline" size={28} color={colors.error} />
        <Text className="mt-2 font-mono text-xs text-on-surface-variant" numberOfLines={3}>
          {error}
        </Text>
      </View>
    );
  }

  const inlineHeight = 480;

  return (
    <>
      {!fullscreen ? (
        <View className="overflow-hidden squircle-xl bg-surface-container-lowest ghost-border">
          {header(false)}
          <View style={{ height: inlineHeight }}>{renderPdf()}</View>
        </View>
      ) : null}

      <Modal visible={fullscreen} onRequestClose={exitFullscreen} animationType="fade">
        <StatusBar hidden />
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {header(true)}
          <View style={{ flex: 1 }}>{renderPdf()}</View>
        </View>
      </Modal>
    </>
  );
}
