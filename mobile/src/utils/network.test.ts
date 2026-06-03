import { isOnline } from './network';

describe('isOnline', () => {
  test('connecté + internet joignable -> en ligne', () => {
    expect(isOnline({ isConnected: true, isInternetReachable: true })).toBe(true);
  });
  test('non connecté -> hors ligne', () => {
    expect(isOnline({ isConnected: false, isInternetReachable: false })).toBe(false);
    expect(isOnline({ isConnected: false, isInternetReachable: null })).toBe(false);
  });
  test('internet explicitement injoignable -> hors ligne', () => {
    expect(isOnline({ isConnected: true, isInternetReachable: false })).toBe(false);
  });
  test('état inconnu (null) -> optimiste (en ligne), pas de fausse alerte', () => {
    expect(isOnline({ isConnected: true, isInternetReachable: null })).toBe(true);
    expect(isOnline({ isConnected: null, isInternetReachable: null })).toBe(true);
  });
});
