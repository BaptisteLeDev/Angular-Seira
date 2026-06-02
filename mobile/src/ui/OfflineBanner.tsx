import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOnline } from '@src/utils/network';
import { Icon } from './Icon';

/**
 * Bannière globale affichée quand l'appareil est hors ligne.
 * Montée une fois à la racine ; ne rend rien tant qu'on est en ligne.
 */
export function OfflineBanner() {
  const online = useOnline();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View
      style={{ paddingTop: insets.top }}
      className="absolute inset-x-0 top-0 z-50 bg-error"
      accessibilityLiveRegion="polite"
    >
      <View className="flex-row items-center justify-center gap-2 px-4 py-2">
        <Icon name="cloud-offline-outline" size={14} color="#fff" />
        <Text className="text-xs font-bold text-white">Hors ligne — contenu peut-être périmé</Text>
      </View>
    </View>
  );
}
