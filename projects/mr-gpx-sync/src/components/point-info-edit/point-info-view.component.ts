import { Component, HostBinding, OnInit, EventEmitter, Output, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { SecondsToTime } from '../../pipes';
import { Settings, TrackFile, TrackPoint } from '../../gpx';
import { MrGpxSyncService } from '../../services';
import { TrackEvent, TrackPointEvent } from '../../events';
import { Subscription } from 'rxjs';

@Component({
  selector: 'mr-gpx-sync-point-info-view',
  standalone: true,
  template: `
    <div class="d-flex flex-column h-100">
      <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
        <div class="label">Point #{{ p?.id }}</div>
        <div class="d-flex gap-1">
          <button class="btn btn-ghost sm" (click)="showEdit.emit()" title="Edit point options">
            <fa-icon [icon]="['fas', 'pencil']" size="sm"></fa-icon>
          </button>
          <button class="btn btn-ghost sm" (click)="deselect.emit()" title="Deselect point (Esc)">
            <fa-icon [icon]="['fas', 'x']" size="sm"></fa-icon>
          </button>
        </div>
      </div>
      <div class="flex-grow-1 d-flex flex-column gap-2 p-2">
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Lon / Lat</div>
          <div class="xs">{{ p?.lon }}, {{ p?.lat }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Elevation</div>
          <div class="xs">{{ settings.getElevationAsDisplay(p?.ele) }} {{ '(' + settings.eleUnits + ')' }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Time</div>
          <div class="xs">{{ p?.t | secToTime : track.getTrack().timeFormat }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Pace</div>
          <div class="xs">{{ settings.getPaceDisplay(p?.v) }} {{ '(' + settings.paceUnits + ')' }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label" nz-tooltip="Time delta to next point">dt</div>
          <div class="xs">{{ p?.dt }} s</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .label {
      min-width: 5rem;
      font-weight: 600;
      color: white;
    }
    .border-bottom {
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    }
    .xs {
      color: white;
    }
    .btn-ghost {
      color: white;
    }
  `],
  imports: [SecondsToTime, FaIconComponent, NzTooltipDirective]
})
export class PointInfoViewComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column';
  @Output() showEdit = new EventEmitter<void>();
  @Output() deselect = new EventEmitter<void>();

  track: TrackFile = new TrackFile();
  settings: Settings = new Settings();
  p: TrackPoint | undefined;

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
