import {ChangeDetectorRef, Component, HostBinding, OnInit, OnDestroy} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ActionEvent } from '../../events';
import { MrGpxSyncService } from '../../services';
import { VideoComponent } from '../video.component';
import { Settings } from '../../gpx/settings';
import {TranslatePipe} from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'mr-gpx-sync-video-overlay',
  template: `
    <div class="window-header">
      <fa-icon [icon]="['fas', 'ellipsis']" size="sm" class="drag-target"></fa-icon>
    </div>
    <div class="window-content p-2 video-content" style="width: fit-content;">
      <div class="d-flex flex-grow-1 flex-row align-items-center pointer" [class.d-none]="videoLoaded" (click)="openVideo()">
        <fa-icon [icon]="['fas', 'video']" size="2x"></fa-icon>
        <div class="ms-2" style="font-size: 1rem;">{{ 'menu.openVideo' | translate }}</div>
      </div>
      <mr-gpx-sync-video class="d-flex" [class.d-none]="!videoLoaded"></mr-gpx-sync-video>
    </div>

    <input type="file" id="video-upload" (change)="openVideoFileWizard($event)" style="display: none;">
  `,
  imports: [
    FaIconComponent,
    VideoComponent,
    TranslatePipe
  ],
  styles: [`
    .video-content {
      min-height: 300px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
    }
  `]
})
export class MrGpxSyncVideoOverlay implements OnInit, OnDestroy {

  @HostBinding('class') classes: string = 'window transparent white';

  settings!: Settings;
  videoLoaded: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(private mrGpxSyncService: MrGpxSyncService,
              private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    const settingsSub = this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
      this.changeDetectorRef.markForCheck();
    });
    this.subscriptions.push(settingsSub);

    const actionSub = this.mrGpxSyncService.action$.subscribe((event: ActionEvent) => {
      if (event.name === 'open-video') {
        this.videoLoaded = true;
        this.changeDetectorRef.markForCheck();
      }
    });
    this.subscriptions.push(actionSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
