import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  PLATFORM_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AuthInterceptorService } from './auth/auth-interceptor.service';
import { AuthService } from './auth/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { environment } from '../../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuthFactory,
      multi: true,
    },
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi(),
      withInterceptors([AuthInterceptorService]),
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
  ],
};

function initializeAuthFactory(): () => Promise<void> {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  return () => {
    // Skip auth initialization on server
    if (!isPlatformBrowser(platformId)) {
      return Promise.resolve();
    }
    return authService.initializeAuth();
  };
}
