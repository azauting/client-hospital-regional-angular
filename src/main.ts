import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import { environment } from './environments/environment';

import { App } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),

    provideToastr(
      { positionClass: 'toast-top-right', preventDuplicates: true },
    ),
    { provide: 'API_URL', useValue: environment.apiUrl },
    { provide: 'WITH_CREDENTIALS', useValue: environment.withCredentials }
  ]
});


