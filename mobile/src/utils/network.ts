import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface NetStateLike {
  readonly isConnected: boolean | null;
  readonly isInternetReachable: boolean | null;
}

/**
 * Considère hors ligne uniquement si la connexion OU l'accès internet est
 * explicitement `false`. Un état inconnu (`null`) reste optimiste (en ligne)
 * pour éviter les fausses alertes au démarrage.
 */
export function isOnline(state: NetStateLike): boolean {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

/** Hook réactif : `false` quand l'appareil est hors ligne. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(isOnline(state));
    });
    return () => unsubscribe();
  }, []);
  return online;
}
