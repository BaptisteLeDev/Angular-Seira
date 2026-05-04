import { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

import { colors } from '@src/constants/theme';
import { Icon, type IoniconName } from './Icon';

type Props = {
  visible: boolean;
  onPress: () => void;
  icon: IoniconName;
  accessibilityLabel: string;
  bottom?: number;
};

export function Fab({
  visible,
  onPress,
  icon,
  accessibilityLabel,
  bottom = 24,
}: Props) {
  const value = useRef(new Animated.Value(visible ? 0 : 100)).current;

  useEffect(() => {
    Animated.spring(value, {
      toValue: visible ? 0 : 100,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [visible, value]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={{
        position: 'absolute',
        right: 20,
        bottom,
        transform: [{ translateY: value }],
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Icon name={icon} size={24} color={colors.onPrimary} />
      </Pressable>
    </Animated.View>
  );
}
