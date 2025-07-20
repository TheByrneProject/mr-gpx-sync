import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

import { provideAnimations } from '@angular/platform-browser/animations';

import { importProvidersFrom } from '@angular/core';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { OverlayModule } from '@angular/cdk/overlay';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),

    importProvidersFrom(
      ClipboardModule,
      OverlayModule
    )
  ]
};
