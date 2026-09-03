import { Component, HostBinding, OnInit, EventEmitter, Output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DecimalPipe } from '@angular/common';
import { SecondsToTime } from '../../pipes';
import { Settings, TrackFile, TrackPoint } from '../../gpx';
import { MrGpxSyncService } from '../../services';
import { TrackEvent, TrackPointEvent } from '../../events';

@Component({
  selector: 'mr-gpx-sync-multi-point-info-view',
  standalone: true,
  template: `
    <div class="d-flex flex-column h-100">
      <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
        <div class="label">{{ points.length }} Points Selected</div>
        <button class="btn btn-ghost sm" (click)="showEdit.emit()" title="Edit options">
          <fa-icon [icon]="['fas', 'pencil']" size="sm"></fa-icon>
        </button>
      </div>
      <div class="flex-grow-1 d-flex flex-column gap-2 p-2">
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">First Point</div>
          <div class="xs">#{{ points[0]?.id }} @ {{ getFirstDistance() | number: '1.2-2' }} {{ settings.distanceUnits }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Last Point</div>
          <div class="xs">#{{ points[points.length - 1]?.id }} @ {{ getLastDistance() | number: '1.2-2' }} {{ settings.distanceUnits }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Total Distance</div>
          <div class="xs">{{ getTotalDistance() | number: '1.2-2' }} {{ settings.distanceUnits }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Total Time</div>
          <div class="xs">{{ getTotalTime() | secToTime : 'hhmmss' }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Avg Velocity</div>
          <div class="xs">{{ getAvgVelocity() | number: '1.2-2' }} {{ settings.paceUnits }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Min Elevation</div>
          <div class="xs">{{ settings.getElevationAsDisplay(getMinElevation()) }} {{ '(' + settings.eleUnits + ')' }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Max Elevation</div>
          <div class="xs">{{ settings.getElevationAsDisplay(getMaxElevation()) }} {{ '(' + settings.eleUnits + ')' }}</div>
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
  imports: [SecondsToTime, FaIconComponent, DecimalPipe]
})
export class MultiPointInfoViewComponent implements OnInit {
  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column';
  @Output() showEdit = new EventEmitter<void>();

  track: TrackFile = new TrackFile();
  settings: Settings = new Settings();
  points: TrackPoint[] = [];

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.track$.subscribe((event: TrackEvent) => {
      this.track = event.track;
    });
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
    this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      this.points = e.p || [];
    });
  }

  private calculateCumulativeDistance(pointId: number): number {
    const track = this.track.getTrack();
    let distance = 0;
    for (let i = 0; i < pointId && i < track.trkPts.length; i++) {
      distance += track.trkPts[i].dx;
    }
    return this.settings.metric ? distance / 1000 : distance / 1609.34;
  }

  getFirstDistance(): number {
    if (this.points.length === 0) return 0;
    return this.calculateCumulativeDistance(this.points[0].id);
  }

  getLastDistance(): number {
    if (this.points.length === 0) return 0;
    return this.calculateCumulativeDistance(this.points[this.points.length - 1].id);
  }

  getTotalDistance(): number {
    if (this.points.length === 0) return 0;
    return this.getLastDistance() - this.getFirstDistance();
  }

  getTotalTime(): number {
    if (this.points.length === 0) return 0;
    const lastPoint = this.points[this.points.length - 1];
    const firstPoint = this.points[0];
    return lastPoint.t - firstPoint.t;
  }

  getAvgVelocity(): number {
    const totalTime = this.getTotalTime();
    const totalDistance = this.getTotalDistance();
    if (totalTime === 0 || totalDistance === 0) return 0;
    // Return pace in minutes per km (or per mile)
    return (totalTime / 60.0) / totalDistance;
  }

  getMinElevation(): number {
    if (this.points.length === 0) return 0;
    return Math.min(...this.points.map(p => p.ele));
  }

  getMaxElevation(): number {
    if (this.points.length === 0) return 0;
    return Math.max(...this.points.map(p => p.ele));
  }
}
