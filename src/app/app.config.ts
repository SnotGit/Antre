import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from '../core/interceptors/auth.interceptor';
import { errorInterceptor } from '../core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), 
    provideRouter(routes, 
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      }),
      withComponentInputBinding()
    ),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    )
  ]
};