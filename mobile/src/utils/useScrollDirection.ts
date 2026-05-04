import { useCallback, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const THRESHOLD = 8;

/**
 * Détecte le sens du scroll pour piloter l'apparition/disparition d'un FAB.
 * Visible quand on scroll vers le haut, caché quand on scroll vers le bas.
 */
export function useScrollDirection(initialVisible = true) {
  const [visible, setVisible] = useState(initialVisible);
  const lastY = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastY.current;

    if (y <= 0) {
      setVisible(true);
    } else if (delta > THRESHOLD) {
      setVisible(false);
    } else if (delta < -THRESHOLD) {
      setVisible(true);
    }
    lastY.current = y;
  }, []);

  return { visible, onScroll };
}
