import { View, Text, type ViewStyle } from 'react-native';

type Props = {
  label: string;
  color: string;
  className?: string;
  style?: ViewStyle;
};

/**
 * Pastille colorée (catégorie de formation, etc.) — fond en color+1a, texte coloré.
 */
export function Chip({ label, color, className, style }: Props) {
  return (
    <View
      className={`rounded-full px-2.5 py-1 ${className ?? ''}`}
      style={[{ backgroundColor: `${color}1a` }, style]}
    >
      <Text
        className="font-headline text-[10px] font-bold uppercase tracking-widest"
        style={{ color }}
      >
        {label}
      </Text>
    </View>
  );
}
