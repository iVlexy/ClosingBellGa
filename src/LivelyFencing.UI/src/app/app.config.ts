import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { cfJwtInterceptor } from './core/interceptors/cf-jwt.interceptor';
import { TenantService } from './core/services/tenant.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([cfJwtInterceptor])),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: (tenant: TenantService) => () => tenant.load(),
      deps: [TenantService],
      multi: true
    }
  ]
};
