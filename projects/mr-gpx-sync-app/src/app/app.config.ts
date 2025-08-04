import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

import { provideAnimations } from '@angular/platform-browser/animations';

import { importProvidersFrom } from '@angular/core';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { OverlayModule } from '@angular/cdk/overlay';
import {provideHttpClient, withFetch} from "@angular/common/http";
import { provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideHttpClient(
        withFetch()
    ),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: environment.production ? '/mr-gpx-sync/assets/i18n/' : '/assets/i18n/',
        suffix: '.json'
      }),
      fallbackLang: 'en-US',
      lang: 'en-US'
    }),
    importProvidersFrom(
      ClipboardModule,
      OverlayModule
    )
  ]
};
