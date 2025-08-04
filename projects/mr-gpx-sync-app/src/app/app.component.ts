import { Component, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { InfoWindowComponent, MrGpxSyncMenuBar, MrGpxSyncService, MrGpxSyncD3Map, MrGpxSyncChartWindow, MrGpxSyncMapTypeWindow, MrGpxSyncVideoOverlay, Settings,
  TrackEvent, DraggableDirective, TrackInfoWindowComponent, Undo } from 'mr-gpx-sync';
import {NzPopoverDirective} from "ng-zorro-antd/popover";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'mr-gpx-sync-app',
  standalone: true,
  imports: [MrGpxSyncMenuBar, MrGpxSyncD3Map, MrGpxSyncChartWindow, MrGpxSyncVideoOverlay, FaIconComponent, MrGpxSyncMapTypeWindow, DraggableDirective, InfoWindowComponent, TrackInfoWindowComponent, NzPopoverDirective, TranslatePipe],
  template: `
    <mr-gpx-sync-menu-bar></mr-gpx-sync-menu-bar>
    <mr-gpx-sync-d3-map></mr-gpx-sync-d3-map>
    
    <div class="lang-window">
      <img src="assets/icons/{{settings.lang}}.svg" width="32" height="32" alt="" nz-popover [nzPopoverContent]="langMenu" nzPopoverPlacement="top" />
      
      <ng-template #langMenu>
        <div class="d-flex flex-column lang-menu">
          @for (lang of langs; track lang) {
            <div class="d-flex flex-row gap-3 align-items-center lang-item" (click)="setLang(lang)">
              <img src="assets/icons/{{lang}}.svg" width="32" height="32" alt="" />
              <div>{{lang.substr(3, 2)}}</div>
            </div>
          }
        </div>
      </ng-template>
    </div>
    
    @if (openedGpx) {
      <mr-gpx-sync-video-overlay id="videoWindow" mrGpxSyncDraggable [style.top]="settings.windows.videoWindow.top" [style.left]="settings.windows.videoWindow.left"></mr-gpx-sync-video-overlay>
      <mr-gpx-sync-info-window id="infoWindow" mrGpxSyncDraggable [style.top]="settings.windows.infoWindow.top" [style.left]="settings.windows.infoWindow.left"></mr-gpx-sync-info-window>
      <mr-gpx-sync-track-info-window class="white" style="top: 1rem; left: 50%; transform: translateX(-50%);"></mr-gpx-sync-track-info-window>
      <mr-gpx-sync-map-type-window style="top: 2rem; left: 4rem;"></mr-gpx-sync-map-type-window>
      <mr-gpx-sync-chart-window id="chartWindow" mrGpxSyncDraggable windowPosition="bottom-right" [style.bottom]="settings.windows.chartWindow.bottom" [style.right]="settings.windows.chartWindow.right"></mr-gpx-sync-chart-window>
      
      <div class="window" style="top: 1rem; right: 5rem;">
        <div class="window-content p-3 gap-3 flex-row flex-nowrap" style="border-radius: 1rem;">
          <button class="btn sm btn-outline-secondary" [class.disabled]="undo.index === 0" (click)="doUndo()">
            <fa-icon [icon]="['fas', 'undo']"></fa-icon>
          </button>
          <button class="btn sm btn-outline-secondary" [class.disabled]="undo.index < undo.history.length - 1" (click)="doRedo()">
            <fa-icon [icon]="['fas', 'redo']"></fa-icon>
          </button>
        </div>
      </div>
    } @else {
      <div class="window" style="top: 2rem; left: 5rem; border-radius: 1rem; background-color: white;">
        <div class="window-content align-items-center gap-3 pointer p-3" style="border-radius: 1rem;" (click)="openGpx(true)">
          <fa-icon [icon]="['fas', 'location-dot']" size="2x"></fa-icon>
          <div class="">{{ 'menu.openGPX' | translate }}</div>
        </div>
        <input type="file" id="gpx-upload" (change)="openGpxFileWizard($event)" style="display: none;">
      </div>
    }
  `
})
export class AppComponent {

  @HostBinding('class') classes: string = 'outlet-row';

  langs: string[] = ['en-US', 'en-EN', 'fr-FR'];

  openedGpx: boolean = false;
  settings: Settings = new Settings();
  undo: Undo = new Undo();

  constructor(private library: FaIconLibrary,
              private router: Router,
              private translateService: TranslateService,
              private mrGpxSyncService: MrGpxSyncService) {
    library.addIconPacks(fas, far);
  }

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
    this.mrGpxSyncService.track$.subscribe((event: TrackEvent) => {
      if (event.track.loaded) {
        this.openedGpx = true;
      }
    });

    this.mrGpxSyncService.error$.subscribe((error: any) => {
      console.error(error);
    });

    this.mrGpxSyncService.undo$.subscribe((undo: Undo) => {
      this.undo = undo;
    });
  }

  openGpx(file: boolean, appendMode?: string): void {
    if (file) {
      (document.getElementById('gpx-upload') as HTMLButtonElement).click();
    } else {
      this.mrGpxSyncService.loading$.next(true);

      try {
        this.mrGpxSyncService.openClipboard(appendMode);
      } catch (error) {
        this.mrGpxSyncService.openSnackBar('Failed to parse gpx, check console.');
        console.error(error);
      }
    }
  }

  openGpxFileWizard(event: any): void {
    this.mrGpxSyncService.loading$.next(true);

    const file: File = event.target.files[0];
    if (file) {
      try {
        this.mrGpxSyncService.openGpx(file, undefined);
      } catch (error) {
        console.error(error);
        this.mrGpxSyncService.openSnackBar('Failed to parse gpx, check console.');
      }
    } else {
      this.mrGpxSyncService.openSnackBar('Failed to open, file is null.');
    }
  }

  doUndo(): void {
    this.mrGpxSyncService.undo();
  }

  doRedo(): void {
    this.mrGpxSyncService.redo();
  }

  setLang(lang: string) {
    this.translateService.use(lang);
    this.settings.lang = lang;
    this.mrGpxSyncService.updateSettings(this.settings);
  }
}
