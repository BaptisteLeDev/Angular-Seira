import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Icon } from './Icon';

type Props = {
  fallbackHref?: string;
  title?: string;
};

export function BackHeader({ fallbackHref = '/admin', title }: Props) {
  const router = useRouter();

  function onBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackHref as never);
    }
  }

  return (
    <View className="flex-row items-center gap-3 px-4 pb-2 pt-2">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        className="size-10 items-center justify-center rounded-full bg-surface-container ghost-border"
      >
        <Icon name="chevron-back" size={20} color="#fafafa" />
      </Pressable>
      {title ? (
        <Text className="font-headline text-base font-bold text-on-surface" numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}
