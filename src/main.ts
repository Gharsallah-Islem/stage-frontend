import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/auth.interceptor';
// Merge the existing appConfig with the new interceptor provider
const updatedAppConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []), // Preserve existing providers
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};

bootstrapApplication(AppComponent, updatedAppConfig)
  .catch(err => console.error(err));