import { Component, HostBinding, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {SecondsToTime} from '../../pipes';
import {Settings, TrackFile, TrackPoint} from '../../gpx';
import {MrGpxSyncService} from '../../services';
import {TrackEvent, TrackPointEvent} from '../../events';
import { Subscription } from 'rxjs';

@Component({
  selector: 'mr-gpx-sync-point-info',
  standalone: true,
  template: `
    <div class="d-flex p-2">
      <div class="w-25 align-items-center xs label">Lon / Lat</div>
      <div class="xs">{{ p?.lon }}, {{ p?.lat }}</div>
    </div>
    <div class="d-flex p-2">
      <div class="w-25 align-items-center xs label">Elevation</div>
      <div class="xs">{{ settings.getElevationAsDisplay(p?.ele) }} {{ '(' + this.settings.eleUnits + ')' }}</div>
    </div>
    <div class="d-flex p-2">
      <div class="w-25 align-items-center xs label">Time</div>
      <div class="xs">{{ p?.t | secToTime : track.getTrack().timeFormat }}</div>
    </div>
    <div class="d-flex p-2">
      <div class="w-25 align-items-center xs label">Pace</div>
      <div class="xs">{{ settings.getPaceDisplay(p?.v) }} {{ '(' + this.settings.paceUnits + ')' }}</div>
    </div>
    <div class="d-flex p-2">
      <div class="w-25 align-items-center xs label" nz-tooltip="Time delta to next point">dt</div>
      <div class="xs">{{ p?.dt }} s</div>
    </div>
  `,
  imports: [
    SecondsToTime,
    NzTooltipDirective
  ],
  styles: [`
    .label {
      min-width: 5rem;
    }
  `]
})
export class PointInfoComponent implements OnInit, OnDestroy {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column';

  track: TrackFile = new TrackFile();
  settings!: Settings;

  p!: TrackPoint;

  private subscriptions: Subscription[] = [];

  constructor(private mrGpxSyncService: MrGpxSyncService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    const trackSub = this.mrGpxSyncService.track$.subscribe((event: TrackEvent) => {
      this.track = event.track;
      this.changeDetectorRef.markForCheck();
    });
    this.subscriptions.push(trackSub);

    const settingsSub = this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
      this.changeDetectorRef.markForCheck();
    });
    this.subscriptions.push(settingsSub);

    const pointSub = this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      this.p = e.p.length > 0 ? e.p[0] : undefined;
      this.changeDetectorRef.markForCheck();
    });
    this.subscriptions.push(pointSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
