import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

import { provideAnimations } from '@angular/platform-browser/animations';

import { importProvidersFrom } from '@angular/core';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { OverlayModule } from '@angular/cdk/overlay';
import { provideHttpClient } from "@angular/common/http";
import { provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideHttpClient(),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
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
