import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAbuseIpdb } from '@ip-tools/abuseipdb';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideAbuseIpdb({
      baseUrl: environment.abuseIpdbBaseUrl,
      mock: environment.useMock,
      concurrency: 4,
    }),
  ],
};
