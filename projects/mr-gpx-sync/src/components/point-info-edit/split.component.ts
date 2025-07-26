import {Component, EventEmitter, HostBinding, OnInit, Output} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import { Subscription } from 'rxjs';
import { MrGpxSyncService } from '../../services';
import {Settings, TrackPoint, TrackSeg} from '../../gpx';
import {TrackPointEvent} from '../../events';
import {SecondsToTime} from '../../pipes';

@Component({
  selector: 'mr-gpx-sync-point-split',
  standalone: true,
  template: `
    <div class="d-flex align-items-center gap-5 p-2">
      <div class="sm label">Split</div>
      <div class="btn btn-sm" [class.btn-primary]="keepBefore" (click)="update(true)">Keep before</div>
      <div class="btn btn-sm" [class.btn-primary]="!keepBefore" (click)="update(false)">Keep after</div>
    </div>

    <div class="d-flex align-items-center gap-3 p-2">
      <div class="sm label">Values After Split</div>
    </div>
    <div class="d-flex align-items-center gap-3 p-2">
      <div class="sm label">Duration</div>
      <div class="sm">{{ duration }}</div>
    </div>
    <div class="d-flex align-items-center gap-3 p-2">
      <div class="sm label">Distance</div>
      <div class="sm">{{ distance | number : '1.0-2' }} {{ settings.distanceUnits }}</div>
    </div>

    <div class="d-flex justify-content-end gap-3 p-2">
      <button class="btn btn-secondary btn-sm" (click)="cancel()">Cancel</button>
      <button class="btn btn-primary btn-sm" (click)="split()">Save</button>
    </div>
  `,
  imports: [
    SecondsToTime,
    NzTooltipDirective,
    DecimalPipe
  ],
  styles: []
})
export class SplitComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column ww-400';

  @Output('cancel') cancelOutput = new EventEmitter<boolean>();

  settings: Settings;
  actionSubscription: Subscription;

  p: TrackPoint;
  track: TrackSeg;
  duration: string;
  distance: number;

  keepBefore: boolean = true;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });

    this.actionSubscription = this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      this.p = e.p[0] as TrackPoint;
      this.track = this.mrGpxSyncService.getTrack();
      this.update(true);
    });
  }

  cancel(): void {
    this.cancelOutput.emit(true);
  }

  update(keepBefore: boolean): void {
    this.keepBefore = keepBefore;

    let seg: TrackSeg = TrackSeg.from(this.track);
    seg.split(this.p, this.keepBefore);
    this.distance = seg.distance;
    this.duration = seg.durationDisplay;
  }

  split(): void {
    this.track.split(this.p, this.keepBefore);
    this.mrGpxSyncService.setTrackSeg(this.track);
    this.cancelOutput.emit(true);
  }
}
