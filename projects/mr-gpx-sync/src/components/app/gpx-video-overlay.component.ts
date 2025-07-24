import { Component, HostBinding } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ActionEvent } from '../../events';
import { MrGpxSyncService } from '../../services';
import { VideoComponent } from '../video.component';
import { Settings } from '../../gpx/settings';

@Component({
  selector: 'mr-gpx-sync-video-overlay',
  template: `
    <div class="window-header">
      <fa-icon [icon]="['fas', 'ellipsis']" size="sm" class="drag-target"></fa-icon>
    </div>
    <div class="window-content p-3" style="width: fit-content;">
      <div class="d-flex flex-grow-1 flex-row align-items-center pointer" [class.d-none]="videoLoaded" (click)="openVideo()">
        <fa-icon [icon]="['fas', 'video']" size="2x"></fa-icon>
        <div class="ms-2" style="font-size: 1rem;">Open Video</div>
      </div>
      <mr-gpx-sync-video class="d-flex" [class.d-none]="!videoLoaded" [style.width]="settings.windows.videoWindow.width"></mr-gpx-sync-video>
    </div>

    <input type="file" id="video-upload" (change)="openVideoFileWizard($event)" style="display: none;">
  `,
  imports: [
    FaIconComponent,
    VideoComponent
  ],
  styles: []
})
export class MrGpxSyncVideoOverlay {

  @HostBinding('class') classes: string = 'window transparent white';

  settings!: Settings;
  videoLoaded: boolean = false;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });

    this.mrGpxSyncService.action$.subscribe((event: ActionEvent) => {
      if (event.name === 'open-video') {
        this.videoLoaded = true;
      }
    });
  }

  openVideo(): void {
    (document.getElementById('video-upload') as HTMLButtonElement).click();
  }

  openVideoFileWizard(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.mrGpxSyncService.action$.next(new ActionEvent('open-video', URL.createObjectURL(file)));
    }
  }
}
