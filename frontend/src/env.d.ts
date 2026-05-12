declare interface Env {
  readonly NODE_ENV: string;
  readonly NG_APP_BACKEND_URL: string;
  readonly NG_APP_PRODUCTION: string;
  [key: string]: string | undefined;
}

declare interface ImportMeta {
  readonly env: Env;
}
