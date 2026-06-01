import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authErrorInterceptor } from './core/interceptors/auth-error.interceptor';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { mergePatchInterceptor } from './core/interceptors/merge-patch.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([jwtInterceptor, mergePatchInterceptor, authErrorInterceptor]),
    ),
    provideRouter(routes, withComponentInputBinding()),
  ],
};
