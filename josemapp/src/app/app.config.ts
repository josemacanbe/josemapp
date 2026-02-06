import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import { provideClientHydration } from '@angular/platform-browser';
import localeEs from '@angular/common/locales/es';

import { routes } from './app.routes';
import { TOKEN_PROVIDER } from './services/api.service';
import { AuthService } from './services/auth.service';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: TOKEN_PROVIDER, useExisting: AuthService },
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    provideClientHydration()
  ]
};
