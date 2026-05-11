import { Pressable, TextInput, View } from 'react-native';

import { Icon } from '@src/ui/Icon';
import { useThemeColors } from '@src/ui/useThemeColors';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function SearchBar({ value, onChangeText, placeholder = 'Rechercher…', autoFocus }: Props) {
  const palette = useThemeColors();
  return (
    <View className="flex-row items-center gap-3 squircle-xl bg-surface-container px-4 py-3 ghost-border">
      <Icon name="search-outline" size={18} color={palette.onSurfaceVariant} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.onSurfaceVariant}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        className="flex-1 text-base"
        style={{ color: palette.onSurface }}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Icon name="close-circle" size={18} color={palette.onSurfaceVariant} />
        </Pressable>
      ) : null}
    </View>
  );
}
