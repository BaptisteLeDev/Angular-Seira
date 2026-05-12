const isProd = import.meta.env['NG_APP_PRODUCTION'] === 'true';

export const environment = {
  production: isProd,
  isDev: !isProd,
  apiUrl: import.meta.env['NG_APP_BACKEND_URL'] ?? 'http://localhost:8080/api',
};
