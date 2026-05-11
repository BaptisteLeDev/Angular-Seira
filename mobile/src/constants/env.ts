import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const ENV = {
  apiUrl:
    extra.apiUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    'http://localhost:8080/api',
  isDev: __DEV__,
};
