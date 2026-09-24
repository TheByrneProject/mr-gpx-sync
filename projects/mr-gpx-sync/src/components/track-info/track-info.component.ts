import {Component, HostBinding, OnInit, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {Settings, TrackFile} from '../../gpx';
import {MrGpxSyncService} from '../../services/mr-gpx-sync.service';
import {ActionEvent} from '../../events/action-event';
import {ElevationPipe} from '../../pipes';
import {TrackEvent} from '../../events';
import { Subscription } from 'rxjs';

@Component({
  selector: 'mr-gpx-sync-track-info',
  standalone: true,
  template: `
    <div class="d-flex gap-2">
      <div class="md label">{{ track.fileName }}</div>
    </div>
    <div class="d-flex gap-2">
      <div class="align-items-center md label">Distance</div>
      <div class="md">{{ settings.getDistance(track.getTrack().distance) | number : '1.0-2' }} {{settings.distanceUnits}}</div>
    </div>
    <div class="d-flex gap-2">
      <div class="align-items-center md label">Duration</div>
      <div class="md">{{ track.getTrack().durationDisplay }}</div>
    </div>
    <div class="d-flex gap-2">
      <div class="align-items-center md label">Gain</div>
      <div class="md">{{ track.getTrack().eleGain | elevation }}</div>
    </div>
    <div class="d-flex gap-2">
      <div class="align-items-center md label">Loss</div>
      <div class="md">{{ track.getTrack().eleLoss | elevation }}</div>
    </div>
    @if (videoDuration > 0) {
      <div class="d-flex align-items-center gap-2 sync-pill" [class.green]="videoDuration === track.getTrack().duration">
        <div class="dot" [class.green]="videoDuration === track.getTrack().duration"></div>
        @if (videoDuration == track.getTrack().duration) {
          <div class="md label">Video = GPX</div>
        } @else if (videoDuration < track.getTrack().duration) {
          <div class="md label">Video {{videoDuration - track.getTrack().duration}} s shorter than GPX</div>
        } @else {
          <div class="md label">Video {{videoDuration - track.getTrack().duration}} s longer than GPX</div>
        }
      </div>
    }
  `,
  imports: [
    ElevationPipe,
    DecimalPipe
  ],
  styles: [`
    .dot {
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      background-color: red;
      border: 1px solid black;

      &.green {
        background-color: green;
      }
    }

    .sync-pill {
      background-color: rgba(255, 0, 0, 0.25);
      padding: 0.5rem;
      border-radius: 1.5rem;
      border: 1px solid gray;

      &.green {
        background-color: rgba(0, 255, 0, 0.25);
      }
    }
  `]
})
export class TrackInfoComponent implements OnInit, OnDestroy {

  @HostBinding('class') classes: string = 'd-flex flex-shrink-0 align-items-center gap-5 p-2';

  videoDuration: number = 0;
  settings: Settings = new Settings();
  track: TrackFile = new TrackFile();

  private subscriptions: Subscription[] = [];

  constructor(private mrGpxSyncService: MrGpxSyncService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    const trackSub = this.mrGpxSyncService.track$.subscribe((event: TrackEvent) => {
      this.track = event.track.loaded ? event.track : new TrackFile();
      this.changeDetectorRef.markForCheck();
    });
    this.subscriptions.push(trackSub);

    const settingsSub = this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
      this.changeDetectorRef.markForCheck();
    });
    this.subscriptions.push(settingsSub);

    const actionSub = this.mrGpxSyncService.action$.subscribe((event: ActionEvent) => {
      if (event.name === 'video-info') {
        this.videoDuration = event.data;
        this.changeDetectorRef.markForCheck();
      }
    });
    this.subscriptions.push(actionSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
