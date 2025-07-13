import { Component, HostBinding } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MrGpxSyncService } from '../../services';
import { ActionEvent } from '../../events/action-event';
import { TrackFile } from '../../gpx/track-file';

@Component({
  selector: 'nr-gpx-sync-new-project',
  imports: [
    FaIconComponent
  ],
  template: `
    <div class="d-flex flex-row w-50 justify-content-between m-auto">
      <button class="btn btn-secondary btn-vertical btn-10x" (click)="openGpx(true)">
        <fa-icon [icon]="['fas', 'location-dot']"></fa-icon>
        Open GPX
      </button>
      <div class="d-flex flex-column">
        <button class="btn btn-secondary btn-vertical btn-10x" (click)="openVideo()">
          <fa-icon [icon]="['fas', 'video']"></fa-icon>
          Open Video
        </button>
        <div (click)="skipVideo()">
          (skip video)
        </div>
      </div>
    </div>

    <input type="file" id="gpx-upload" (change)="openGpxFileWizard($event)" style="display: none;">
    <input type="file" id="video-upload" (change)="openVideoFileWizard($event)" style="display: none;">
  `
})
export class MrGpxSyncNewProject {

  @HostBinding('class') classes: string = 'outlet-row';

  gpxLoaded: number = 0;
  videoLoaded: number = 0;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.reset();

    this.mrGpxSyncService.track$.subscribe((track: TrackFile) => {
      this.gpxLoaded = (track.loaded) ? 1 : 0;

      if (this.gpxLoaded === 1 && this.videoLoaded > 0) {
        this.mrGpxSyncService.action$.next(new ActionEvent('gpx-video-loaded'));
      }
    });
    this.mrGpxSyncService.action$.subscribe((event: ActionEvent) => {
      if (event.source === 'new-project') {
        return;
      }

      console.log(event);
      if (event.name === 'open-video') {
        this.videoLoaded = 1;
      } else if (event.name === 'skip-video') {
        this.videoLoaded = 2;
      }

      if (this.gpxLoaded === 1 && this.videoLoaded === 1) {
        this.mrGpxSyncService.action$.next(new ActionEvent('gpx-video-loaded', {}, 'new-project'));
      } else if (this.gpxLoaded === 1 && this.videoLoaded === 2) {
        this.mrGpxSyncService.action$.next(new ActionEvent('gpx-video-skipped', {}, 'new-project'));
      }
    });
  }

  skipVideo(): void {
    this.mrGpxSyncService.action$.next(new ActionEvent('skip-video'));
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

  openVideo(): void {
    (document.getElementById('video-upload') as HTMLButtonElement).click();
  }

  openVideoFileWizard(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.mrGpxSyncService.action$.next(new ActionEvent('open-video', URL.createObjectURL(file)));
    }}
}
