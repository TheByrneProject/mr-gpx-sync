import { Component, HostBinding, OnInit } from '@angular/core';

import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { Settings } from '../gpx/settings';
import { TrackFile } from '../gpx/track-file';
import { ActionEvent } from '../events/action-event';
import { SecondsToTime } from '../pipes';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'mr-gpx-sync-info-sync',
  standalone: true,
  template: `
    <div class="d-flex p-2">
      <div class="w-25 align-items-center label">Distance</div>
      <div>{{ settings.getDistance(track.getTrack().distance) | number : '1.0-2' }} {{ settings.distanceUnits }}</div>
    </div>
    <div class="d-flex p-2">
      <div class="w-25 align-items-center label">GPX Duration</div>
      <div class="w-25">{{ track.getTrack().durationDisplay }}</div>
      <div class="w-25 align-items-center label">Video Duration</div>
      <div class="w-25">{{ videoDuration | secToTime : 'hhmmss' : true }}</div>
    </div>
    <div class="d-flex p-2">
      <div class="w-25 align-items-center label">Pace</div>
      <div>{{ settings.getPaceDisplay(track.getTrack().v) }} {{ settings.paceUnits }}</div>
    </div>
  `,
  imports: [
    SecondsToTime,
    DecimalPipe
  ],
  styles: [`
    .label {
      font-size: larger;
    }
  `]
})
export class InfoComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column';

  videoDuration: number = 0;
  track: TrackFile = new TrackFile();
  settings!: Settings;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.track$.subscribe((track: TrackFile) => {
      this.track = track.loaded ? track : new TrackFile();
    });
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
    this.mrGpxSyncService.action$.subscribe((event: ActionEvent) => {
      if (event.name === 'video-info') {
        this.videoDuration = event.data;
      }
    });
  }
}
