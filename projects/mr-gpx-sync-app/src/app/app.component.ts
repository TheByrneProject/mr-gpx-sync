import { Component, HostBinding } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { FaIconComponent, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { MrGpxSyncMenuBar, MrGpxSyncService, MrGpxSyncD3Map, MrGpxSyncChartWindow, MrGpxSyncVideoOverlay, Settings, TrackFile } from 'mr-gpx-sync';

@Component({
  selector: 'mr-gpx-sync-app',
  standalone: true,
  imports: [MrGpxSyncMenuBar, MrGpxSyncD3Map, MrGpxSyncChartWindow, MrGpxSyncVideoOverlay, FaIconComponent, NgIf],
  template: `
    <mr-gpx-sync-menu-bar></mr-gpx-sync-menu-bar>
    <mr-gpx-sync-d3-map></mr-gpx-sync-d3-map>
    <mr-gpx-sync-video-overlay [style.top]="settings.videoWindowTop" [style.left]="settings.videoWindowLeft"></mr-gpx-sync-video-overlay>
    <mr-gpx-sync-chart-window style="bottom: 2rem; right: 2rem;"></mr-gpx-sync-chart-window>
    
    <div *ngIf="!openedGpx" class="window" style="top: 2rem; left: 5rem; border-radius: 1rem; background-color: white;">
      <div class="window-content align-items-center gap-3 pointer p-3" style="border-radius: 1rem;" (click)="openGpx(true)">
        <fa-icon [icon]="['fas', 'location-dot']" size="2x"></fa-icon>
        <div class="">Open GPX</div>
      </div>
      <input type="file" id="gpx-upload" (change)="openGpxFileWizard($event)" style="display: none;">
    </div>
    
    <div *ngIf="openedGpx" class="window" style="top: 2rem; right: 2rem;">
      <div class="window-content p-3 gap-3 flex-row flex-nowrap" style="border-radius: 1rem;">
        <button class="btn sm btn-outline-secondary" (click)="undo()">
          <fa-icon [icon]="['fas', 'undo']"></fa-icon>
        </button>
        <button class="btn sm btn-outline-secondary" (click)="redo()">
          <fa-icon [icon]="['fas', 'redo']"></fa-icon>
        </button>
      </div>
    </div>
  `
})
export class AppComponent {

  @HostBinding('class') classes: string = 'outlet-row';

  openedGpx: boolean = false;
  settings: Settings = new Settings();

  constructor(private library: FaIconLibrary,
              private router: Router,
              private mrGpxSyncService: MrGpxSyncService) {
    library.addIconPacks(fas, far);
  }

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
    this.mrGpxSyncService.track$.subscribe((track: TrackFile) => {
      if (track.loaded) {
        this.openedGpx = true;
      }
    });

    /*this.mrGpxSyncService.action$.subscribe((event: ActionEvent) => {
      if (event.name === 'gpx-video-skipped') {
        this.router.navigate(['gpx-only']);
      } else if (event.name === 'gpx-video-loaded') {
        this.router.navigate(['gpx-video']);
      } else if (event.name === 'nav-new-project') {
        this.router.navigate(['home']);
      }
    });*/
    this.mrGpxSyncService.error$.subscribe((error: any) => {
      console.error(error);
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

  undo(): void {
    this.mrGpxSyncService.undo();
  }

  redo(): void {
    this.mrGpxSyncService.redo();
  }
}
